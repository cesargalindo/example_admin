import { Component, OnInit, OnDestroy, NgZone, Input, Output, EventEmitter } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { LocationTrackingService } from '../../services/LocationTrackingService';
import { VariablesService } from '../../services/VariablesService';
import template from './reactive-map.html';

@Component({
    selector: 'reactive-map',
    styles: [`
        .agm-map-container {
            height: 300px;
        }
        .map-search-results {
             overflow-x:visible; 
             overflow-y:auto;
             height:400px;
        }
    `],
    template,
    inputs: [
        'search_radius', 
        'dev_logging', 
        'query_name',
        'initial_zoom', 
        'data_source', 
        'filters', 
        'customMappingFunction',
        'searchEnabled'],
    })
export class ReactiveMapComponent implements Component, OnInit {
    
    //Events for the parent to listen to 
    @Output() userLocationUpdated = new EventEmitter();
    @Output() onMarkerClicked = new EventEmitter();

    /* Input parameters, passed via reactive-map directive */
    public search_radius: number=100;
    public dev_logging: boolean = false;
    public query_name: string = "";
    public initial_zoom: number = 10;
    public data_source: any = [];
    public filters: object = {};
    public customMappingFunction:string = "";
    public search_enabled: boolean;

    /* Properties */
    public debugOutput:string = "";
    public searchResults: any = [];
    public selectedId:string="";
    public myLocationIcon:string = this._varsService.styles['myLocationIcon'];
    public mapPointIcon:string = this._varsService.styles['mapPointIcon'];
    public myLocation: any; 
    public zoom: number; 
    public selectedIndex: number; 
    public myLocationType: string;
    public searchEnabled: boolean;
    /* Observers and streams */
    private latestLocationSnapshot: any;
    private socketDataStream: any;
    private reactiveDeviceLocation: any;

    constructor(public _locationTrackingService: LocationTrackingService,
                public _varsService: VariablesService,
                public _ngZone: NgZone) {
                    this.zoom = this.initial_zoom;
                    this.latestLocationSnapshot = this._locationTrackingService.getLocation();
                    this.updateLocation(this.latestLocationSnapshot);
                    this.search_enabled = this.searchEnabled;
                    //alert("construct");
                }



    // the default mapping function
    mappingFunction(x) {return x;}

    // update the current item when map point is clicked
    clickedMarker(_index) {
        this.selectedIndex =_index;
        this.onMarkerClicked.emit(_index); //Propagate to parent
        //let offset= document.getElementById(_id).offsetTop;
        //document.getElementById("results-list").scrollTo(offset);
    }
    useDeviceLocation() {
        this.myLocationType = "device";
        this._locationTrackingService.setDefaultSource("device");
        this._locationTrackingService.getUpdatedLocation(null); //Map will update when observable fires
    }

    useCustomLocation() {
        this.myLocationType = "custom";
        this._locationTrackingService.setDefaultSource("custom");
        
        //In this case the service wil already have the latest custom location, just get it and update
        var latest = this._locationTrackingService.getLocation();
        this.updateLocation(latest);
    }
    mapAndFilter(rawData: any) {
        var mappedResults= rawData.map((x) => {return this.mappingFunction(x)});
        return mappedResults;
    }

    updateLocation(locationSnapshotInfo) {
            this.myLocationType = locationSnapshotInfo.defaultToCustom ? "custom" : "device"
            this.myLocation = this.myLocationType == "custom" ? 
                locationSnapshotInfo.customPosition : 
                locationSnapshotInfo.lastKnownPosition;
            this.myLocation.search_radius = this.search_radius;
            //this.latestLocationSnapshot = locationSnapshotInfo;
            this.userLocationUpdated.emit(this.myLocation);
    }
    
    //Ensure that tracking service is running and subscribe to updates 
    ngOnInit() {
            this.reactiveDeviceLocation = this._locationTrackingService.getReactiveDeviceLocation();

            if (!this.latestLocationSnapshot.trackingEnabled)
                this._locationTrackingService.startTracking();

            this.reactiveDeviceLocation.subscribe(locationInfo => {
                        this.updateLocation(locationInfo);
            });
    }
    
}

import { Component, OnInit } from "@angular/core"
import { LocationTrackingService } from '../services/LocationTrackingService';
import { VariablesService } from '../services/VariablesService';

import template from './landing-page.html';

@Component({
    selector: 'landing-pate',
    template,
})
export class LandingPageComponent implements OnInit  {

    address: string;
    lat: number;
    lng: number;

    place: Object;

    searchEnabled: boolean = true;

    constructor(
        public _varsService: VariablesService,
        private _locationTrackingService: LocationTrackingService) {
    }


    ngOnInit() {

        // show top toolbar
        this._varsService.setReactiveHideToolbar(false);
        this._varsService.setReactiveTitleName('HOME');
        
        let loc = this._locationTrackingService.getLocation();

        if (loc.defaultToCustom) {
            this.lat = loc.customPosition.latitude;
            this.lng = loc.customPosition.longitude;
            this.address = 'custom-init...'
        }
        else {
            this.lat = loc.lastKnownPosition.latitude;
            this.lng = loc.lastKnownPosition.longitude;
            this.address = 'current-init...'
        }

    }

    /**
     * 
     * @param x 
     */
    customAddressSelected(x) {
        this.place = x.results.place;

        this.address = x.results.address;
        this.lat = x.results.latitude;
        this.lng = x.results.longitude;

        this._locationTrackingService.setCustomPosition(
            {
                latitude: x.results.latitude,
                longitude: x.results.longitude,
                accuracy: 10
            },
            true,
            {address: x.results.address}
        );
    }

}


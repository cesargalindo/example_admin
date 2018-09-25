import { Meteor } from 'meteor/meteor';
import { Component, EventEmitter, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { LocationTrackingService } from '../../services/LocationTrackingService';
import { SearchHistoryService } from '../../services/SearchHistoryService';

import template from './search-stores.html';

/**
 * Search and Select stores component
 * Results are outputted to storeList array
 *
 */
@Component({
    selector: 'search-stores',
    template,
    outputs: ['storeListEvent'],
    inputs: ['store_Error', 'default_Store'],
})
export class SearchStoresComponent implements OnInit {

    // Geolocation / Address variables
    lat: number;
    lng: number;
    address: string;

    input: any;
    autocomplete: any;

    singleStoreForm: FormGroup;
    stores: Array<any>;
    storeList: Array<any> = [];
    default_Store: Object;
    storeListEvent: EventEmitter<Array<any>>;

    clearStoreField: string;

    placeHolder: string;
    paceHolderStoreName: string;

    store_Error: boolean = false;

    hideme: Object = {};

    storeName: string;
    locationType: string;

    constructor(
        private _ngZone: NgZone,
        private formBuilder: FormBuilder,
        public _searchHistory: SearchHistoryService,
        public _locationTrackingService: LocationTrackingService
    ) {
        this.storeListEvent = new EventEmitter();
    }


    // tt sstore-3x - INPUT default_Store info and then OUTPUT new this.storeList to requestprices-ip
    ngOnChanges(changes) {
        console.log(changes);

        // Default store is only displayed - used when editing existing Requestprice
        if (changes.default_Store) {

            if (changes.default_Store.currentValue) {

                // Unhide default store in Store List
                this.hideme[this.default_Store.address] = 1;

                //Ensure storeList is not undefined
                if (this.storeList == undefined) {
                    this.storeList = [];
                }
                console.warn(this.default_Store.storeId + ' -- ' + this.default_Store.name + ' -- ' + this.default_Store.address);

                this.storeList.push({
                    storeId: this.default_Store.storeId,
                    name: this.default_Store.name,
                    address: this.default_Store.address,
                });

                // Set Storelist to pass form validation - actual values are not used when editing
                this.storeListEvent.emit(this.storeList);
            }

        }
    }


    ngOnInit() {
        this.stores = [];

        this.singleStoreForm = this.formBuilder.group({
            value: ['']
        });

        this.singleStoreForm.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .subscribe(searchTerm => {

                // Get latest coordinates
                this.getCoordinates();

                // Retrieve matching stores - call mongoDB directly, avoid sub/pub
                Meteor.call('getStores', searchTerm.value, this.lat, this.lng,  (error, res) => {

                    // run inside Angular2 world
                    this._ngZone.run(() => {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            this.stores = res;
                        }
                    });

                });
                return searchTerm;
            });

    }


    removeSelectedStore(storeInfo) {
        let index = 0;

        for (let i = 0; i < this.storeList.length; i++) {
            if (this.storeList[i].storeId == storeInfo.storeId) {
                index = i;
            }
        }

        this.storeList.splice( index, 1 );
        this.storeListEvent.emit(this.storeList);
    }


    addSelectedStore(storeInfo) {
        // Display store
        this.hideme[storeInfo.address] = 1;

        this.storeList.push({
            storeId: storeInfo._id,
            name: storeInfo.name,
            address: storeInfo.address,
        });

        this.storeListEvent.emit(this.storeList);
    }


    /**
     * Retrieve lat on lon from lastKnownPosition or customPosition
     *
     */
    getCoordinates() {
        let loc = this._locationTrackingService.getLocation();

        if (loc.defaultToCustom) {
            this.lat = loc.customPosition.latitude;
            this.lng = loc.customPosition.longitude;
        }
        else {
            this.lat = loc.lastKnownPosition.latitude;
            this.lng = loc.lastKnownPosition.longitude;
        }
    }
}


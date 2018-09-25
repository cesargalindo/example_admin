import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Component, OnInit, NgZone }   from '@angular/core';
import { Observable } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router }  from '@angular/router';

import { Store } from '../../../../both/models/store.model';
import { LocationTrackingService } from '../services/LocationTrackingService';
import { VariablesService } from '../services/VariablesService';

import template from './stores-list.html';

@Component({
    selector: 'stores-list',
    template,
})

export class StoresListComponent implements OnInit {
    stores: Mongo.Cursor<Store>;

    // Geolocation
    lat: number;
    lng: number;
    searchEnabled: boolean = true;

    pageSize: number = 15;
    nameOrder: number = 1;
    searchTerm: string = '';

    asyncStores: Observable<string[]>;
    theseStores = [];

    p: number = 1;
    total: number;

    storesForm: FormGroup;

    place: any;

    subItems: Observable<any>;          // Retrieve through Apollo

    message: string;
    error: string;
    display_spinner: boolean = false;    

    constructor(
        public _varsService: VariablesService,
        private formBuilder: FormBuilder,
        private router: Router,
        private _locationTrackingService: LocationTrackingService,
        private _ngZone: NgZone) { }


    ngOnInit() {
        this._varsService.setReactiveTitleName('STORES');
        this.getPage(1, '');

        this.storesForm = this.formBuilder.group({
            name: [''],
            chainName: [''],
            chainLocationId: ['']
        });

        this.storesForm.valueChanges
            .debounceTime(300)
            .distinctUntilChanged()
            .subscribe(searchTerm => {
                if (searchTerm.name != undefined) {
                    this.searchTerm = searchTerm.name;
                }
                return searchTerm;
            });
    }

    getPage(page: number, searchTerm: string) {
        this.display_spinner = true;

        if (searchTerm != undefined) {
            this.searchTerm = searchTerm;
        }

        this.asyncStores = this.getPageInfo(page);

        this.asyncStores.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                this.total = x.total;
                this.p = page;
                this.display_spinner = false;
                this.theseStores = x.storesList;
            });
        })
    }


    getPageEvent(page) {
        this.display_spinner = true;
        this.asyncStores = this.getPageInfo(page);
        this.asyncStores.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                this.total = x.total;
                this.p = page;
                this.display_spinner = false;
                this.theseStores = x.storesList;
            });
        })
    }


    getPageInfo(page) {

        let options = {
            limit: this.pageSize,
            skip: (page - 1) * this.pageSize,
            sort: {name: this.nameOrder},
        };

        return new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            // Get latest coordinates
            this.getCoordinates();

            Meteor.call('getStoresNew', options, this.searchTerm,  this.lat, this.lng, (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    // console.log( btoa(res.storeIds[0]) );
                    observer.next(res);
                    observer.complete();
                }
            });

        });
    }


    applyFilter() {
        this.getPage(1, this.searchTerm);
    }


    // CHeck if Google ID exist in Stores collection
    addGoogleStore() {
        this.error = '';
        this.message = '';

        if ( this.place.formatted_phone_number == undefined) {
            this.error = 'Selected location is not a valid merchant.';
        }
        else {

            this.display_spinner = true;

            this.subItems = new Observable.create(observer => {
                // Retrieve matching stores - call mongoDB directly, avoid sub/pub
                Meteor.call('checkStoreGID', this.place.id, (error, res) => {
                    if (error) {
                        console.log(error);
                        this.display_spinner = false;
                    }
                    else {
                        console.log(res);

                        observer.next(res);
                        observer.complete();
                    }
                });
            });


            this.subItems.subscribe(x => {
                if (x.length) {
                    this.message = 'This store already exist!';
                    this.display_spinner = false;
                }
                else {
                    let website = '';
                    console.log(this.place.website);
                    if (this.place.website != undefined) {
                        website = this.place.website;
                    }

                    let hours = '';
                    if (this.place.opening_hours != undefined) {
                        hours = this.place.opening_hours.weekday_text[0] + ',' + this.place.opening_hours.weekday_text[1] + ',' + this.place.opening_hours.weekday_text[2] + ','  + this.place.opening_hours.weekday_text[3] + ',' + this.place.opening_hours.weekday_text[4] + ',' + this.place.opening_hours.weekday_text[5] + ',' + this.place.opening_hours.weekday_text[6];
                        console.log(this.place.opening_hours);
                    }
                    let ns = <Store>{};
                    ns.gid = this.place.id;
                    ns.name = this.place.name;
                    ns.address = this.place.formatted_address;
                    ns.phoneNumber = this.place.formatted_phone_number;
                    ns.website = website;
                    ns.hours = hours;
                    ns.chainName = '';
                    ns.chainLocationId = '';

                    if (this.storesForm.value.chainName && (this.storesForm.value.chainName != undefined) ) {
                        ns.chainName = this.storesForm.value.chainName;
                    }
                    if (this.storesForm.value.chainLocationId && (this.storesForm.value.chainLocationId != undefined) ) {
                        ns.chainLocationId = this.storesForm.value.chainLocationId;
                    }

                    ns.location = {
                        coordinates: [ this.place.geometry.location.lng(), this.place.geometry.location.lat() ],
                        type: 'Point'
                    };
                    ns.public = 1;
                    ns.note =  'insert-new';

                    Meteor.call('stores.insert', ns, (err, res) => {

                        this._ngZone.run(() => { // run inside Angular2 world
                            this.display_spinner = false;

                            if (err) {
                                console.error("!!!!!!!! GO AN ERROR ON: Store.methods.insert !!!!!!!!!");
                                console.error(err);
                                this.error = 'ERROR 1: unable to add selected store - ' + err;
                            }
                            else {
                                if (!res.status) {
                                    console.error('!!!!!!!! ERROR ON: Unable to add new store' + res.error);
                                    console.error(err);
                                    this.error = 'ERROR 2: unable to add selected store - ' + err;
                                }
                                else {
                                    this.message = 'Successfully added store: ' + this.place.name + ', ' + this.place.formatted_address;
                                }
                            }
                        });

                    });
                }

            });
        }



    }


    customAddressSelected(x) {
        this.place = x.results.place;

        console.warn(x);
        console.log('####### 888 ######' + x.results.longitude + ", " + x.results.latitude + ' -- ' +   x.results.address);
    }


    editStore(s) {
        this.router.navigate(['/store-edit', { storeId: s._id }]);
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


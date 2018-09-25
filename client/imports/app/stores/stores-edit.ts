import { Meteor } from 'meteor/meteor';
import { Component, OnInit, NgZone }   from '@angular/core';
import { ActivatedRoute }  from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Rx';
import { VariablesService } from '../services/VariablesService';
import { SnackbarService } from '../services/SnackbarService';

import { Store } from '../../../../both/models/store.model';

import template from './stores-edit.html';


@Component({
    selector: 'stores-edit',
    template,
})
export class StoresEditComponent implements OnInit {
    editStoreForm: FormGroup;
    storeId: string;
    manualCoordinates: boolean = true;

    asyncStore: Observable<string[]>;
    oldAddress: String;
    display_spinner: boolean = false;

    stateValue: string;
    states = [
        { name: 'AL', val: 'AL' },
        { name: 'AK', val: 'AK' },
        { name: 'AZ', val: 'AZ' },
        { name: 'AR', val: 'AR' },
        { name: 'CA', val: 'CA' },
        { name: 'CO', val: 'CO' },
        { name: 'CT', val: 'CT' },
        { name: 'DE', val: 'DE' },
        { name: 'DC', val: 'DC '},
        { name: 'FL', val: 'FL' },
        { name: 'GA', val: 'GA' },
        { name: 'HI', val: 'HI' },
        { name: 'ID', val: 'ID' },
        { name: 'IL', val: 'IL' },
        { name: 'IN', val: 'IN' },
        { name: 'IA', val: 'IA' },
        { name: 'KS', val: 'KS' },
        { name: 'KY', val: 'KY' },
        { name: 'LA', val: 'LA' },
        { name: 'ME', val: 'ME' },
        { name: 'MD', val: 'MD' },
        { name: 'MA', val: 'MA' },
        { name: 'MI', val: 'MI' },
        { name: 'MN', val: 'MN' },
        { name: 'MS', val: 'MS' },
        { name: 'MO', val: 'MO' },
        { name: 'MT', val: 'MT' },
        { name: 'NE', val: 'NE' },
        { name: 'NV', val: 'NV' },
        { name: 'NH', val: 'NH' },
        { name: 'NJ', val: 'NJ' },
        { name: 'NM', val: 'NM' },
        { name: 'NY', val: 'NY' },
        { name: 'NC', val: 'NC' },
        { name: 'ND', val: 'ND' },
        { name: 'OH', val: 'OH' },
        { name: 'OK', val: 'OK' },
        { name: 'OR', val: 'OR' },
        { name: 'PA', val: 'PA' },
        { name: 'RI', val: 'RI' },
        { name: 'SC', val: 'SC' },
        { name: 'SD', val: 'SD' },
        { name: 'TN', val: 'TN' },
        { name: 'TX', val: 'TX' },
        { name: 'UT', val: 'UT' },
        { name: 'VT', val: 'VT' },
        { name: 'VA', val: 'VA' },
        { name: 'WA', val: 'WA' },
        { name: 'WV', val: 'WV' },
        { name: 'WI', val: 'WI' },
        { name: 'WY', val: 'WY' },
    ];

    error: string;
    success: string;

    constructor(
        public _snackbar: SnackbarService,
        public _varsService: VariablesService,
        private route: ActivatedRoute,
        private _ngZone: NgZone,
        private formBuilder: FormBuilder) { }



    ngOnInit() {
        this._varsService.setReactiveTitleName('EDIT STORE');

        // Monitor reactiveLogin using an Observable subject
        let reactiveError  =  this._varsService.getReactiveError();
        reactiveError.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (x) {
                    this.display_spinner = false;
                    this._snackbar.displaySnackbar(1);

                }
            });
        });

        this.route.params.subscribe((params) => {

            console.log("^^^^^^^^ BUILD FORM NOW ^^^^^^^^^ " + params['storeId']);
            this.editStoreForm = this.formBuilder.group({
                name: ['', Validators.required],
                address: ['', Validators.required],
                city: ['', Validators.required],
                state: [''],
                zip: ['', Validators.required],
                phoneNumber: [''],
                website: [''],
                hours: [''],
                lat: [0],
                lng: [0],
                public: [1],
                manualCoordinates: [false],
                chainName: [''],
                chainLocationId: [''],
                image: ['']                
            });

            console.error(params);

            // Edit existing store
            if (params['storeId']) {
                this.storeId = params['storeId'];

                this.asyncStore = this.getStore(this.storeId)
                    .map(res => {

                        console.log('********************** 11 11 ********************* ' + res.public );

                        this.editStoreForm.patchValue({
                            name: res.name,
                            phoneNumber: res.phoneNumber,
                            website: res.website,
                            hours: res.hours,
                            public: res.public,
                            chainName: res.chainName,
                            chainLocationId: res.chainLocationId,
                            image: res.image
                        });

                        this.oldAddress = res.address;
                        let partsOfAddress = res.address.split(',');

                        let stateZip = partsOfAddress[2].split(' ');
                        console.log(stateZip);

                        this.stateValue = stateZip[1];

                        this.editStoreForm.patchValue({
                            address: partsOfAddress[0],
                            city: partsOfAddress[1],
                            zip: stateZip[2],
                            lat: res.location.coordinates[1],
                            lng: res.location.coordinates[0]
                        });
                    });

            }
            else {
                // enter default state
                this.stateValue = 'CA';
            }


        });
    }


    getStore(storeId) {
        return new Observable.create(observer => {

            let promise = new Promise((resolve) => {
                // Retrieve matching items - call mongoDB directly, avoid sub/pub
                Meteor.call('getStore', storeId, (error, res) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        resolve(res);
                    }
                });
            });

            promise.then(results => {
                console.log(results);
                observer.next(results[0]);
                observer.complete();
            });
        });
    }


    /**
     * tt Stores with no coordinates or = 0, have public field = 0
     *
     * 1) check if address changed
     * 2a) if address changed -  Make Google Address API call to get new coordinates
     * 2b) update store info skipping coordinates
     *
     * 3a) if lat = 0 -  Make Google Address API call to get new coordinates
     * 3b) update store info with new coordinates too
     *
     */
    EditStore() {

        this.error = '';
        this.success = '';

        if (this.editStoreForm.valid) {

            // Start displaying progress image
            this._snackbar.resetSnackbar();

            console.log('Editing store now... manual = ' +  this.editStoreForm.value.manualCoordinates + '  public=' + this.editStoreForm.value.public);

            let address = this.editStoreForm.value.address + ', ' + this.editStoreForm.value.city + ', ' +  this.stateValue  + ' ' + this.editStoreForm.value.zip;
            console.log(address);

            // Check if address changes - Check if coordinates changed
            if (address.toLowerCase().replace(/ /g, "") == this.oldAddress.toLowerCase().replace(/ /g, "") && (this.editStoreForm.value.lat != 0) && !this.editStoreForm.value.manualCoordinates ) {
                console.log("===> ADDRESS IS THE SAME...");
                console.log("NewAddres: " + address.toLowerCase().replace(/ /g, ""));
                console.log("OldAddress: " + this.oldAddress.toLowerCase().replace(/ /g, ""));

                let su = <Store>{};
                su._id = this.storeId;
                su.name = this.editStoreForm.value.name;
                su.phoneNumber = this.editStoreForm.value.phoneNumber;
                su.website = this.editStoreForm.value.website;
                su.hours = this.editStoreForm.value.hours;
                su.public = this.editStoreForm.value.public;
                su.note = 'update';

                su.image = '';
                if (this.editStoreForm.value.image && (this.editStoreForm.value.image != undefined) ) {
                    su.image = this.editStoreForm.value.image;             
                }

                su.chainName = '';
                su.chainLocationId = '';
                if (this.editStoreForm.value.chainName && (this.editStoreForm.value.chainName != undefined) ) {
                    su.chainName = this.editStoreForm.value.chainName;
                }
                if (this.editStoreForm.value.chainLocationId && (this.editStoreForm.value.chainLocationId != undefined) ) {
                    su.chainLocationId = this.editStoreForm.value.chainLocationId;
                }

                Meteor.call('stores.update', su, (err, res) => {

                    this._ngZone.run(() => { // run inside Angular2 world
                        this.display_spinner = false;

                        if (err) {
                            console.error("!!!!!!!! GO AN ERROR ON: Store.methods 12 !!!!!!!!!");
                            console.error(err);
                            this._varsService.setReactiveError();
                            this.error = err;
                            return;
                        }
                        else {
                            if (!res.status) {
                                console.error("!!!!!!!! ERROR ON: Store.update...12- " + res.error);
                                this.error = res.error;
                                this._varsService.setReactiveError();
                                return;
                            }
                            else {
                                if (su.note == 'update-coordinates') {
                                    // Geo coordinates are stored with corresponding prices in Elastic search
                                    // TODO: get list of all prices matching this storeId and update coordinates on each Price in Elasticsearch
                                    // Meteor.call('elasticSearchPricesCoordinates.update', newStore);
                                }
                                console.log("SUCCESSFULLY UPDATED STORE...");
                                this.success = 'Successfully updated store.';
                            }
                        }
                    });

                });

            }
            else {
                console.log("===> Address is not the same....");
                console.log("NewAddres: " + address.toLowerCase().replace(/ /g, ""));
                console.log("OldAddress: " + this.oldAddress.toLowerCase().replace(/ /g, ""));

                // Make Google Address API call to get new coordinates

                let promise = new Promise((resolve) => {
                    if (this.editStoreForm.value.manualCoordinates) {
                        let coords = {
                            result: true,
                            lat: parseFloat(this.editStoreForm.value.lat),
                            lng:parseFloat(this.editStoreForm.value.lng)
                        };
                        resolve(coords);
                    }
                    else {
                        Meteor.call('getCoordinates', this.editStoreForm.value.address, this.editStoreForm.value.city, this.stateValue, (error, res) => {
                            if (error) {
                                console.log(error);
                            }
                            else {
                                resolve(res);
                            }
                        });
                    }
                });

                promise.then(results => {
                    console.log('Editing store now... manual = ' +  this.editStoreForm.value.manualCoordinates + '  public=' + this.editStoreForm.value.public);
                    console.log(results);

                    let address = this.editStoreForm.value.address + ', ' + this.editStoreForm.value.city + ', ' +  this.stateValue  + ' ' + this.editStoreForm.value.zip;
                    console.log(address);

                    if (results.result) {

                        let su = <Store>{};
                        su._id = this.storeId;
                        su.name = this.editStoreForm.value.name;
                        su.phoneNumber = this.editStoreForm.value.phoneNumber;
                        su.website = this.editStoreForm.value.website;
                        su.hours = this.editStoreForm.value.hours;
                        su.public = this.editStoreForm.value.public;
                        su.note = 'update-coordinates';

                        su.address = address;
                        su.location = {
                            coordinates: [results.lng, results.lat],
                            type: 'Point'
                        };

                        su.image = '';
                        if (this.editStoreForm.value.image && (this.editStoreForm.value.image != undefined) ) {
                            su.image = this.editStoreForm.value.image;             
                        }
                        
                        su.chainName = '';
                        su.chainLocationId = '';
                        if (this.editStoreForm.value.chainName && (this.editStoreForm.value.chainName != undefined) ) {
                            su.chainName = this.editStoreForm.value.chainName;
                        }
                        if (this.editStoreForm.value.chainLocationId && (this.editStoreForm.value.chainLocationId != undefined) ) {
                            su.chainLocationId = this.editStoreForm.value.chainLocationId;
                        }

                        Meteor.call('stores.update', su, (err, res) => {
                            this._ngZone.run(() => { // run inside Angular2 world
                                this.display_spinner = false;

                                if (err) {
                                    console.error("!!!!!!!! GO AN ERROR ON: Store.methods 12 !!!!!!!!!");
                                    console.error(err);
                                    this._varsService.setReactiveError();
                                    this.error = err;
                                    return;
                                }
                                else {
                                    if (!res.status) {
                                        console.error("!!!!!!!! ERROR ON: Store.update...12- " + res.error);
                                        this._varsService.setReactiveError();
                                        this.error = res.error;
                                        return;
                                    }
                                    else {

                                        if (su.note == 'update-coordinates') {
                                            // Geo coordinates are stored with corresponding prices in Elastic search
                                            // TODO: get list of all prices matching this storeId and update coordinates on each Price in Elasticsearch
                                            // Meteor.call('elasticSearchPricesCoordinates.update', newStore);
                                        }

                                        console.log("SUCCESSFULLY UPDATED STORE...");
                                        this.success = 'Successfully updated store.';
                                    }
                                }
                            });
                        });

                    }
                    else {
                        alert('ERROR: unable to generate coordinates for this address from Google API.');
                    }


                });

            }
        }

    }




    /**
     * Do Not add store if coordinates can't be generated by Google API
     *
     */
    AddStore() {

        this.error = '';
        this.success = '';

        if (this.editStoreForm.valid) {

            // Start displaying progress image
            this._snackbar.resetSnackbar();

            alert('Inserting store now... manual = ' +  this.editStoreForm.value.manualCoordinates + '  public=' + this.editStoreForm.value.public);
            console.log(this.editStoreForm.value);

            let address = this.editStoreForm.value.address + ', ' + this.editStoreForm.value.city + ', ' +  this.stateValue  + ' ' + this.editStoreForm.value.zip;
            console.log(address);

            // Make Google Address API call to get new coordinates
            let promise = new Promise((resolve) => {
                if (this.editStoreForm.value.manualCoordinates) {
                    let coords = {
                        result: true,
                        lat: parseFloat(this.editStoreForm.value.lat),
                        lng:parseFloat(this.editStoreForm.value.lng)
                    };
                    resolve(coords);
                }
                else {
                    Meteor.call('getCoordinates', this.editStoreForm.value.address, this.editStoreForm.value.city, this.stateValue, (error, res) => {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            resolve(res);
                        }
                    });
                }
            });

            promise.then(results => {
                console.log(results);

                alert('Editing store now... manual = ' +  this.editStoreForm.value.manualCoordinates + '  public=' + this.editStoreForm.value.public);
                console.log(this.editStoreForm.value);

                let address = this.editStoreForm.value.address + ', ' + this.editStoreForm.value.city + ', ' +  this.stateValue  + ' ' + this.editStoreForm.value.zip;
                console.log(address);

                if (results.result) {

                    this.display_spinner = true;

                    let ns = <Store>{};
                    ns.gid = '';
                    ns.name = this.editStoreForm.value.name;
                    ns.address = address;
                    ns.phoneNumber = this.editStoreForm.value.phoneNumber;
                    ns.website = this.editStoreForm.value.website;
                    ns.hours = this.editStoreForm.value.hours;
                    ns.location = {
                        coordinates: [ results.lng, results.lat ],
                        type: 'Point'
                    };
                    ns.public = this.editStoreForm.value.public;
                    ns.note = 'insert-new';

                    Meteor.call('stores.insert', ns, (err, res) => {
                        this._ngZone.run(() => { // run inside Angular2 world
                            this.display_spinner = false;

                            if (err) {
                                console.error("!!!!!!!! GO AN ERROR ON: Store.methods.insert !!!!!!!!!");
                                console.error(err);
                                this._varsService.setReactiveError();
                                this.error = err;
                            }
                            else {
                                if (!res.status) {
                                    console.error("!!!!!!!! ERROR ON: Unable to insert new store" + res.error);
                                    console.error(err);
                                    this._varsService.setReactiveError();
                                    this.error = res.error;
                                }
                                else {
                                    console.log("SUCCESSFULLY INSERTED NEW STORE...");
                                    this.success = 'Succefully added new store.';
                                }
                            }
                        });
                    });

                }
                else {
                    alert('ERROR: unable to generate coordinates for this address from Google API.');
                }


            });

        }

    }



    clickedManualCoords() {
        alert(this.editStoreForm.value.manualCoordinates);
        this.manualCoordinates =  this.editStoreForm.value.manualCoordinates;
    }
}

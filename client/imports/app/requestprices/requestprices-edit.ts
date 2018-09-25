import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit, AfterContentChecked }   from '@angular/core';
import { ActivatedRoute, Router }  from '@angular/router';
import { Observable } from "rxjs";

import { FormGroup, FormBuilder } from '@angular/forms';

import { Prices } from '../../../../both/collections/prices.collection';
import { Price } from '../../../../both/models/price.model';
import { Item } from '../../../../both/models/item.model';
import { Store } from '../../../../both/models/store.model';
import { RequestPrice } from '../../../../both/models/requestprice.model';
import { SliderSettings } from '../../../../both/models/helper.models';

import { VariablesService } from '../services/VariablesService';
import { SingleCollectionService } from "../services/SingleIdCollection.data.service";
import { SnackbarService } from '../services/SnackbarService';
import { UserService } from '../services/UserService';

import template from './requestprices-edit.html';

@Component({
    selector: 'requestsprices-edit',
    template,
})
export class RequestpricesEditComponent implements OnInit, AfterContentChecked {
    user: Meteor.User;
    requestPriceForm: FormGroup;

    priceId: string;
    dataPrice: Observable<Price[]>;
    price: Price;

    ssObj: SliderSettings = {};
    useSlider: boolean = false;
    defaultEditValues: Object;

    dataItem: Observable<Item[]>;
    item: Item;
    itemId: string;

    dataStore: Observable<Store[]>;
    store: Store;

    requestId: string;
    dataRequestprice:  Observable<RequestPrice[]>;
    cancelRequest: boolean = false;

    list: Object;

    display_spinner: boolean = false;

    errors: Object;
    msgs: Object;

    constructor(
        public _snackbar: SnackbarService,
        private route: ActivatedRoute,
        private router: Router,
        private formBuilder: FormBuilder,
        public _varsService: VariablesService,
        public _userService: UserService,
        public _data: SingleCollectionService,
        private _ngZone: NgZone) { }

    ngOnInit() {
        // Hide top toolbar to allow buttons to be shown on top
        this._varsService.setReactiveHideToolbar(true);

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

        // this.image_spinner = this._varsService.SPINNER124;
        this._varsService.resetFormErrorVairables();
        this.errors = this._varsService.errors;
        this.msgs = this._varsService.msgs;

        this.route.params.subscribe((params) => {

            // Edit existing ...
            if (params['priceId']) {

                this.priceId = params['priceId'];

                console.log("^^^^^^^^ BUILD FORM NOW ^^^^^^^^^" + this.priceId);
                this.requestPriceForm = this.formBuilder.group({
                    id: [''],
                });


                // Initialize Object outside of a subscribe first...
                this.list = { priceId: this.priceId};

                // assign default to avoid jitter as data loads - bogus data is overridden as real data loads
                this.list['itemImage'] = '';
                this.list['itemTitle'] = '...';
                this.list['storeName'] = '...';
                this.list['storeAddress'] = '...';
                this.list['owner'] = '...';

                // Data was loaded previously - retrieve it from local collection
                if (params['requestId']) {
                    this.requestId = params['requestId'];
                    this.getRequestPriceData(params['requestId']);
                }


                if (  params['cancel'] ) {
                    this.cancelRequest = true;
                }

                this.price = Prices.findOne(this.priceId);
                console.log(this.price);

                if (this.price == undefined) {
                    this.dataPrice = this._data.getPrice(this.priceId).zone();
                    this.dataPrice.subscribe(x => {
                        this.itemId = x[0].itemId;
                        this.list['quantity'] = x[0].quantity;
                        this.list['submittedAt'] = x[0].submittedAt;
                        this.getItemData(undefined, x[0].itemId);
                        this.getStoreData(undefined, x[0].storeId);
                    });
                }
                else {

                    this.itemId =this.price.itemId;

                    this.list['quantity'] = this.price.quantity;
                    this.list['submittedAt'] = this.price.submittedAt;

                    // Get Item and store Info
                    this.getItemData(this.price.itemName, this.price.itemId);
                    this.getStoreData(this.price.storeName, this.price.storeId);
                }

            }



        });
    }

    getItemData(itemName, itemId) {
        // Get Item Info
        if (itemName == undefined) {
            this.dataItem = this._data.getItem(itemId).zone();
            this.dataItem.subscribe(x => {
                this.list['itemTitle'] = x[0].name;
                this.list['itemImage'] = x[0].image;
            });
        }
        else {
            this.list['itemTitle'] = this.price.itemName;
            this.list['itemImage'] = this.price.itemImage;
        }
    }

    getStoreData(storeName, storeId) {
        // Get Store Info
        if (storeName == undefined) {
            this.dataStore = this._data.getStore(storeId).zone();
            this.dataStore.subscribe(x => {
                this.list['storeName'] = x[0].name;
                this.list['storeAddress'] = x[0].address;
            });
        }
        else {
            this.list['storeName'] = this.price.storeName;
            this.list['storeAddress'] = this.price.storeAddress;
        }

    }

    getRequestPriceData(requestId) {
        this.list['id'] = requestId;
        this.requestPriceForm.patchValue({id:  this.list['id']});

        this.dataRequestprice = this._data.getRequestPrice(requestId).zone();
        this.dataRequestprice.subscribe(x => {

            this.list['owner'] = x[0].owner;
            this.list['requestedAt'] = x[0].requestedAt;
            this.list['updated'] = x[0].updated;
            this.list['expiresAt'] = x[0].expiresAt;

            this.ssObj.payRequestDefault =  x[0].payRequest * 0.01;
            this.ssObj.minHoursDefault = (x[0].expiresAt - x[0].requestedAt) /  (1000 * 60 * 60);

            // Output payRequest and minHours to Slider settings
            this.defaultEditValues = {
                payRequest: this.ssObj.payRequestDefault,
                minHours:  this.ssObj.minHoursDefault
            }
        });
    }


    CancelRequestPrice() {
        // PriceId and RequestId are set in constructor..
        this.display_spinner = true;
        this.errors['error'] = '';

        // Start displaying progress image
        this._snackbar.resetSnackbar();

        let rp = <RequestPrice>{};
        rp._id = this.requestId;
        rp.priceId = this.priceId;
        rp.itemId = this.itemId;
        rp.note = 'cancel-active';
        rp.owner = this.list['owner'];

        Meteor.call('ddp.requestprices.cancel', rp, (err, res) => {

            this._ngZone.run(() => { // run inside Angular2 world
                this.display_spinner = false;
                if (err) {
                    console.error("!!!!!!!! GO AN ERROR ON: cancelRequestPrice..... " + this.requestId);
                    console.error(err);

                    this._varsService.setReactiveError();
                    return;
                } else {

                    if (!res.status) {
                        this.errors['error'] = res.error;
                        console.error('CancelRequestPrice...' + res.error);
                        this._varsService.setReactiveError();
                    }
                    else {
                        // success!
                        console.log('success -- cancelled Requestprice - ' + this.requestId);
                        this.router.navigate(['/myrequestprices']);
                    }
                }

            });

        });

    }


    EditRequestPrice() {
        this.display_spinner = true;
        this.errors['error'] = '';

        // Reset Overbalance error message
        this.errors['payRequest_isOverBalance'] = false;

        // Start displaying progress image
        this._snackbar.resetSnackbar();

        // Calculate currentDate and expiresAt so it remains consistent for multiple price requests
        let currentDate = new Date().getTime();

        let rp = <RequestPrice>{};
        rp._id = this.requestPriceForm.value.id;
        rp.payRequest = parseInt( Math.round(this.ssObj.payRequestDefault * 100 * 100 / 100));
        rp.updated =  currentDate;
        rp.owner = this.list['owner'];

        // If mins convert to hours before saving
        if (this.ssObj.minHoursMax == 60) {
            rp.expiresAt = Math.round(currentDate + 1000 * (60 * this.ssObj.minHoursDefault));
        }
        else {
            rp.expiresAt = Math.round(currentDate + 1000 * (60 * 60 * this.ssObj.minHoursDefault));
        }
        rp.note = 'update-active';

        // Update Requestprices
        Meteor.call('ddp.requestprices.update', rp, (err, res) => {

            this._ngZone.run(() => { // run inside Angular2 world
                this.display_spinner = false;

                if (err) {
                    console.error("!!!!!!!! GO AN ERROR ON: RequestPrices.methods.update !!!!!!!!!");
                    console.error(err);
                    this._varsService.setReactiveError();
                    return;
                } else {

                    if (!res.status) {
                        this.errors['error'] = res.error;
                        console.error('Update-EditRequestPrice...' + res.error);
                        this._varsService.setReactiveError();
                    }
                    else {
                        // success!
                        console.log("SUCCESSFULLY UPDATED PRICE REQUEST...");
                        this.router.navigate(['/myrequestprices']);
                    }
                }
            });

        });
    }


    /**
     * Output slider values from request1-slicer and import values here
     */
    sliderDataChanged(sliderInfo: SliderSettings) {
        // skip slider on page load - use retrieved values
        if (this.useSlider) {
            this.ssObj = sliderInfo;
        }

        this.useSlider = true;
    }

}

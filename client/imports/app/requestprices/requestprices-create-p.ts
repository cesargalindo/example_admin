import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute }  from '@angular/router';
import { Observable } from "rxjs";
import { Router }  from '@angular/router';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { Item } from '../../../../both/models/item.model';
import { Price } from '../../../../both/models/price.model';
import { RequestPrice } from '../../../../both/models/requestprice.model';
import { SliderSettings } from '../../../../both/models/helper.models';

import { VariablesService } from '../services/VariablesService';
import { SingleCollectionService } from "../services/SingleIdCollection.data.service";
import { SnackbarService } from '../services/SnackbarService';
import { UserService } from '../services/UserService';
import { RequestpricesService } from "./requestprices.service";

import template from './requestprices-create-p.html';

/**
 * Logic is similar to requestnew-item except that item already exist
 *
 */
@Component({
    selector: 'requestprices-create-p',
    template,

})
export class RequestpricesCreatePComponent implements OnInit {
    requestNewPriceForm: FormGroup;

    storeList: Array<any>;

    thumb_image: string;
    no_image_thumb: string;
    display_spinner: boolean = false;

    item: Object;
    dataItem: Observable<Item[]>;

    store_Error: boolean = false;

    errors: Object;
    msgs: Object;

    defaultStore: Object;
    ssObj: SliderSettings;
    enableQuantity: boolean = true;

    private combined$: Observable<any[]>;

    constructor(
        public _snackbar: SnackbarService,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private router: Router,
        public _varsService: VariablesService,
        public _userService: UserService,
        public _requestService: RequestpricesService,
        private _ngZone: NgZone,
        public _data: SingleCollectionService) { }

    ngOnInit() {
        // Hide top toolbar to allow buttons to be shown on top
        this._varsService.setReactiveHideToolbar(true);

        // component request1-sliders will redirect to home page if user Info has loaded - scenario occurs on a page refresh

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

        this.no_image_thumb = Meteor.settings.public.GOOGLE_IMAGE_PATH  + Meteor.settings.public.GOOGLE_IMAGE_THUMB + 'no/' + Meteor.settings.public.GOOGLE_NO_IMAGE;
        this._varsService.resetFormErrorVairables();
        this.errors = this._varsService.errors;
        this.msgs = this._varsService.msgs;

        this.storeList = [];
        this.item = { };

        this.requestNewPriceForm = this.formBuilder.group({
            storeIds: ['', Validators.required]
        });

        // Update form with values if editing
        this.route.params.subscribe((params) => {

            console.log("^^^^^^^^ BUILD FORM NOW ^^^^^^^^^ " + params['itemId']);
            if (params['itemId']) {

                this.item['id'] = params['itemId'];
                this.dataItem = this._data.getItem(params['itemId']).zone();
                this.dataItem.subscribe(x => {

                    this.item['name'] = x[0].name;
                    this.item['image'] = x[0].image;
                    this.item['size'] = x[0].size;

                    if (x[0].image) {
                        console.log(x[0].image.includes("amazonaws"));
                        if ( x[0].image.includes("amazonaws") ) {
                            // image is on AWS - change to thumb path
                            this.thumb_image = x[0].image.replace( Meteor.settings.public.AWS_IMAGE_DEFAULT, Meteor.settings.public.AWS_IMAGE_THUMB);
                        }
                        else {
                            // then it's on Google - change to thumb path
                            this.thumb_image = x[0].image.replace( Meteor.settings.public.GOOGLE_IMAGE_DEFAULT, Meteor.settings.public.GOOGLE_IMAGE_THUMB);
                        }
                    }
                    else {
                        this.thumb_image = this.no_image_thumb;
                    }

                });
            }


        });

    }


    /**
     * Input from search-stores
     * storeIds value only used to validate if storeIds field is empty or not
     * Actual storeId values are pulled from this.storeList
     *
     * @param storeInfo
     */
    storeListChanged(storeInfo) {
        this.storeList = storeInfo;

        if (_.size( this.storeList) ) {
            console.log("changed - storeList ID = " + storeInfo[0].storeId);
            this.requestNewPriceForm.patchValue({storeIds: 'got an ID'});
        }
        else {
            console.log('changed... storeList is EMPTY= 0');
            this.requestNewPriceForm.patchValue({storeIds: ''});
        }
    }


    /**
     * Input from request1-slider
     *
     * @param sliderInfo 
     */
    sliderDataChanged(sliderInfo: SliderSettings) {
        this.ssObj = sliderInfo;
    }


    /**
     * Add newly Requested Price for selected Quantity, Item, Store
     *
     */
    addNewRequestPrice() {
        console.log("========> valid: " + this.storeList.length);

        // Reset Overbalance error message
        this.errors['payRequest_isOverBalance'] = false;

        if (this.requestNewPriceForm.valid) {
            this.display_spinner = true;

            // Start displaying progress image
            this._snackbar.resetSnackbar();

            let currentDate = new Date().getTime();

            // If this a new Requestprice, status and note fields will be overridden in server method
            let rp = <RequestPrice>{};
            rp.itemId = this.item['id'];
            rp.payRequest = parseInt(this.ssObj.payRequestDefault * 100);
            rp.updated = currentDate;

            // Convert minutes to hours before saving
            if (this.ssObj.minHoursMax == 60) {
                rp.expiresAt = Math.round(currentDate + 1000 * (60 * this.ssObj.minHoursDefault));
            }
            else {
                rp.expiresAt = Math.round(currentDate + 1000 * (60 * 60 * this.ssObj.minHoursDefault));
            }
            rp.note = 'request-new';

            // If this is a new Price, note and price fields will be set in server method, otherwise Price object will be ignored
            let p = <Price>{};
            p.itemId = this.item['id'];
            p.payoutRequest = rp.payRequest;
            p.updated = currentDate;
            p.expiresAt = rp.expiresAt;
            p.quantity =  parseInt(this.ssObj.quantityDefault);


            this.combined$ = this._requestService.requestpricesInsertPriceX(p, rp, this.storeList);
            this.combined$.subscribe(x => {
                console.log(x);
                this.errors['error'] =   this._varsService.errors['errors'];

                if (this.errors['error']) {
                    this._varsService.setReactiveError();
                }
                else {
                    console.warn("SUCCESSFULLY INSERTED ALL NEW PRICE REQUESTS... ");
                    this.router.navigate(['/items']);
                }
            });

        }
        else {
            // Only check required for storeIds - value is outputted to Search stores component
            if (this.requestNewPriceForm.controls.storeIds._status == 'INVALID') {
                this.store_Error = true;
            }
            else {
                this.store_Error = false;
            }

            return;
        }

    }

}


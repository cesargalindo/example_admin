import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router }  from '@angular/router';
import { Observable } from "rxjs";

import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { Item } from '../../../../both/models/item.model';
import { Price } from '../../../../both/models/price.model';
import { SubmitPrice } from '../../../../both/models/submitprice.model';

import { VariablesService } from '../services/VariablesService';
import { ValidatorsService } from '../services/ValidatorService';
import { UserService } from '../services/UserService';
import { SingleCollectionService } from "../services/SingleIdCollection.data.service";
import { SubmitpricesService } from "./submitprices-service";
import { SnackbarService } from '../services/SnackbarService';

import template from './submitprices-p.html';

/**
 * Logic is similar to prices-request-new
 *
 */
@Component({
    selector: 'submitprices-p',
    template,

})
export class SubmitpricesCreatePComponent implements OnInit {
    submitNewPriceForm: FormGroup;
    display_spinner: boolean = false;

    thumb_image: string;
    no_image_thumb: string;

    soldOut: boolean = false;

    item: Object;
    dataItem: Observable<Item[]>;

    storeList: Array<any>;
    defaultStore: Object;
    store_Error: boolean = false;

    labels: Object;
    errors: Object;
    msgs: Object;

    quantity: number;

    private combined$: Observable<any[]>;

    constructor(
        public _snackbar: SnackbarService,
        private route: ActivatedRoute,
        private router: Router,
        private formBuilder: FormBuilder,
        public _submitService: SubmitpricesService,
        public _varsService: VariablesService,
        private _validatorsService: ValidatorsService,
        public _userService: UserService,
        private _ngZone: NgZone,
        public _data: SingleCollectionService) { }


    ngOnInit() {
        this._varsService.setReactiveTitleName('SUBMITPRICES ADD/EDIT');

        // Hide top toolbar to allow buttons to be shown on top
        this._varsService.setReactiveHideToolbar(true);

        this.quantity = this._userService.quantityDefault;

        // If user Info has loaded, leverage reactive Rankings - scenario occurs on a page refresh
        // when user rankings is loaded, so are other user's settings,
        let reactiveRankings = this._userService.getReactiveRanking();
        reactiveRankings.subscribe(x => {
            this.quantity = this._userService.quantityDefault;
        });


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
        this.labels = this._varsService.labels;
        this.errors = this._varsService.errors;
        this.msgs = this._varsService.msgs;

        this.storeList = [];
        this.item = { };

        this.submitNewPriceForm = this.formBuilder.group({
            price: ['', [ this._validatorsService.isValidNumber, this._validatorsService.isValidPrice ]],
            storeIds: ['', Validators.required],
            soldOut: [false],
        });


        // Update form with values if editing
        this.route.params.subscribe((params) => {

            if (params['itemId']) {
                this.display_spinner = true;

                // ################################################################
                this.item['id'] = params['itemId'];

                this.dataItem = this._data.getItem(params['itemId']).zone();
                this.dataItem.subscribe(x => {
                    this.item['name'] = x[0].name;
                    this.item['image'] = x[0].image;
                    this.item['size'] = x[0].size;

                    if (params['quantity']) {
                        this.quantity = params['quantity'];
                    }

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

                    this.display_spinner = false;
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
            this.submitNewPriceForm.patchValue({storeIds: 'got an ID'});
        }
        else {
            console.log('changed... storeList is EMPTY= 0');
            this.submitNewPriceForm.patchValue({storeIds: ''});
        }
    }


    /**
     *
     * 1) Add new Item
     * 2) Add new Price
     * 3) Add Request Price
     *
     */
    addNewSubmitPrice() {

        if (this.submitNewPriceForm.valid) {
            this.display_spinner = true;

            // Start displaying progress image
            this._snackbar.resetSnackbar();

            // Calculate currentDate and expiresAt so it remains consistent for multiple price requests
            let currentDate = new Date().getTime();

            // ww  A priceId-itemId-storeId combo may exist for this store.
            // ww check if priceId-itemId-storeId combination exist before updating or inserting a new price
            let p = <Price>{};
            p.itemId = this.item['id'];
            p.payoutRequest = 0;
            p.updated = currentDate;
            p.expiresAt = 111;
            p.quantity = parseInt(this.quantity);
            p.price = parseFloat(this.submitNewPriceForm.value.price);
            p.soldOut = this.submitNewPriceForm.value.soldOut;
            p.note = 'insert-new-sp';


            let sp = <SubmitPrice>{};
            sp.itemId = this.item['id'];
            sp.price = parseFloat(this.submitNewPriceForm.value.price);
            sp.payout = 0;
            sp.soldOut = this.submitNewPriceForm.value.soldOut;
            sp.note = 'submit-new';  // if needed, noe will be overridden in later


            this.combined$ = this._submitService.submitpricesInsertPriceX(p, sp, this.storeList);
            this.combined$.subscribe(x => {

                this._ngZone.run(() => { // run inside Angular2 world
                    console.log(x);
                    this.errors['error'] =   this._varsService.errors['errors'];

                    if (this.errors['error']) {
                        this._varsService.setReactiveError();
                    }
                    else {
                        console.warn("SUCCESSFULLY INSERTED ALL NEW SUBMIT PRICES... " );
                        this.router.navigate(['/items']);
                    }
                });

            });

        }
        else {
            // Only check required for storeIds - value is outputted to Search stores component
            if (this.submitNewPriceForm.controls.storeIds._status == 'INVALID') {
                this.store_Error = true;
            }
            else {
                this.store_Error = false;
            }

            // Process Form Errors
            let validateFields = {};
            // validateFields['quantity'] = 1;
            validateFields['price'] = 1;

            this.errors = this._varsService.processFormControlErrors(this.submitNewPriceForm.controls, validateFields);

            // We have an error, stay on form...
            return;
        }

    }



    clickSoldOut() {
        this._ngZone.run(() => { // run inside Angular2 world
            this.soldOut =  this.submitNewPriceForm.value.soldOut;
            if (this.submitNewPriceForm.value.soldOut) {
                // Actualy value doesn't matter - it will be overwritten based on soldOut field
                this.submitNewPriceForm.patchValue({price: '999'});
            }
            else {
                this.submitNewPriceForm.patchValue({price: ''});
            }
        });
    }


    quantitySlider(event) {
        this._ngZone.run(() => { // run inside Angular2 world
            console.log(event.value);
            this.quantity = event.value;
        });
    }


}


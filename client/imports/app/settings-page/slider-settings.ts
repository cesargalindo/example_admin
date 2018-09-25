import { Meteor } from 'meteor/meteor';
import { Component, OnInit, NgZone }   from '@angular/core';
import { Router }  from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { UserService } from '../services/UserService';
import { SliderSettings } from '../../../../both/models/helper.models';
import { VariablesService } from '../services/VariablesService';
import { AuthService } from '../services/auth/auth.service';

import moment = require("moment/moment");
import template from './slider-settings.html';

@Component({
    selector: 'slider-settings',
    template,
})
export class SliderSettingsComponent implements OnInit {
    user: Meteor.User;
    sliderSettingsForm: FormGroup;

    list: Object;
    display_spinner: boolean = false;
    error: string;
    successMsg: string = '';

    minHourList: Array<any>;
    minHourDefault: number;
    minHourMax: number;
    minHourVal: number;

    payRequestList: Array<any>;
    payRequestDefault: number;
    payRequestStep: number;
    payRequestMax: number;
    payRequestVal: number;
    payRequestStepValues: Object = {};

    quantityList: Array<any>;
    quantityDefault: number;
    quantityMax: number;
    quantityVal: number;

    hoursLists: Array<any>;
    minutesLists: Array<any>;

    minDate: number;
    maxDate: number;
    startDate: any;
    defaultStore: Object;
    selectedStore: Object = {};

    isAdmin: boolean = false;

    constructor(
        private router: Router,
        private formBuilder: FormBuilder,
        private _ngZone: NgZone,
        public _varsService: VariablesService,
        private _authService: AuthService,
        public _userService: UserService) { }


    ngOnInit() {
        // ensure page starts on top on page load
        document.body.scrollTop = 0;

        // If this page is reloaded, redirect to home page to allow user credentials to load
        if (this._userService.cellVerified == undefined) {
            this.router.navigate(['/']);
            return;
        }

        // Show top toolbar
        this._varsService.setReactiveHideToolbar(false);
        this._varsService.setReactiveTitleName('EDIT SLIDER SETTINGS');

        this.minDate = new Date( moment().format('YYYY'),  moment().subtract(1, 'months').format('MM'),  moment().format('DD'));
        this.maxDate = new Date( moment().format('YYYY'), moment().add(1, 'months').format('MM'),  moment().format('DD'));

        this.hoursLists = this._varsService.hoursLists;
        this.minutesLists = this._varsService.minutesLists

        this.startDate = moment.unix(this._userService.scheduledTimestamp);

        this.sliderSettingsForm = this.formBuilder.group({
            minHourValue: [''],
            payRequestValue: [''],
            quantityValue: [''],
            // dateValue: [this.startDate],
            dateValue: [this._userService.scheduledDate],
            hoursValue: [this._userService.scheduledHour],
            minutesValue: [this._userService.scheduledMinute]
        });

        // Set initial Minutes Hours values
        this.minHourList = [
            'Minutes',
            'Hours',
        ];
        this.minHourDefault = this._userService.minHoursDefault;
        this.minHourMax = this._userService.minHoursMax;
        this.minHourVal = this.minHourDefault;

        // Set initial Payrequest values
        this.payRequestStepValues[.50] = .01;
        this.payRequestStepValues[1] = .02;
        this.payRequestStepValues[5] = .10;
        this.payRequestStepValues[10] = .25;
        this.payRequestStepValues[50] = 1;

        this.payRequestList = [
            .50,
            1,
            5,
            10,
            50,
        ];
        this.payRequestDefault = this._userService.payRequestDefault;
        this.payRequestMax = this._userService.payRequestMax;
        this.payRequestStep = this.payRequestStepValues[this.payRequestMax];
        this.payRequestVal = this.payRequestDefault;

        // Set initial Quantity values
        this.quantityList = [
            32,
            64,
        ];
        this.quantityDefault = this._userService.quantityDefault;
        this.quantityMax =  this._userService.quantityMax;
        this.quantityVal = this.quantityDefault;

        // Detect Radio button changes
        this.sliderSettingsForm.valueChanges
            .debounceTime(100)
            .distinctUntilChanged()
            .subscribe(x => {

                console.error(x);

                // Set slider info for Minutes-Hours
                if (x.minHourValue == 'Minutes') {
                    this.minHourMax = 60;
                    this.minHourDefault = this.minHourVal;
                }
                else {
                    this.minHourMax = 24;
                    if (this.minHourVal > 24) {
                        this.minHourVal = 12;
                        this.minHourDefault = 12;
                    }
                }

                // Set slider info for Quantity
                if (x.quantityValue == 64) {
                    this.quantityMax = 64;
                    this.quantityDefault = this.quantityVal;
                }
                else {
                    this.quantityMax = 32;
                    if (this.quantityVal > 32) {
                        this.quantityVal = 16;
                        this.quantityDefault = 16;
                    }
                }


                // Reset sliders settings for payRequest
                this.payRequestMax = x.payRequestValue;
                this.payRequestStep = this.payRequestStepValues[this.payRequestMax];

                // Ensure price doesn't exceed max price
                if (this.payRequestVal > this.payRequestMax) {
                    this.payRequestVal = this.payRequestMax;
                    // this.payRequestDefault = this.payRequestVal;
                }

            });


        // Set default form values on load
        if (this.minHourMax == 60) {
            this.sliderSettingsForm.patchValue({
                minHourValue: 'Minutes',
                payRequestValue: this.payRequestMax,
                quantityValue: this.quantityMax
            });
        }
        else {
            this.sliderSettingsForm.patchValue({
                minHourValue: 'Hours',
                payRequestValue: this.payRequestMax,
                quantityValue: this.quantityMax
            });
        }

        if (this._userService.storeId) {
            // Export default store info to Store Component
            this.defaultStore = {
                id: this._userService.storeId,
                name: this._userService.storeName,
                address: this._userService.storeAddress,
            };
        }

        // display Dup option if user is admin
        this.isAdmin = this._authService.isAdmin;
    }

    minHourSider(event) {
        console.log(event.value);
        // this.payRequest = event.value * 0.01
        this.minHourVal = event.value;
    }

    payRequestSider(event) {
        console.log(event.value);
        this.payRequestVal = event.value;
    }

    quantitySlider(event) {
        // console.log(event);
        console.log(event.value);
        this.quantityVal = event.value;
    }


    saveSettingsInfo() {

        this.successMsg = '';
        this.display_spinner = true;

        let ss = <SliderSettings>{};
        ss.minHoursDefault = this.minHourVal;
        ss.minHoursMax = this.minHourMax;
        ss.payRequestDefault = Math.round(this.payRequestVal * 100) / 100;
        ss.payRequestMax = this.payRequestMax;

        ss.quantityDefault = this.quantityVal;
        ss.quantityMax = this.quantityMax;

        if (this.selectedStore.id) {
            ss.storeId = this.selectedStore.id;
            ss.storeName = this.selectedStore.name;
            ss.storeAddress = this.selectedStore.address;
        }
        else {
            ss.storeId = '';
            ss.storeName = '';
            ss.storeAddress = '';
        }

        var unixTimestamp = moment(this.sliderSettingsForm.value.dateValue).unix();
        console.log('unixTimestamp 1 = ' + unixTimestamp);

        ss.scheduledDate = this.sliderSettingsForm.value.dateValue;
        ss.scheduledHour = this.sliderSettingsForm.value.hoursValue;
        ss.scheduledMinute = this.sliderSettingsForm.value.minutesValue;

        // hardcode hour and time to 12:01 am
        this.sliderSettingsForm.value.hoursValue = 0;
        this.sliderSettingsForm.value.minutesValue = 1;

        if (this.sliderSettingsForm.value.hoursValue) {
            ss.scheduledTimestamp  = moment(this.sliderSettingsForm.value.dateValue).unix() + this.sliderSettingsForm.value.hoursValue * this.sliderSettingsForm.value.minutesValue * 60;
        }
        else {
            ss.scheduledTimestamp = moment(this.sliderSettingsForm.value.dateValue).unix() + this.sliderSettingsForm.value.minutesValue * 60;
        }

        ss.scheduledTimestamp = ss.scheduledTimestamp * 1000;

        // Update user profile settings info
        Meteor.call('updateUserProfileSettings.admin', ss, (error, res) => {

            this._ngZone.run(() => { // run inside Angular2 world
                if (res.status) {
                    if (error) {
                        this.error = error;
                        this.display_spinner = false;
                    }
                    else {
                        // Force reload of UserProfile info
                        this._userService.initializeUserInfo(true);

                        let cpThis = this;

                        // delay for 1.0 second to give time for user profile to reload - before user visits another page
                        Meteor.setTimeout(function () {
                            cpThis.display_spinner = false;
                            cpThis.successMsg = 'Default settings successfully updated.';
                            this.router.navigate(['/']);
                        }, 1000);

                    }
                }
                else {
                    this.error = res.error;
                    this.display_spinner = false;
                }
            });

        });
    }

    storeListChanged(storeInfo) {
        if (_.size(storeInfo) ) {
            console.log("changed- storeList ID = " + storeInfo[0].storeId + ' -- ' + storeInfo[0].name);
            this.selectedStore = {
                id: storeInfo[0].storeId,
                name: storeInfo[0].name,
                address: storeInfo[0].address,
            };

        }
        else {
            this.selectedStore = {
                id: '',
                name: '',
                address: '',
            };
            console.warn('changed... storeList is EMPTY= 0');
        }
    }
}

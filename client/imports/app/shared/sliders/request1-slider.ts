import { Component, OnInit, NgZone, EventEmitter } from '@angular/core';
import { Router }  from '@angular/router';

import { UserService } from '../../services/UserService';
import { SliderSettings } from '../../../../../both/models/helper.models';

import template from './request1-slider.html';

@Component({
    selector: 'request1-slider',
    template,
    outputs: ['sliderData'],
    inputs: ['defaultValues', 'quantityEnabled'],

})
export class Request1SliderComponent implements OnInit {
    minHourDefault: number;
    minHourMax: number;
    minHourVal: number;
    minHourType: String;

    payRequestDefault: number;
    payRequestStep: number;
    payRequestMax: number;
    payRequestVal: number;

    quantityDefault: number;
    quantityMax: number;
    quantityVal: number;
    quantityEnabled: boolean = false;

    s0: SliderSettings = {};
    ss: SliderSettings = {};
    sliderData: EventEmitter<SliderSettings>;
    defaultValues: Object;

    nonEditMode: boolean = true;

    constructor(
        private router: Router,
        private _ngZone: NgZone,
        public _userService: UserService)
    {
        this.sliderData = new EventEmitter();

    }

    // tt Default Requestprice values provided on load when editing an existing Requestprice
    ngOnChanges(changes) {
        console.warn(changes);

        if (changes.defaultValues != undefined) {

            if (changes.defaultValues.currentValue != undefined) {
                // Skip initialization by ngOnit, ngOnChanges is call before ngOnit
                // ngOnChanges is only called by Edit Request pages
                this.nonEditMode = false;

                // Calculate max values for payRequest and minHours
                if (changes.defaultValues.currentValue.minHours < 1) {
                    this.minHourMax = 60;
                    this.minHourDefault = Math.round(60 * changes.defaultValues.currentValue.minHours);
                }
                else {
                    this.minHourDefault = changes.defaultValues.currentValue.minHours;
                    this.minHourMax = 24;
                }

                if (changes.defaultValues.currentValue.payRequest > 10) {
                    this.payRequestMax = 50;
                }
                else if (changes.defaultValues.currentValue.payRequest > 5) {
                    this.payRequestMax = 10;
                }
                else if (changes.defaultValues.currentValue.payRequest > 1) {
                    this.payRequestMax = 5;
                }
                else {
                    this.payRequestMax = .50;
                }


                // Apply initial settings to search settings object to output
                this.s0.minHoursDefault = this.minHourDefault;
                this.s0.minHoursMax = this.minHourMax;

                this.s0.payRequestDefault = changes.defaultValues.currentValue.payRequest;
                this.s0.payRequestMax = this.payRequestMax;

                if (changes.defaultValues.currentValue.quantity == undefined) {
                    this.s0.quantityDefault = this._userService.quantityDefault;
                }
                else {
                    this.s0.quantityDefault = changes.defaultValues.currentValue.quantity;
                }
                this.s0.quantityMax = this.quantityMax;

                // User is editing and existing Price request - re-initialize default settings
                this.initializeSliderSettings(false);
            }
        }

    }


    ngOnInit() {
        // If this page is reloaded, redirect to home page to allow user credentials to load
        if (this._userService.cellVerified == undefined) {
            this.router.navigate(['/']);
            return;
        }

        if (this.nonEditMode) {
            // Apply initial settings to search settings object to output
            this.s0.minHoursDefault = this._userService.minHoursDefault;
            this.s0.minHoursMax = this._userService.minHoursMax;

            this.s0.payRequestDefault = this._userService.payRequestDefault;
            this.s0.payRequestMax = this._userService.payRequestMax;

            this.s0.quantityDefault = this._userService.quantityDefault;
            this.s0.quantityMax = this.quantityMax;

            this.initializeSliderSettings(true);
        }

    }


    /**
     * @param emit 
     */
    initializeSliderSettings(emit) {
        if (this.s0.minHoursMax == 60) {
            this.minHourType = 'Minutes';
        }
        else {
            this.minHourType = 'Hours';
        }

        this.minHourDefault = this.s0.minHoursDefault;
        this.minHourMax = this.s0.minHoursMax;
        this.minHourVal = this.minHourDefault;

        this.payRequestDefault = this.s0.payRequestDefault;
        this.payRequestMax = this.s0.payRequestMax;
        this.payRequestVal = this.payRequestDefault;

        this.quantityDefault = this.s0.quantityDefault;
        this.quantityMax = this.s0.quantityMax
        this.quantityVal = this.quantityDefault;

        if (this.s0.payRequestDefault > 5) {
            this.payRequestStep = .50;
        }
        else if (this.s0.payRequestDefault > 1) {
            this.payRequestStep = .10;
        }
        else if (this.s0.payRequestDefault > 0.5) {
            this.payRequestStep = .02;
        }
        else {
            this.payRequestStep = .01;
        }

        // Apply initial settings to search settings object to output
        this.ss.minHoursDefault = this.minHourVal;
        this.ss.minHoursMax = this.minHourMax;
        this.ss.payRequestDefault = Math.round(this.payRequestVal * 100) / 100;
        this.ss.payRequestMax = this.payRequestMax;
        this.ss.quantityDefault = this.quantityVal;
        this.ss.quantityMax = this.quantityMax;

        if (emit) {
            // Emit default values to Request form/page
            this.sliderData.emit(this.ss);
        }

    }


    minHourSider(event) {
        this._ngZone.run(() => { // run inside Angular2 world
            this.minHourVal = event.value;
            this.ss.minHoursDefault = event.value;
            this.sliderData.emit(this.ss);
        });
    }

    payRequestSider(event) {
        this._ngZone.run(() => { // run inside Angular2 world
            this.payRequestVal = event.value;
            this.ss.payRequestDefault = event.value;
            this.sliderData.emit(this.ss);
        });

    }

    quantitySlider(event) {
        this._ngZone.run(() => { // run inside Angular2 world
            this.quantityVal = event.value;
            this.ss.quantityDefault = event.value;
            this.sliderData.emit(this.ss);
        });
    }



}

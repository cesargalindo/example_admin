import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit }   from '@angular/core';
import { ActivatedRoute, Router }  from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { VariablesService } from '../services/VariablesService';
import { ValidatorsService } from '../services/ValidatorService';
import { MiscService } from '../services/MiscService';

import { Tprice } from '../../../../both/models/tprice.model';

import moment = require("moment/moment");

import template from './edit-tprice.html';
import style from './edit-tprice.scss';


@Component({
    selector: 'edit-tprice',
    template,
    styles: [ style ]    
})
export class TpriceEditComponent implements OnInit {
    editItemForm: FormGroup;
    
    display_spinner: boolean = false;

    redirect: string;
    contractor: boolean = false;

    tid: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    startsAt: number;
    size: number;
    unit: string;
    gsize: number;
    gunits: string;
    storeName: string;

    minDate: number;
    maxDate: number;
    startDate: any;

    labels: Object;
    errors: Object;
    msgs: Object;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private _ngZone: NgZone,
        private formBuilder: FormBuilder,
        public _varsService: VariablesService,
        private _validatorsService: ValidatorsService,
        private _miscService: MiscService) { }
        
    ngOnInit() {
        this._varsService.setReactiveTitleName('EDIT ITEM: 1lb = 16oz, 2lb = 32oz, 3lb = 48oz, 4lb = 64oz,  5lb = 80oz');

        this._varsService.resetFormErrorVairables();
        this.labels = this._varsService.labels;
        this.errors = this._varsService.errors;
        this.msgs = this._varsService.msgs;

        this.route.params.subscribe((params) => {

            if (params['redirect']) {
                this.redirect = params['redirect'];
            }

            if (this._varsService.params._id == undefined) {
                alert("ERROR: no price parameters provided ... ");
                return;
            }
            else {
                let result = this._varsService.params;
                this.tid = result._id;
                this.name = result.distance;

                // Real "actual" price was calculated in previous page
                this.price = parseFloat(result.expiresAt);
                this.image = result.image
                this.quantity = parseInt(result.quantity)
                this.startsAt = result.startsAt

                this.gsize = parseFloat(result.gsize);
                this.gunits = result.gunits

                let foo = result.submitterId.split(" ");
                this.size = parseFloat(foo[0]);
                this.unit = foo[1];

                this.storeName = result.store_info[0].name 
                
            }

            this.minDate = new Date( moment().format('YYYY'),  moment().subtract(1, 'month').format('MM'),  moment().format('DD'));
            this.maxDate = new Date( moment().format('YYYY'), moment().add(2, 'months').format('MM'),  moment().format('DD'));

            // this.startDate = new Date( moment(this.startsAt).format('YYYY'),  moment(this.startsAt).format('MM'),  moment(this.startsAt).format('DD'));
            this.startDate = new Date( moment(this.startsAt).format('YYYY'),  moment(this.startsAt).subtract(1, 'month').format('MM'),  moment(this.startsAt).format('DD'));

            console.log("^^^^^^^^ BUILD FORM NOW ^^^^^^^^^ contractor = " + this.contractor);
            this.editItemForm = this.formBuilder.group({
                price: [this.price, [ this._validatorsService.isValidNumber ]],
                quantity: [this.quantity, [ this._validatorsService.isInteger ]],
                dateValue: [this.startDate],
            });
 
        });
    }


    /**
     * Update existing Tprice
     */
    editExistingTprice() {

        if (this.editItemForm.valid) {
            this.display_spinner = true;

            let tu = <Tprice>{};
            tu._id = this.tid;

            tu.quantity = this.editItemForm.value.quantity;

            let temp = moment(this.editItemForm.value.dateValue).unix();
            tu.startsAt = (temp + 60) * 1000;  // plus 1 minute

            let gglob = this._miscService.getGlobalSize(this.size, this.unit);
            tu.gsize = gglob.gsize * tu.quantity;
            tu.price = this.editItemForm.value.price / tu.gsize;

            Meteor.call('editExistingTprice', tu, (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    this.display_spinner = false;
                    if (err) {
                        console.error("!!!!!!!! ERROR: EditItem !!!!!!!!!");
                        console.error(err);
                        this._varsService.setReactiveError();
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: Items.update..." + res.error);
                            this._varsService.setReactiveError();
                        }
                        else {
                            console.log("SUCCESSFULLY UPDATED ITEM...");
                            if (this.redirect) {
                                this.customRedirect();
                            }
                            else {
                                this.router.navigate(['/items']);
                            }
                        }
                    }
                });

            });

        }
    }


    /**
     * 
     */
    customRedirect() {
        let redirectInfo = this._miscService.constructRedirectQuery(this.redirect);
        this.router.navigate([redirectInfo.main, redirectInfo.params]);
    }

}

import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { ValidatorsService } from '../services/ValidatorService';

import template from './dialog-tprice-dialog.html';
import style from "./dialog-tprice-dialog.scss";

import {MAT_DIALOG_DATA} from '@angular/material';

/**
 * Update note in sitem
 *
 */
@Component({
    selector: 'dialog-tprice-dialog',
    template,
    styles: [ style ]    
})
export class DialogTpriceDialogComponent implements OnInit  {

    placeHolder: string;
    itemForm: FormGroup;
    errorMsg: string = '';
    buttonEnabled: boolean = true;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _ngZone: NgZone,
        private _validatorsService: ValidatorsService,
        private formBuilder: FormBuilder) {
    }

    
    ngOnInit() {
        this.placeHolder = this.data.name;
        this.itemForm = this.formBuilder.group({
            price: ['', this._validatorsService.isValidNumber],
            quantity: ['', this._validatorsService.isValidNumber],
        });
    }


    updateItem() {

        if (this.itemForm.valid) {
            this.buttonEnabled = false;

            // alert('VALID: ' +  this.data.itemId + ' -- ' + this.itemForm.value.price + ' == ' + this.itemForm.value.quantity )
            Meteor.call('addNewTempPrice', this.data.itemId, this.data.storeId, this.data.startDate, this.itemForm.value.price, this.itemForm.value.quantity,  (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    if (err) {
                        console.error("!!!!!!!! ERROR: updateItemName !!!!!!!!!");
                        console.error(err);
                        this.errorMsg = err;
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: updateItemName...." + res.error);
                            this.errorMsg = res.error;
                            return;
                        }
                        else {
                            console.log("SUCCESSFUL updateItemName ...");  
                            document.getElementById('forceCloseClick').click();
                        }
                    }
                });
            });
        }
        else {
            alert('FORM ERROR: ' +  this.data.itemId + ' -- ' + this.itemForm.value.price + ' == ' + this.itemForm.value.quantity )
            return;
        }

    }

}






import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import template from './dialog-item-dialog.html';
import style from "./dialog-item-dialog.scss";

import {MAT_DIALOG_DATA} from '@angular/material';

/**
 * Update note in sitem
 *
 */
@Component({
    selector: 'dialog-item-dialog',
    template,
    styles: [ style ]    
})
export class DialogItemDialogComponent implements OnInit  {

    placeHolder: string;
    itemForm: FormGroup;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private formBuilder: FormBuilder,
        private _ngZone: NgZone) {
    }

    
    ngOnInit() {
        this.placeHolder = this.data.name;
        this.itemForm = this.formBuilder.group({
            name: [this.data.name],
        });
    }


    updateItem() {
        Meteor.call('updateItemName', this.itemForm.value.name, this.data.id, (err, res) => {
            if (err) {
                console.error("!!!!!!!! ERROR: updateItemName !!!!!!!!!");
                console.error(err);
            } else {
                if (!res.status) {
                    console.error("!!!!!!!! ERROR ON: updateItemName...." + res.error);
                    return;
                }
                else {
                    console.log("SUCCESSFUL updateItemName ...");
                }
            }

            document.getElementById('forceCloseClick').click();
        });
    }

}






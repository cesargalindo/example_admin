import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import template from './dialog-sitem-dialog.html';
import style from "./dialog-sitem-dialog.scss";

import {MAT_DIALOG_DATA} from '@angular/material';

/**
 * Update note in sitem
 *
 */
@Component({
    selector: 'dialog-sitem-dialog',
    template,
    styles: [ style ]    
})
export class DialogSitemDialogComponent implements OnInit  {

    placeHolder: string;
    sItemForm: FormGroup;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private formBuilder: FormBuilder,
        private _ngZone: NgZone) {
    }

    
    ngOnInit() {
        this.placeHolder = 'enter note here';
        this.sItemForm = this.formBuilder.group({
            note: [this.data.note],
            status: [this.data.status],
        });
    }


    updateItem() {
        Meteor.call('updateSitemNote', this.sItemForm.value.note, this.data.id, (err, res) => {
            if (err) {
                console.error("!!!!!!!! ERROR: updateSitemNote !!!!!!!!!");
                console.error(err);
            } else {
                if (!res.status) {
                    console.error("!!!!!!!! ERROR ON: updateSitemNote...." + res.error);
                    return;
                }
                else {
                    console.log("SUCCESSFUL updateSitemNote ...");
                }
            }

            document.getElementById('forceCloseClick').click();
        });
    }

    /**
     * @param status 
     */
    updateItemStatus(status) {
        Meteor.call('updateSitemStatus', status, this.data.id, (err, res) => {
            if (err) {
                console.error("!!!!!!!! ERROR: updateSitemStatus !!!!!!!!!");
                console.error(err);
            } else {
                if (!res.status) {
                    console.error("!!!!!!!! ERROR ON: updateSitemStatus...." + res.error);
                    return;
                }
                else {
                    console.log("SUCCESSFUL updateSitemStatus ...");
                }
            }

            document.getElementById('forceCloseClick').click();
        });
    }

}






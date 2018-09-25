import { Component, NgZone, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { UserService } from '../services/UserService';
import { VariablesService } from '../services/VariablesService';

import template from "./items-add-byupc.html";
import style from "./items-add-byupc.scss";

@Component({
    selector: 'items-add-byupc',
    template,
    styles: [ style ]
})
export class ItemsAddByUPCComponent implements OnInit {

    itemsForm: FormGroup;
    results: Array<any> = [];

    constructor(
        private formBuilder: FormBuilder,
        private _ngZone: NgZone,
        public _varsService: VariablesService,
        public _userService: UserService) {}


    ngOnInit() {
        this._varsService.setReactiveTitleName('ADD ITEMS by UPCs from upcitemdb.com');
        
        // show top toolbar
        this._varsService.setReactiveHideToolbar(false);

        this.itemsForm = this.formBuilder.group({
            name: ['']
        });
    }


    /**
     * Insert a new item 
     */
    AddNewItems() {
        let upc = 0;
        let cnt = 0;
        let newitems = {};
        let res = this.itemsForm.value.name.split(",");
        let cpThis = this;
        this.results = [];
        
        res.map(x => {
            console.error(x);
            if (Number.isInteger(parseInt(x))) {
                newitems[cnt] = parseInt(x);
                cnt++;
                upc = parseInt(x);

                Meteor.call('checkIfUPCExistAlready', upc, function (err, res2) { 

                    cpThis._ngZone.run(() => { // run inside Angular2 world
                        if(err) {
                            cpThis.results.push({
                                status: false,
                                error: 'ERROR: ' + res2.upc + ' -- ' + res2.id + ' -- ' + ' -- ' + res2.error
                            });
                        }
                        else if(res2.status) {
                            cpThis.results.push({
                                status: false,
                                error: 'ITEM ALREADY EXIST IN MONGO DB: ' + res2.upc,
                            });
                        }
                        else {
                            cpThis.results.push({
                                status: true,
                                msg: 'UPC IS NEW - added - ' + res2.upc + ' == Downloaded image name: ' + res2.image + '   transfer to S3> upc 22 '
                            });
                        }

                    });
                });

            }
        });
    }


        
    testBarcode() {
        // let barcode = 06060696060;
        let barcode = 885909950805;

        Meteor.call('testBarcode', barcode, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: testBarcode !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: testBarcode...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL testBarcode ...");
                        console.warn(res);
                    }
                }
            });
        });
    }

}



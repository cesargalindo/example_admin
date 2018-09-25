
import { Component, OnInit, NgZone } from "@angular/core";
import { Router } from '@angular/router';

import { VariablesService } from '../services/VariablesService';
import { Item } from '../../../../both/models/item.model';

import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import gql from 'graphql-tag';

import template from "./items-duplicates.html";
import style from "./items-duplicates.scss";

@Component({
    selector: 'items-duplicates',
    template,
    styles: [ style ]
})
export class ItemsDuplicatesComponent implements OnInit {
    apolloItems2: ApolloQueryObservable<any>;
    apolloItemsCount2: ApolloQueryObservable<any>;

    pageSize: number = 25;
    dateOrder: number = -1;
    p: number = 1;

    status: number;
    statuses: Object = {};    

    // Data pushed to template
    total: number;
    newName: string;
    newMain: string;
    newImage: string;
    newCatgory: string;
    newSize: number;
    newUnit: string;

    selectName: Object = {};    
    selectMain: Object = {};
    selectImage: Object = {};
    selectCategory: Object = {};
    selectSizeUnit: Object = {};

    imageToggle: Object = {};

    constructor(
        private router: Router,
        private _ngZone: NgZone,
        private apollo: Angular2Apollo,
        public _varsService: VariablesService) { }

    ngOnInit() {
        this.status = 0;

        this._varsService.setReactiveTitleName('Duplicate Items');

        this._varsService.note = '';
        this._varsService.name = '';
        this._varsService.selectedItemId = '';

        this.apolloItemsCount2 = this.apollo.watchQuery({
            query: gql`
                query ItemsCount2($status: Int) {
                    apDupItemsCount(status: $status) {
                        count
                    }
                }
            `,
            variables: {
                status: this.status
            },
            fetchPolicy: 'network-only'
        })
        .map( x => {
            console.warn('######## THE COUNT ####### ' +  x.data.apDupItemsCount.count);
            this.total = x.data.apDupItemsCount.count;
        });


        // load initial page
        this.getItems(this.p);
    }


    getItems(page) {
        this.p = page;
        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: {created: this.dateOrder},
        };

        let serializeOptions = JSON.stringify(options);
        
        console.log( this.status + ' -- ' + serializeOptions);

        this._ngZone.run(() => { // run inside Angular2 world
            this.apolloItems2 = this.apollo.watchQuery({
                query: gql`
                    query MyItems2($status: Int, $options: String) {
                        apDupItems(status: $status, options: $options) {
                            _id
                            created
                            status
                            dupitems {
                                itemId
                                itemT {
                                    _id
                                    name
                                    size
                                    unit
                                    image
                                    category
                                    upc
                                }
                            }
                        }
                    }
                `,
                variables: {
                    status: this.status,
                    options: serializeOptions
                },
                fetchPolicy: 'network-only'
            })
                .map( ({ data }) => {
                    console.warn('######## THE DATA ####### ' +  data.apDupItems.length);
                    console.log(data.apDupItems);
                    return data.apDupItems;
                });
        });

    }


    identifyUpcDuplicates() {
        Meteor.call('identify.duplicate.upc.items', (err, res) => {
        // Meteor.call('autoCLean.duplicate.upc.items', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: identifyUpcDuplicates !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: identifyUpcDuplicates..." + res.error);
                    }
                    else {
                        console.log('Successfully ran identifyUpcDuplicates');
                    }
                }
            });
        });
    }


    identifyNameDuplicates() {
        Meteor.call('identify.duplicate.name.items', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: identifyNameDuplicates !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: identifyNameDuplicates..." + res.error);
                    }
                    else {
                        console.log('Successfully ran identifyNameDuplicates ');
                    }
                }
            });
        });
    }





    matchItems(item) {
        alert(' -- add params into this._varsService.params instead ... ');
        this.router.navigate(['/items-match', { info:  JSON.stringify(item) }]);
        // this.router.navigate(['/items-match', { searchName: item.name }]);
    }


    // Togle Image size
    imageToggleClick(id) {
        if (this.imageToggle[id]) {
            this.imageToggle[id] = 0;
        }
        else {
            this.imageToggle[id] = 1;
        }
    }


    select_name(it) {
        if (this.selectName[it._id]) {
            this.selectName[it._id] = 0;
        }
        else {
            this.selectName[it._id] = 1;
        }
    }


    select_main(it, item) {
        if (this.selectMain[it._id]) {
            this.selectMain[it._id] = 0;
            this.newMain = '';
        }
        else {
            this.selectMain[it._id] = 1;
            this.newMain = item._id;            
        }
    }


    select_image(it, item) {
        if (this.selectImage[it._id]) {
            this.selectImage[it._id] = 0;
            this.newImage = item.image;
        }
        else {
            this.selectImage[it._id] = 1;
            this.newImage = item.image;
        }
    }


    select_category(it, item) {
        if (this.selectCategory[it._id]) {
            this.selectCategory[it._id] = 0;
            this.newCatgory = '';
        }
        else {
            this.newCatgory = item.category;            
            this.selectCategory[it._id] = 1;
        }
    }


    select_size_unit(it, item) {
        if (this.selectSizeUnit[it._id]) {
            this.selectSizeUnit[it._id] = 0;
            this.newSize = 0;
            this.newUnit = '';
        }
        else {
            this.selectSizeUnit[it._id] = 1;
            this.newSize = item.size;
            this.newUnit = item.unit;
        }
    }

    /**
     * Merge data from selected item
     * Delete item not selected as main
     * 
     * @param it
     */
    mergeItems(it) {
        // console.log(it);
        if ( (this.selectMain[it._id] == undefined) || (this.selectMain[it._id] == 0) ) {
            alert('ERROR: no main item selected...');
            return;
        }

        let im = <Item>{};
        im._id = this.newMain;

        if (this.selectName[it._id]) {
            if ( (this.newName != undefined) && (this.newName != '') ) {
                im.name = this.newName;
            }
        }
        if ( this.selectImage[it._id]) {
            if ( (this.newImage != undefined) && (this.newImage != '') ) {
                im.image = this.newImage;
            }            
        }
        if ( this.selectCategory[it._id]) {
            if ( (this.newCatgory != undefined) && (this.newCatgory != '') ) {
                im.category = this.newCatgory;
            }            
        }
        if ( this.selectSizeUnit[it._id]) {
            if ( (this.newUnit != undefined) && (this.newUnit != '') ) {
                im.size = this.newSize;
                im.unit = this.newUnit;
            }            
        }

        Meteor.call('mergeDuplicateItems', it, im, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: mergeDuplicateItems !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: mergeDuplicateItems mergeDuplicateItems..." + res.error);
                    }
                    else {
                        console.log('Successfully mergeDuplicateItems...');
                        this.statuses[it._id] = 1;
                    }
                }
            });
        });

    }




}




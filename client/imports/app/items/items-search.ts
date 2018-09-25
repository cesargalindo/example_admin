import { Component, NgZone, OnInit } from '@angular/core';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { ActivatedRoute }  from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { UserService } from '../services/UserService';
import { VariablesService } from '../services/VariablesService';

import gql from 'graphql-tag';

import template from "./items-search.html";
import style from "./items-search.scss";

@Component({
    selector: 'items-search',
    template,
    styles: [ style ]
})
export class ItemsSearchComponent implements OnInit {
    apolloItems: ApolloQueryObservable<any>;
    apolloItemsCount: ApolloQueryObservable<any>;

    total: number;
    pageSize: number = 50;
    p: number = 1;
    dateOrder: number = -1;

    itemsForm: FormGroup;
    searchName: string = '';
    searchSize: string = '';


    filterByValue: number;

    contractor: boolean = false;
    
    unitsList: Array<any>;
    categories: Array<any>;

    toggleMe: Object = {};
    
    name1: string;
    name2: string;
    name3: string;
    name4: string;

    // tags
    tag1: Object = {};
    tag2: Object = {};
    tag3: Object = {};
    tag4: Object = {};
    tag5: Object = {};
    tag6: Object = {};
    tag7: Object = {};
    tag8: Object = {};
    tag9: Object = {};
    tag10: Object = {};
    tag11: Object = {};
    tag12: Object = {};
    tag13: Object = {};
    tag14: Object = {};
    tag15: Object = {};
    tag16: Object = {};
    tag17: Object = {};
    tag18: Object = {};

    tag1_ck: Object = {};
    tag2_ck: Object = {};
    tag3_ck: Object = {};
    tag4_ck: Object = {};
    tag5_ck: Object = {};
    tag6_ck: Object = {};
    tag7_ck: Object = {};
    tag8_ck: Object = {};
    tag9_ck: Object = {};
    tag10_ck: Object = {};
    tag11_ck: Object = {};
    tag12_ck: Object = {};
    tag13_ck: Object = {};
    tag14_ck: Object = {};
    tag15_ck: Object = {};
    tag16_ck: Object = {};
    tag17_ck: Object = {};
    tag18_ck: Object = {};

    constructor(
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private apollo: Angular2Apollo,
        private _ngZone: NgZone,
        public _varsService: VariablesService,
        public _userService: UserService) {}


    ngOnInit() {
        this._varsService.setReactiveTitleName('ITEMS SEARCH TERMS');
        
        // show top toolbar
        this._varsService.setReactiveHideToolbar(false);

        this.unitsList = this._varsService.unitsList;
        this.categories = this._varsService.categories;

        // Check if user has contractor role
        if ( _.indexOf(Meteor.user().roles, 'contractor') > -1 ) {
            if ( _.indexOf(Meteor.user().roles, 'superadmin') > -1 ) {
                // bypass contractor restrictions
                this.contractor = false;
            }
            else {
                this.contractor = true;                
            }
        }

        this.itemsForm = this.formBuilder.group({
            name: [''],
            size: [''],
            unit: ['']
        });

        if (this._userService.selectedCategory == undefined) {
            this._userService.selectedCategory = '';
        }
        
        if (this._userService.searchName != undefined) {
            this.searchName = this._userService.searchName;
        }
        if (this._varsService.size != undefined) {
            this.searchSize = this._varsService.size;
        }
        if (this._varsService.unit != undefined) {
            this.itemsForm.patchValue({
                unit: this._varsService.unit
            });
        }

        this.filterByValue = 99;

        this.route.params.subscribe((params) => {
            // re-run item search
            if (params['searchName']) {
                this.searchName = params['searchName'];
            }
        });

        // get initial count
        this.getCount();

        // load initial page
        this.getItems(this.p);

    }

    getItemsParent(p) {
        this.getCount();
        this.getItems(p);
    }

    getCount() {
        this._userService.searchName = this.searchName;
        
        this.name1 = '';
        this.name2 = '';
        this.name3 = '';
        this.name4 = '';

        let res = this.searchName.split(" ");
        if (res[0] != undefined) {
            this.name1 = res[0];
        }
        if (res[1] != undefined) {
            this.name2 = res[1];
        }
        if (res[2] != undefined) {
            this.name3 = res[2];
        }
        if (res[3] != undefined) {
            this.name4 = res[3];
        }

        if (this.searchSize) {
            this._varsService.size = parseInt(this.searchSize);
        }

        if (this.itemsForm.value.unit) {
            this._varsService.unit = this.itemsForm.value.unit;
        }

        // Load Items Count -- it should always return before Items data
        this.apolloItemsCount = this.apollo.watchQuery({
            query: gql`
                query ItemsCount($itemName1: String, $itemName2: String, $itemName3: String, $itemName4: String, $itemName5: String, $itemSize: String, $itemUnit: String, $status: Int, $done: Int, $category: String) {
                  apItemsCount(itemName1: $itemName1, itemName2: $itemName2, itemName3: $itemName3,  itemName4: $itemName4, itemName5: $itemName5, itemSize: $itemSize, itemUnit: $itemUnit, status: $status, done: $done, category: $category) {
                    count
                  }
                }
              `,
            variables: {
                itemName1: this.name1,
                itemName2: this.name2,
                itemName3: this.name3,
                itemName4: this.name4,
                itemName5: '',
                itemSize: this.searchSize,
                itemUnit: this.itemsForm.value.unit,
                status: this.filterByValue,
                done: 0,
                category: ''
            },
            fetchPolicy: 'network-only'
        })
            .map( x => {
                console.log(x.data);
                this.total = x.data.apItemsCount.count;
            });
    }

    getItems(page) {
        this.p = page;
        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: {updated: this.dateOrder},
        };

        let serializeOptions = JSON.stringify(options);
        console.log(serializeOptions);

        this.apolloItems = this.apollo.watchQuery({
            query: gql`
              query ItemsInfo($itemName1: String, $itemName2: String, $itemName3: String, $itemName4: String, $itemName5: String, $itemSize: String, $itemUnit: String, $options: String, $status: Int, $done: Int, $category: String) {
                apItems(itemName1: $itemName1, itemName2: $itemName2, itemName3: $itemName3, itemName4: $itemName4, itemName5: $itemName5, itemSize: $itemSize, itemUnit: $itemUnit, options: $options, status: $status, done: $done, category: $category) {
                    _id
                    name
                    size
                    unit
                    quantity
                    image
                    public
                    upc
                    note
                    category
                    searchTitle
                }
              }
            `,
            variables: {
                options: serializeOptions,
                itemName1: this.name1,
                itemName2: this.name2,
                itemName3: this.name3,
                itemName4: this.name4,
                itemName5: '',
                itemSize: this.searchSize,
                itemUnit: this.itemsForm.value.unit,
                status: this.filterByValue,
                done: 0,
                category: ''
            },
            fetchPolicy: 'network-only'
        })
            .map( ({ data }) => {
                console.log(data);
                // this.lastFilter =  this.filterByValue;

                data.apItems.map(y => {
                    // console.log(y.name);

                    let res0 = y.name.replace(/ - /g , ' ');
                    let res1 = res0.replace(/\s+/g, ' ');
                    let res = res1.split(" ");

                    if (res[0] != undefined) {
                        this.tag1[y._id] = res[0];
                    }
                    if (res[1] != undefined) {
                        this.tag2[y._id] = res[1];
                    }
                    if (res[2] != undefined) {
                        this.tag3[y._id]  = res[2];
                    }
                    if (res[3] != undefined) {
                        this.tag4[y._id]  = res[3];
                    }
                    if (res[4] != undefined) {
                        this.tag5[y._id]  = res[4];
                    }
                    if (res[5] != undefined) {
                        this.tag6[y._id]  = res[5];
                    }
                    if (res[6] != undefined) {
                        this.tag7[y._id]  = res[6];
                    }
                    if (res[7] != undefined) {
                        this.tag8[y._id]  = res[7];
                    }
                    if (res[8] != undefined) {
                        this.tag9[y._id]  = res[8];
                    }
                    if (res[9] != undefined) {
                        this.tag10[y._id]  = res[9];
                    }
                    if (res[10] != undefined) {
                        this.tag11[y._id]  = res[10];
                    }
                    if (res[11] != undefined) {
                        this.tag12[y._id]  = res[11];
                    }
                    if (res[12] != undefined) {
                        this.tag13[y._id]  = res[12];
                    }
                    if (res[13] != undefined) {
                        this.tag14[y._id]  = res[13];
                    }
                    if (res[14] != undefined) {
                        this.tag15[y._id]  = res[14];
                    }
                    if (res[15] != undefined) {
                        this.tag16[y._id]  = res[15];
                    }
                    if (res[16] != undefined) {
                        this.tag17[y._id]  = res[16];
                    }
                    if (res[17] != undefined) {
                        this.tag18[y._id]  = res[17];
                    }

                    if (y.searchTitle != null) {
                        let searthTitle = y.searchTitle.split(" ");
                        searthTitle.map(z => {
                            let indx = _.indexOf(res, z);
                            // console.log(z + ' -- ' + indx);

                            switch(indx) {
                                case 0:
                                    this.tag1_ck[y._id] = true;
                                    break;
                                case 1:
                                    this.tag2_ck[y._id] = true;
                                    break;
                                case 2:
                                    this.tag3_ck[y._id] = true;
                                    break;
                                case 3:
                                    this.tag4_ck[y._id] = true;
                                    break;
                                case 4:
                                    this.tag5_ck[y._id] = true;
                                    break;
                                case 5:
                                    this.tag6_ck[y._id] = true;
                                    break;
                                case 6:
                                    this.tag7_ck[y._id] = true;
                                    break;
                                case 7:
                                    this.tag8_ck[y._id] = true;
                                    break;
                                case 8:
                                    this.tag9_ck[y._id] = true;
                                    break;
                                case 9:
                                    this.tag10_ck[y._id] = true;
                                    break;
                                case 10:
                                    this.tag11_ck[y._id] = true;
                                    break;
                                case 11:
                                    this.tag12_ck[y._id] = true;
                                    break;
                                case 12:
                                    this.tag13_ck[y._id] = true;
                                    break;
                                case 13:
                                    this.tag14_ck[y._id] = true;
                                    break;
                                case 14:
                                    this.tag15_ck[y._id] = true;
                                    break;
                                case 15:
                                    this.tag16_ck[y._id] = true;
                                    break;
                                case 16:
                                    this.tag17_ck[y._id] = true;
                                    break;
                                case 17:
                                    this.tag18_ck[y._id] = true;
                                    break;
                                default:
                                    // skip
                            }
                        });
                    }
                })

                return data.apItems;
            });
    }

    applyFilter() {
        this.getCount();
        this.getItems(this.p);
    }


    updateSearchTitle(item, num) {

        this.nameButtonClicked(item._id, num);

        // construct searchTitle
        let searchTitle = '';
        if (this.tag1_ck[item._id]) { searchTitle = this.tag1[item._id] + ' ' }
        if (this.tag2_ck[item._id]) { searchTitle = searchTitle + this.tag2[item._id] + ' ' }
        if (this.tag3_ck[item._id]) { searchTitle = searchTitle + this.tag3[item._id] + ' ' }
        if (this.tag4_ck[item._id]) { searchTitle = searchTitle + this.tag4[item._id] + ' ' }
        if (this.tag5_ck[item._id]) { searchTitle = searchTitle + this.tag5[item._id] + ' ' }
        if (this.tag6_ck[item._id]) { searchTitle = searchTitle + this.tag6[item._id] + ' ' }
        if (this.tag7_ck[item._id]) { searchTitle = searchTitle + this.tag7[item._id] + ' ' }
        if (this.tag8_ck[item._id]) { searchTitle = searchTitle + this.tag8[item._id] + ' ' }
        if (this.tag9_ck[item._id]) { searchTitle = searchTitle + this.tag9[item._id] + ' ' }
        if (this.tag10_ck[item._id]) { searchTitle = searchTitle + this.tag10[item._id] + ' ' }
        if (this.tag11_ck[item._id]) { searchTitle = searchTitle + this.tag11[item._id] + ' ' }
        if (this.tag12_ck[item._id]) { searchTitle = searchTitle + this.tag12[item._id] + ' ' }
        if (this.tag13_ck[item._id]) { searchTitle = searchTitle + this.tag13[item._id] + ' ' }
        if (this.tag14_ck[item._id]) { searchTitle = searchTitle + this.tag14[item._id] + ' ' }
        if (this.tag15_ck[item._id]) { searchTitle = searchTitle + this.tag15[item._id] + ' ' }
        if (this.tag16_ck[item._id]) { searchTitle = searchTitle + this.tag16[item._id] + ' ' }
        if (this.tag17_ck[item._id]) { searchTitle = searchTitle + this.tag17[item._id] + ' ' }
        if (this.tag18_ck[item._id]) { searchTitle = searchTitle + this.tag18[item._id] }

        console.log(item._id + ' ==== ' + num + ' == ' + searchTitle);

        Meteor.call('updateItemSearchTitle', item, searchTitle, (err, res) => {
            if (err) {
                console.error("!!!!!!!! GO AN ERROR ON: updateItemSearchTitle..... !!!!!!!!!");
                console.error(err);
                return;
            }
            else {
                if (!res.status) {
                    console.error("!!!!!!!! ERROR ON: updateItemSearchTitle ..... !!!!!!!!! == " + res.error);
                    console.error(err);
                    return;
                }
                else {
                    console.warn("SUCCESSFULLY UPDATED updateItemSearchTitle... " + res.status);
                }
            }
        });
    }


    /**
     * Called by parent function
     * 
     * @param id 
     * @param tag 
     */
    nameButtonClicked(id, tag) {

        tag = parseInt(tag);

        switch (tag) {
            case 1:
                if (this.tag1_ck[id])       { this.tag1_ck[id] = false; }
                else                        { this.tag1_ck[id] = true; }
                break;
            case 2:
                if (this.tag2_ck[id])       { this.tag2_ck[id] = false; }
                else                        { this.tag2_ck[id] = true; }
                break;
            case 3:
                if (this.tag3_ck[id])       { this.tag3_ck[id] = false; }
                else                        { this.tag3_ck[id] = true; }
                break;
            case 4:
                if (this.tag4_ck[id])       { this.tag4_ck[id] = false; }
                else                        { this.tag4_ck[id] = true; }
                break;
            case 5:
                if (this.tag5_ck[id])       { this.tag5_ck[id] = false; }
                else                        { this.tag5_ck[id] = true; }
                break;
            case 6:
                if (this.tag6_ck[id])       { this.tag6_ck[id] = false; }
                else                        { this.tag6_ck[id] = true; }
                break;
            case 7:
                if (this.tag7_ck[id])       { this.tag7_ck[id] = false; }
                else                        { this.tag7_ck[id] = true; }
                break;
            case 8:
                if (this.tag8_ck[id])       { this.tag8_ck[id] = false; }
                else                        { this.tag8_ck[id] = true; }
                break;
            case 9:
                if (this.tag9_ck[id])       { this.tag9_ck[id] = false; }
                else                        { this.tag9_ck[id] = true; }
                break;
            case 10:
                if (this.tag10_ck[id])       { this.tag10_ck[id] = false; }
                else                         { this.tag10_ck[id] = true; }
                break;
            case 11:
                if (this.tag11_ck[id])       { this.tag11_ck[id] = false; }
                else                         { this.tag11_ck[id] = true; }
                break;
            case 12:
                if (this.tag12_ck[id])       { this.tag12_ck[id] = false; }
                else                         { this.tag12_ck[id] = true; }
                break;
            case 13:
                if (this.tag13_ck[id])       { this.tag13_ck[id] = false; }
                else                         { this.tag13_ck[id] = true; }
                break;
            case 14:
                if (this.tag14_ck[id])       { this.tag14_ck[id] = false; }
                else                         { this.tag14_ck[id] = true; }
                break;
            case 15:
                if (this.tag15_ck[id])       { this.tag15_ck[id] = false; }
                else                         { this.tag15_ck[id] = true; }
                break;
            case 16:
                if (this.tag16_ck[id])       { this.tag16_ck[id] = false; }
                else                         { this.tag16_ck[id] = true; }
                break;
            case 17:
                if (this.tag17_ck[id])       { this.tag17_ck[id] = false; }
                else                         { this.tag17_ck[id] = true; }
                break;
            case 18:
                if (this.tag18_ck[id])       { this.tag18_ck[id] = false; }
                else                         { this.tag18_ck[id] = true; }
                break;
        }
    }


    toggleMeFunc(x) {
        if (this.toggleMe[x]) {
            this.toggleMe[x] = 0;
        }
        else {
            this.toggleMe[x] = 1;
        }
    }
}



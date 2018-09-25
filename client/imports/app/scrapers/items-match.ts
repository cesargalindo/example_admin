import { Component, NgZone, OnInit } from '@angular/core';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { Router }  from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { UserService } from '../services/UserService';
import { VariablesService } from '../services/VariablesService';
import { AuthService } from '../services/auth/auth.service';

import gql from 'graphql-tag';

import template from "./items-match.html";
import style from "./items-match.scss";

@Component({
    selector: 'items-list2',
    template,
    styles: [ style ]
})
export class ItemsMatchComponent implements OnInit {
    apolloItems: ApolloQueryObservable<any>;
    apolloItemsCount: ApolloQueryObservable<any>;

    total: number;
    pageSize: number = 20;
    p: number = 1;
    dateOrder: number = -1;

    itemsForm: FormGroup;
    inputSearchName: string = '';
    searchSize: string = '';
    searchUnit: string = '';

    searchName: string = '';    
    search1: string;
    search2: string;
    search3: string;
    search4: string;
    search5: string;
    
    name1: string;
    name2: string;
    name3: string;
    name4: string;
    name5: string;
    name6: string;
    name7: string;
    name8: string;

    name1_check: boolean = true;
    name2_check: boolean = false;
    name3_check: boolean = false;
    name4_check: boolean = false;
    name5_check: boolean = false;
    name6_check: boolean = false;
    name7_check: boolean = false;
    name8_check: boolean = false;
    name9_check: boolean = false;
    name10_check: boolean = false;
    name11_check: boolean = false;
    name12_check: boolean = false;
    name13_check: boolean = false;
    name14_check: boolean = false;
    name15_check: boolean = false;

    size: string;
    unit: string;
    owner: string;
    
    filterByForm = FormGroup;
    filterByValue: number;
    filterByLists: Array<any>;
    lastFilter: number;

    contractor: boolean = false;
    
    toggleMe: Object = {};
    mItems: Object = {};
    
    unitsList: Array<any>;
    categories: Array<any>;
    dupChecks: Object = {};
    customQtyChecks: Object = {};
    
    scrapeItemId: string;
    itemName: string;
    itemImage: string;
    itemSize: number;
    itemUnit: string;
    itemQuantity: number;
    itemDescription: string;
    itemPrice: number;
    itemStatus: number;
    
    isAdmin: boolean = false;
    
    constructor(
        private formBuilder: FormBuilder,
        private apollo: Angular2Apollo,
        private router: Router,
        private _ngZone: NgZone,
        public _varsService: VariablesService,
        private _authService: AuthService,
        public _userService: UserService) {}


    ngOnInit() {
        // show top toolbar
        this._varsService.setReactiveTitleName('MATCH ITEM: 1 lb = 16 oz, 2 lb = 32 oz, 3 lb = 48 oz, 4 lb = 64 oz, 5 lb = 90 oz, 1 pint = 16 fl oz, 1 qt = 32 fl oz, 1.75 qt = 56 fl oz');
        this._varsService.setReactiveHideToolbar(false);

        this.unitsList = this._varsService.unitsList;
        this.categories = this._varsService.categories;

        this.toggleMe['topImage'] = 0;

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

        this.filterByForm = this.formBuilder.group({
            value: [ '' ],
            category: [this._userService.selectedCategory]
        });


        this.owner = '';
        this.filterByValue = 99;
        this.lastFilter = 99;

        if (this._varsService.params.name == undefined) {
            alert("ERROR: not item selected");
            return;
        }
        else {
            let result = this._varsService.params;
            this.scrapeItemId = result._id;
            this.searchName = result.name;
            this.itemName = result.name;
            this.itemImage = result.image;
            this.itemSize = result.size;
            this.itemUnit = result.unit;
            this.itemQuantity = result.quantity;
            this.itemDescription = result.description;            
            this.itemStatus = result.status;

            if (result.mitems != null) {
                result.mitems.map(x => {
                    this.mItems[x.itemId] = 1;
                })
            }

            Meteor.call('getSPrice', this.scrapeItemId, (error, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    if (error) {
                        console.log(error);
                    }
                    else {
                        if (res.status) {
                            this.itemPrice = res.price;

                            // get initial count
                            this.getCount();
                        
                            // load initial page
                            this.getItems(this.p);
                        }
                        else {
                            console.error(res.error);
                        }
                    }
                });
            });


        }

        // display Dup option if user is admin
        this.isAdmin = this._authService.isAdmin;  
    }


    getItemsParent(p) {
        this.getCount();
        this.getItems(p);
    }


    getCount() {
        this.search1 = '';
        this.search2 = '';
        this.search3 = '';
        this.search4 = '';
        this.search5 = '';

        this.name1 = '';
        this.name2 = '';
        this.name3 = '';
        this.name4 = '';
        this.name5 = '';
        this.name6 = '';
        this.name7 = '';
        this.name8 = '';

        this.size = '';
        this.unit = '';

        if (this.filterByForm.value.category) {
            this._userService.selectedCategory = this.filterByForm.value.category;            
        }
        else {
            this._userService.selectedCategory = '';            
        }

        // Select first 3 search terms from input box
        let s0 = this.inputSearchName.split(" ");
        if (s0[0] != undefined) {
            this.search1 = s0[0];
        }
        if (s0[1] != undefined) {
            this.search2 = s0[1];
        }
        if (s0[2] != undefined) {
            this.search3 = s0[2];
        }

        // Select remaning search terms from "buttons"
        let res0 = this.searchName.replace(/\,/g , ' ');
        let res1 = res0.replace(/\&amp;/g , '');        
        res0 = res1.replace(/äó»/g, "'");
        res1 = res0.replace(/\&\#233;/g, 'e');
        res0 = res1.replace(/\d+-PACK /gi, ' ');
        res1 = res0.replace(/ \s+/g, ' ');
        res0 = res1.replace(/^\s+|\s+$/g, "");
        res1 = res0.replace(/\&\#174;/g, 'e');
        res0 = res1.replace(/’/g, "'");

        let res = res0.split(" ");
        console.error(res);

        if (res[0] != undefined) {
            this.name1 = res[0];
            if (this.name1_check) {
                this.setSearchNames(this.name1);
            }
        }
        if (res[1] != undefined) {
            this.name2 = res[1];
            if (this.name2_check) {
                this.setSearchNames(this.name2);
            }
        }
        if (res[2] != undefined) {
            this.name3 = res[2];
            if (this.name3_check) {
                this.setSearchNames(this.name3);
            }
        }
        if (res[3] != undefined) {
            this.name4 = res[3];
            if (this.name4_check) {
                this.setSearchNames(this.name4);
            }
        }
        if (res[4] != undefined) {
            this.name5 = res[4];
            if (this.name5_check) {
                this.setSearchNames(this.name5);
            }
        }
        if (res[5] != undefined) {
            this.name6 = res[5];
            if (this.name6_check) {
                this.setSearchNames(this.name6);
            }
        }
        if (res[6] != undefined) {
            this.name7 = res[6];
            if (this.name7_check) {
                this.setSearchNames(this.name7);
            }
        }
        if (res[7] != undefined) {
            this.name8 = res[8];
            if (this.name8_check) {
                this.setSearchNames(this.name8);
            }
        }


        // Common Terms
        if (this.name9_check) {
            this.setSearchNames('fresh');
        }
        if (this.name10_check) {
            this.setSearchNames('frozen');
        }
        if (this.name11_check) {
            this.setSearchNames('raw');
        }
        if (this.name12_check) {
            this.setSearchNames('bar');
        }
        if (this.name13_check) {
            this.setSearchNames('bottle');
        }
        if (this.name14_check) {
            this.setSearchNames('can');
        }
        if (this.name15_check) {
            this.setSearchNames('cooked');
        }

        let res2 = this.searchSize.split(" ");
        if (res2[0] != undefined) {
            this.size = res2[0];
        }

        if (this.itemsForm.value.unit) {
            this.unit = this.itemsForm.value.unit;
        }

        // Load Items Count -- it should always return before Items data
        this.apolloItemsCount = this.apollo.watchQuery({
            query: gql`
                query ItemsCount($itemName1: String, $itemName2: String, $itemName3: String, $itemName4: String, $itemName5: String, $itemSize: String, $itemUnit: String, $status: Int, $owner: String, $done: Int, $category: String) {
                  apItemsCount(itemName1: $itemName1, itemName2: $itemName2, itemName3: $itemName3, itemName4: $itemName4, itemName5: $itemName5, itemSize: $itemSize, itemUnit: $itemUnit, status: $status, owner: $owner, done: $done, category: $category) {
                    count
                  }
                }
              `,
            variables: {
                itemName1: this.search1,
                itemName2: this.search2,
                itemName3: this.search3,
                itemName4: this.search4,
                itemName5: this.search5,
                itemSize: this.size,
                itemUnit: this.unit,
                status: this.filterByValue,
                owner: this.owner,                
                done: 0,
                category: this._userService.selectedCategory
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
              query ItemsInfo($itemName1: String, $itemName2: String, $itemName3: String, $itemName4: String, $itemName5: String, $itemSize: String, $itemUnit: String, $options: String, $status: Int, $owner: String, $done: Int, $category: String) {
                apItems(itemName1: $itemName1, itemName2: $itemName2, itemName3: $itemName3, itemName4: $itemName4, itemName5: $itemName5, itemSize: $itemSize, itemUnit: $itemUnit, options: $options, status: $status, owner: $owner, done: $done, category: $category) {
                    _id
                    name
                    size
                    unit
                    quantity
                    image
                    public
                    note
                    category
                    upc
                    dupCount {
                        count
                    }
                }
              }
            `,
            variables: {
                options: serializeOptions,
                itemName1: this.search1,
                itemName2: this.search2,
                itemName3: this.search3,
                itemName4: this.search4,
                itemName5: this.search5,
                itemSize: this.size,
                itemUnit: this.unit,
                status: this.filterByValue,
                owner: this.owner,                
                done: 0,
                category: this._userService.selectedCategory
            },
            fetchPolicy: 'network-only'
        })
            .map( ({ data }) => {
                console.log(data);
                this.lastFilter =  this.filterByValue;
                return data.apItems;
            });
    }


    setSearchNames(searchName) {
        if (this.search1 == '') {
            this.search1 = searchName;
        }
        else if (this.search2 == '') {
            this.search2 = searchName;
        }
        else if (this.search3 == '') {
            this.search3 = searchName;
        }
        else if (this.search4 == '') {
            this.search4 = searchName;
        }
        else if (this.search5 == '') {
            this.search5 = searchName;
        }
    }


    nameClicked(num, status) {
        switch( num ) {
            case 1: 
                this.name1_check = status;
                break;
            case 2: 
                this.name2_check = status;
                break;
            case 3:
                this.name3_check = status;
                break;
            case 4: 
                this.name4_check = status;
                break;
            case 5:
                this.name5_check = status;
                break; 
            case 6:
                this.name6_check = status;
                break;
            case 7:
                this.name7_check = status;
                break;
            case 8:
                this.name8_check = status;
                break;
            case 9:
                this.name9_check = status;
                break;
            case 10:
                this.name10_check = status;
                break;
            case 11:
                this.name11_check = status;
                break;
            case 12:
                this.name12_check = status;
                break;
            case 13:
                this.name13_check = status;
                break;
            case 14:
                this.name14_check = status;
            case 15:
                this.name15_check = status;
                break;
          } 

          this.applyFilter();
    }


    applyFilter() {
        this.getCount();
        this.getItems(this.p);
    }


    deSelectItem(item) {
        this.mItems[item._id] = 0;
        
        Meteor.call('scrapedItem.pull', this.scrapeItemId, item._id, false, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: scrapedItem PULL !!!!!!!!!");
                    console.error(err);
                    this._varsService.setReactiveError();
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: scrapedItem PULL..." + res.error);
                        this._varsService.setReactiveError();
                        return;
                    }
                    else {
                        console.log("SUCCESSFULLY PULL scrapedItem...");
                    }
                }
            });
        });   
    }


    selectItem(item) {
        this.mItems[item._id] = 1;
        let qty = 1;

        if ( this.customQtyChecks[item._id] ) {
            let temp = prompt("Enter custom quantity : ", "enter number here");

            qty = parseFloat(temp);
            
            if ( !_.isNumber(qty) ) {
                alert('Quantity is not a number.');
                return;
            }
        }

        Meteor.call('scrapedItem.push', this.scrapeItemId, item._id, qty, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: scrapedItem push !!!!!!!!!");
                    console.error(err);
                    this._varsService.setReactiveError();
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: scrapedItem push..." + res.error);
                        this._varsService.setReactiveError();
                    }
                    else {
                        console.log("SUCCESSFULLY PUSH scrapedItem...");
                    }
                }
            });
        });
    }


    editItem(item) {
        this.router.navigate(['/item-edit', { itemId: item._id, action: 'edit', contractor: true, redirect: this.router.url }]);
    }


    onChangeUnit(unit) {
        this.itemsForm.value.unit = unit;
        // reload page
        this.applyFilter();
    }


    toggleMeFunc(x) {
        if (this.toggleMe[x]) {
            this.toggleMe[x] = 0;
        }
        else {
            this.toggleMe[x] = 1;
        }
    }


    checkMe(item) {
        if (this.dupChecks[item._id]) {
            // this.dupChecks[item._id] = 0;
            this.dupChecks = _.omit(this.dupChecks, item._id) 
        }
        else {
            this.dupChecks[item._id] = item._id;
        }
    }


    customQuantityChecked(item) {
        if (this.customQtyChecks[item._id]) {
            this.customQtyChecks[item._id] = 0
        }
        else {
            this.customQtyChecks[item._id] = 1;
        }
    }

    /**
     * 
     */
    setDups() {
        if (_.size(this.dupChecks) < 2) {
            alert('A minimum of two dups is required...');
            return;
        }

        Meteor.call('setItemDuplicates', this.dupChecks, false, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: setItemDuplicates  !!!!!!!!!");
                    console.error(err);
                    this._varsService.setReactiveError();
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: setItemDuplicates ..." + res.error);
                        this._varsService.setReactiveError();
                    }
                    else {
                        console.log("SUCCESSFULLY setItemDuplicates...");
                    }
                }
            });
        });
    }


    editItemStatus2() {
        this._ngZone.run(() => { // run inside Angular2 world
            if (this.itemStatus == undefined) {
                this._varsService.status = 1;   // skip
                this.itemStatus = 1;
            }
            else {
                // toggle status
                if (this.itemStatus > 0) {
                    this._varsService.status = 0;
                    this.itemStatus = 0;                
                }
                else {
                    this._varsService.status = 1;
                    this.itemStatus = 1;
                }
            }
            this._varsService.note = 'skip';
            this._varsService.name = this.itemName
            this._varsService.selectedItemId = this.scrapeItemId;
            document.getElementById('foofooclick').click();  
        })
    };


}



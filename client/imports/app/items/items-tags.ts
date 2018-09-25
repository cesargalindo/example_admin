import { Component, NgZone, OnInit } from '@angular/core';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { ActivatedRoute }  from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { UserService } from '../services/UserService';
import { VariablesService } from '../services/VariablesService';
import { AuthService } from '../services/auth/auth.service';
import { Item } from '../../../../both/models/item.model';

import gql from 'graphql-tag';

import template from "./items-tags.html";
import style from "./items-tags.scss";

@Component({
    selector: 'items-list2',
    template,
    styles: [ style ]
})
export class ItemsTagsComponent implements OnInit {
    apolloItems: ApolloQueryObservable<any>;
    apolloItemsCount: ApolloQueryObservable<any>;

    total: number;
    pageSize: number = 100;
    p: number = 1;
    dateOrder: number = -1;

    itemsForm: FormGroup;
    searchName: string = '';
    searchSize: string = '';
    searchUnit: string = '';
    name1: string;
    name2: string;
    name3: string;
    size: string;
    unit: string;
    owner: string = '';

    filterByForm = FormGroup;
    filterByValue: number;
    filterByLists: Array<any>;
    lastFilter: number;

    contractor: boolean = false;
    
    toggleMe: Object = {};
    
    unitsList: Array<any>;
    categories: Array<any>;
    
    constructor(
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private apollo: Angular2Apollo,
        private _ngZone: NgZone,
        public _varsService: VariablesService,
        public _authService: AuthService,
        public _userService: UserService) {}


    ngOnInit() {
        this._varsService.setReactiveTitleName('ITEM TAGS');
        
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

        this.filterByForm = this.formBuilder.group({
            value: [ '' ],
            category: [this._userService.selectedCategory]
        });

        this.filterByLists = [
            {value: 99, viewValue: 'all'},
            {value: -2, viewValue: 'Rejected'},
            {value: -1, viewValue: 'Duplicate'},
            {value:  0, viewValue: 'Inactive'},
            {value:  1, viewValue: 'Flagged'},
            {value:  2, viewValue: 'Active'}
        ];
        this.filterByValue = 99;
        this.lastFilter = 99;

        this.route.params.subscribe((params) => {
            // re-run item search
            if (params['searchName']) {
                this.searchName = params['searchName'];
            }
        });

        if (this._authService.isAdmin) {
            // get initial count
            this.getCount();
        
            // load initial page
            this.getItems(this.p);
        }
        else {
            // Check if time to refetch from Apollo
            let email = Meteor.user().emails[0].address;

            // Get user Id
            Meteor.call('getUserbyEmailMethod', email, (error, res) => {
                if (error) {
                    console.error(error);
                }
                else {
                    this.owner = res._id;
                    console.warn(res);
                    this._ngZone.run(() => { // run inside Angular2 world
                        // get initial count
                        this.getCount();
                            
                        // load initial page
                        this.getItems(this.p);
                    });
                }
            });
        }
    }


    getItemsParent(p) {
        this.getCount();
        this.getItems(p);
    }


    getCount() {
        this.name1 = '';
        this.name2 = '';
        this.name3 = '';
        this.size = '';
        this.unit = '';

        if (this.filterByForm.value.category) {
            this._userService.selectedCategory = this.filterByForm.value.category;            
        }
        else {
            this._userService.selectedCategory = '';            
        }

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

        console.log( this.name1 + ' -- ' + this.name2 + ' -- ' + this.name3 + ' -- ' + this._userService.selectedCategory);

        let res2 = this.searchSize.split(" ");
        if (res2[0] != undefined) {
            this.size = res2[0];

        }
        if (res2[1] != undefined) {
            this.unit = res2[1];
        }

        console.log( this.size + ' -- ' + this.unit);

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
                itemName1: this.name1,
                itemName2: this.name2,
                itemName3: this.name3,
                itemName4: '',
                itemName5: '',
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
                    owner
                    size2
                    image2
                    price2
                    quantity2
                    storeId2
                    tags
                }
              }
            `,
            variables: {
                options: serializeOptions,
                itemName1: this.name1,
                itemName2: this.name2,
                itemName3: this.name3,
                itemName4: '',
                itemName5: '',
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

                // this.organic[id] = true;

                data.apItems.map(y => {
                    if (y.tags) {
                        y.tags.map(z => {
                            this._varsService.initTagObjValue(z, y._id);
                        })
                    }
                })
                return data.apItems;
            });
    }


    applyFilter() {
        this.getCount();
        this.getItems(this.p);
    }


    updateItemTags(item, tag) {
        let iu = <Item>{};
        iu._id = item._id;
        iu.name = item.name;
        iu.unit = item.unit;
        iu.size = item.size;
        iu.note = 'tag-only';

        this._varsService.setTagObjValue(tag, item._id);

        iu.tags = this._varsService.createTagObjArray(item._id);

        Meteor.call('parent.ddp.items.update', iu, true, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: updateItemTags !!!!!!!!!");
                    console.error(err);
                    this._varsService.setReactiveError();
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: updateItemTags..." + res.error);
                        this._varsService.setReactiveError();
                        return;
                    }
                    else {
                        console.log("SUCCESSFULLY updateItemTags...");
                    }
                }
            });

        });
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



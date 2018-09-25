import { Component, NgZone, OnInit } from '@angular/core';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { ActivatedRoute, Router }  from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { UserService } from '../services/UserService';
import { VariablesService } from '../services/VariablesService';

import gql from 'graphql-tag';

import template from "./items-list.html";
import style from "./items-list.scss";

@Component({
    selector: 'items-list',
    template,
    styles: [ style ]
})
export class ItemsListComponent implements OnInit {
    apolloItems: ApolloQueryObservable<any>;
    apolloItemsCount: ApolloQueryObservable<any>;

    total: number;
    pageSize: number = 50;
    p: number = 1;
    dateOrder: number = -1;

    itemsForm: FormGroup;
    searchName: string = '';
    searchSize: string = '';
    name1: string;
    name2: string;
    name3: string;
    name4: string;

    filterByValue: number;

    contractor: boolean = false;
    
    unitsList: Array<any>;
    categories: Array<any>;

    toggleMe: Object = {};
    
    constructor(
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private apollo: Angular2Apollo,
        private router: Router,
        private _ngZone: NgZone,
        public _varsService: VariablesService,
        public _userService: UserService) {}


    ngOnInit() {
        this._varsService.setReactiveTitleName('ITEMS');
        
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
                return data.apItems;
            });
    }

    applyFilter() {
        this.getCount();
        this.getItems(this.p);
    }

    editItem(item) {
        this.router.navigate(['/item-edit', { itemId: item._id, action: 'edit', redirect: '/items' }]);
    }

    duplicateItem(item) {
        this.router.navigate(['/item-duplicate', { itemId: item._id }]);
    }

    approveItem(item) {
        this.router.navigate(['/item-edit', { itemId: item._id, action: 'approve', redirect: '/items' }]);
    }

    rejectItem(item) {
        this.router.navigate(['/item-edit', { itemId: item._id, action: 'reject', redirect: '/items' }]);
    }

    request(item) {
        this.router.navigate(['/requestprices-p', { itemId: item._id }]);
    }

    submit(item) {
        this.router.navigate(['/submitprices-p', { itemId: item._id }]);
    }

    scheduleRequest(item) {
        this.router.navigate(['/rp-schedule-cr', { itemId: item._id }]);
    }

    scheduleSubmit(item) {
        this.router.navigate(['/sp-schedule-cr', { itemId: item._id }]);
    }

    AddNewItem() {
        this.router.navigate(['/item-new', { name: 'pick up from search string...' }]);
    }

    /**
     * Make a copy of item 
     * a) append - NEW to name
     * b) remove UPC 
     * c) keep everything else the same
     */
    copyItem(item) {
        if (confirm("ARE YOU SURE - make a copy of this item") == true) {
            var txt = "yes";

            Meteor.call('ddp.items.insert.byAdmin', item, true, (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world

                    if (err) {
                        console.error("!!!!!!!! GO AN ERROR ON: items.insert.byAdmin..... !!!!!!!!!");
                        console.error(err);
                        return;
                    }
                    else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: items.insert.byAdmin ..... !!!!!!!!! == " + res.error);
                            console.error(err);
                            return;
                        }
                        else {
                            console.warn("SUCCESSFULLY INSERTED NEW items.insert.byAdmin... " + res.status);
                        }
                    }
                });
            });


        } else {
            var txt = "no";
        }
    }

    /**
     * Delete item
     */
    deleteItem(item) {
        if (confirm("ARE YOU SURE - delete this item") == true) {
            var txt = "yes";
            let im = item.image.split("/");
            // Meteor.call('deleteItem', item._id, _.last(im), (err, res) => {
            Meteor.call('deleteItem', item._id, 'skip', (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    if (err) {
                        console.error("!!!!!!!! ERROR: deleting item !!!!!!!!!");
                        console.error(err);
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: deleting item..." + res.error);
                        }
                        else {
                            console.log('Successfully deleted item: ' + item.name);
                        }
                    }
                });
            });
        } else {
            var txt = "no";
        }
    }


    /**
     * Edit item name from Dialog
     * 
     */
    editItemName(it) {
        this._varsService.name = it.name;
        this._varsService.selectedItemId = it._id;
        document.getElementById('dialogItemClickId').click();  
    }

    /**
     * Add price from Dialog
     * 
     */
    addTempPrice(it) {
        let currentDate = new Date().getTime();

        if (currentDate > this._userService.scheduledTimestamp) {
            alert('ERROR: scheduled time must be greater the the current time.');
        }
        else if ( (this._userService.storeId == undefined) || (this._userService.storeId =='')) {
            alert('ERROR: please select a store.');
        }
        else {
            this._varsService.name = it.name;
            this._varsService.selectedItemId = it._id;
            document.getElementById('dialogTpriceClickId').click();  
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



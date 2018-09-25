import { Component, NgZone, OnInit } from '@angular/core';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { ActivatedRoute, Router }  from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { UserService } from '../services/UserService';
import { VariablesService } from '../services/VariablesService';

import gql from 'graphql-tag';

import template from "./items-contractor.html";
import style from "./items-contractor.scss";

@Component({
    selector: 'items-list',
    template,
    styles: [ style ]
})
export class ItemsContractorComponent implements OnInit {
    apolloItems: ApolloQueryObservable<any>;
    apolloItemsCount: ApolloQueryObservable<any>;

    total: number;
    pageSize: number;
    p: number = 1;

    itemsForm: FormGroup;
    searchName: string = '';
    searchSize: string = '';
    searchUnit: string = '';
    name1: string;
    name2: string;
    name3: string;
    size: string;
    unit: string;
    owner: string;
    done: number = 0;
    testNumber: number = 0;
    errors: string;
    adminId: string;

    sortByForm = FormGroup;
    sortByValue: string;
    sortByLists: Array<any>;
    lastFilter: number;
    superadmin: boolean = false;

    unitsList: Array<any>;
    categories: Array<any>;

    doneList = [
        { value: 0, viewValue: 'all' },
        { value: 1, viewValue: 'Done' },
        { value: 2, viewValue: 'Not Done' }
    ];

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
        this._varsService.setReactiveTitleName('CONTRACTOR ITEMS');

        // show top toolbar
        this._varsService.setReactiveHideToolbar(false);

        this.unitsList = this._varsService.unitsList;
        this.categories = this._varsService.categories;

        // Check if user has superadmin role
        if ( _.indexOf(Meteor.user().roles, 'superadmin') > -1 ) {
            this.superadmin = true;                
        }

        if (this._userService.searchName != undefined) {
            this.searchName = this._userService.searchName;
        }

        if (this._userService.done != undefined) {
            this.done = this._userService.done;
        }

        if (this._userService.selectedCategory == undefined) {
            this._userService.selectedCategory = '';
        }

        this.itemsForm = this.formBuilder.group({
            name: [this.searchName],
            size: [''],
            unit: [''],
            done: [this.done],
            category: [this._userService.selectedCategory],
            
        });

        if (this._userService.sortBy == undefined) {
            this.sortByForm = this.formBuilder.group({
                value: [ 'created' ]
            });
            this.sortByValue = 'created';
        }
        else {
            this.sortByForm = this.formBuilder.group({
                value: [this._userService.sortBy]
            });
            this.sortByValue = this._userService.sortBy
        }

        this.sortByLists = [
            {value:  'created', viewValue: 'Last Updated'},
            {value:  'created_first', viewValue: 'First Updated'},
            {value:  'name', viewValue: 'Name'},            
            {value:  'size', viewValue: 'Size'},
            {value:  'unit', viewValue: 'Units'},
            {value:  'note', viewValue: 'Note'},
            {value:  'category', viewValue: 'Category'},
        ];
        this.lastFilter = 99;

        this.route.params.subscribe((params) => {
            // re-run item search
            if (params['searchName']) {
                this.searchName = params['searchName'];
            }
        });

        // Check if time to refetch from Apollo
        let email = Meteor.user().emails[0].address;

        // Get user Id
        Meteor.call('getUserbyEmailMethod', email, (error, res) => {
            if (error) {
                console.error(error);
            }
            else {
                this.adminId = res._id;
                this.owner = res._id;

                // Include team ids if lead Contractor
                if (_.indexOf(Meteor.user().roles, 'leadContractor') > -1) {
                    console.error( Meteor.user().roles );      
                    console.log( this._userService.contractorIds );

                    let temp = this._userService.contractorIds;
                    temp.push(this.owner);
                    this.owner = JSON.stringify(temp);
                    // this.owner = temp;
                    console.log(temp);
                }

                console.warn(res);
                this._ngZone.run(() => { // run inside Angular2 world
                    // get initial count
                    this.getCount();
                        
                    // load initial page
                    this.getItems(this.p, 0);
                });
            }
        });
    }

    /**
     * 
     * @param page 
     * @param skipLimit 
     */
    getItemsParent(page, skipLimit) {
        this.getCount();
        this.getItems(page, skipLimit);
    }


    getCount() {
        this.name1 = '';
        this.name2 = '';
        this.name3 = '';
        this.size = '';
        this.unit = '';
        this.done = 0;

        if (this.itemsForm.value.category) {
            this._userService.selectedCategory = this.itemsForm.value.category;            
        }
        else {
            this._userService.selectedCategory = '';            
        }

        this._userService.searchName = this.searchName;
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

        console.log( this.name1 + ' -- ' + this.name2 + ' -- ' + this.name3 + ' -- ' + this.searchSize + ' -- ' +  this.itemsForm.value.unit + ' -- ' + this.itemsForm.value.done );

        if (this.searchSize != undefined) {
            this.size = this.searchSize;
        }
        if (this.itemsForm.value.unit != '') {
            this.unit = this.itemsForm.value.unit;
        }
        if (this.itemsForm.value.done != '') {
            this.done = this.itemsForm.value.done;
        }
        
        this._userService.done = this.done;

        // Override done with test number
        if (this.testNumber) {
            this.done = this.testNumber;
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
                itemName1: this.name1,
                itemName2: this.name2,
                itemName3: this.name3,
                itemName4: '',
                itemName5: '',
                itemSize: this.size,
                itemUnit: this.unit,
                status: 99,
                owner: this.owner,
                done: this.done,
                category: this._userService.selectedCategory
            },
            fetchPolicy: 'network-only'
        })
            .map( x => {
                console.log(x.data);
                this.total = x.data.apItemsCount.count;
            });
    }

    getItems(page, skipLimit) {
        
        if (skipLimit) {
            this.pageSize = 300;            
        }
        else {
            this.pageSize = 25;
        }

        
        let sortQuery = { };
        if (this.sortByValue == 'created') {
            sortQuery = {created: -1};
        }
        else if (this.sortByValue == 'created_first') {
            sortQuery = { created: 1 }
        }
        else if (this.sortByValue == 'name') {
            sortQuery = { name: -1 }
        }
        else if (this.sortByValue == 'name') {
            sortQuery = { name: -1 }
        }
        else if (this.sortByValue == 'size') {
            sortQuery = { size: 1 }
        }
        else if (this.sortByValue == 'unit') {
            sortQuery = { unit: 1 }
        }
        else if (this.sortByValue == 'category') {
            sortQuery = { category: 1 }
        }
        else if (this.sortByValue == 'note') {
            sortQuery = { note: -1 }
        }

        this._userService.sortBy = this.sortByValue;

        this.p = page;
        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: sortQuery
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
                status: 99,
                owner: this.owner,
                done: this.done,
                category: this._userService.selectedCategory
            },
            fetchPolicy: 'network-only'
        })
            .map( ({ data }) => {
                console.log(data);

                console.warn(data.apItems);

                if (skipLimit) {
                    if (skipLimit == 1) {
                        this.captureItemIdsToDuplicate(data.apItems);                        
                    }
                    else {
                        this.removeDoubleColans2(data.apItems);                        
                    }
                }

                return data.apItems;
            });
    }

    /**
     * 
     * @param data 
     */
    captureItemIdsToDuplicate(data) {
        this.duplicateResultsStep2(data);        
    }


    onRefreshClicked() {
        this._ngZone.run(() => { // run inside Angular2 world
            this.apolloItemsCount.refetch();
            this.apolloItems.refetch();
        });

    }

    applyFilter() {
        this.errors = '';
        this.testNumber = 0;            
        this.getCount();
        this.getItems(this.p, 0);
    }

    runTest(num) {
        this.testNumber = num;
        if (num == 51) {
            this.errors = 'ERRORS: please update item with valid item information.'
        }
        else if (num == 52) {
            this.errors = 'ERRORS: add space between numbers and letters, example: change 6oz to 6 oz, change 30mg to 30 mg, change 0.95oz to 0.95 oz, change 75ct to 75 ct, etc.'
        }
        else if (num == 53) {
            this.errors = 'ERRORS: please remove invalid characters such as &reg;';
        }
        else if (num == 54) {
            this.errors = 'ERRORS: there should not be any one letter words.  Most likely the description is wrong. Please fix.';
        }
        else if (num == 55) {
            this.errors = 'ERRORS: This large numbers appears suspicious, please confirm they belong in item information.';
        }
        else if (num == 56) {
            this.errors = 'ERRORS: Special characters such as ":" found, please confirm they should not be there. Replace : with a comma ,';
        }
        else if (num == 57) {
            this.errors = 'ERRORS: incorrect format "20-count" should be "20 ct", please update to correct format.';
        }

        this.getCount();
        this.getItems(this.p, 0);
    }


    editItem(item) {
        this.router.navigate(['/item-edit', { itemId: item._id, action: 'edit', redirect: '/items-c', contractor: true }]);
    }

    /**
     * Delete item
     */
    deleteItem(item) {
        if (confirm("ARE YOU SURE - delete this item") == true) {
            var txt = "yes";
            this.errors = '';
            let im = item.image.split("/");
            Meteor.call('deleteItem', item._id, _.last(im), (err, res) => {
                
                this._ngZone.run(() => { // run inside Angular2 world
                    if (err) {
                        console.error("!!!!!!!! ERROR: deleting item !!!!!!!!!");
                        console.error(err);
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: deleting item..." + res.error);
                            return;
                        }
                        else {
                            this.errors = 'Successfully deleted item: ' + item.name;
                        }
                    }
                });
            });
        } else {
            var txt = "no";
        }
    }


    /**
     * Duplicate all items that are return from search - exclude UPC number
     */
    duplicateResults() {
        if (this.searchName == '') {
            alert('A search string is required.');
        }
        else {
            this.errors = '';
            this.testNumber = 0;            
            this.getCount();
            this.getItems(this.p, 1);
        }
    }

    /**
     * Duplicate all items that are return from search - exclude UPC number
     */
    duplicateResultsStep2(data) {

        if (confirm("ARE YOU SURE - duplicate all these " + this.total + " item and make you \"admin\" the owner") == true) {
            this.errors = '';

            Meteor.call('items.duplicate.many', this.adminId, JSON.stringify(data),  (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    console.warn(err);                    
                    console.warn(res);
                    if (err) {
                        console.error("!!!!!!!! ERROR: duplicating many items !!!!!!!!!");
                        console.error(err);
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: deleting duplicating items..." + res.error);
                            return;
                        }
                        else {
                            this.errors = 'Successfully duplicated items to you as the owner.';
                        }
                    }
                });
            });

        } else {
            alert('hell no.');
            
        }

    }



    /**
     * Remove double colans from item name "::"
     */
    removeDoubleColans() {
        if (this.searchName == '') {
            alert('A search string is required.');
        }
        else {
            this.errors = '';
            this.testNumber = 0;            
            this.getCount();
            this.getItems(this.p, 2);
        }
    }
    /**
     * Remove double colans from item name "::"
     */
    removeDoubleColans2(data) {
        if (confirm("ARE YOU SURE - remove double colans from name :: from " + this.total + " items." ) == true) {
            this.errors = '';

            Meteor.call('items.update.name.many', JSON.stringify(data),  (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    console.warn(err);                    
                    console.warn(res);
                    if (err) {
                        console.error("!!!!!!!! ERROR: duplicating many items !!!!!!!!!");
                        console.error(err);
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: deleting duplicating items..." + res.error);
                            return;
                        }
                        else {
                            this.errors = 'Successfully duplicated items to you as the owner.';
                        }
                    }
                });
            });

        } else {
            alert('hell no.');
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

    AddNewItem() {
        this.router.navigate(['/item-new', { name: 'pick up from search string...', redirect: '/items-c' }]);
    }

}



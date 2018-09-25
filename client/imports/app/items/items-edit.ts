import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit }   from '@angular/core';
import { ActivatedRoute, Router }  from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { VariablesService } from '../services/VariablesService';
import { ValidatorsService } from '../services/ValidatorService';
import { MiscService } from '../services/MiscService';

import { Item } from '../../../../both/models/item.model';

import gql from 'graphql-tag';

import template from './items-edit.html';
import style from './items-edit.scss';


@Component({
    selector: 'items-edit',
    template,
    styles: [ style ]    
})
export class ItemsEditComponent implements OnInit {
    editItemForm: FormGroup;
    itemId: string;
    display_spinner: boolean = false;

    apolloItem: ApolloQueryObservable<any>;

    action: number = 0; // 0 - edit, 1 - approve, 2 - reject

    itemImage: string;

    redirect: string;
    redirectItemInfo: object;
    contractor: boolean = false;

    upc: number;
    brand: string;
    model: string;
    size2: string;
    image2: string;
    
    unitsList: Array<any>;
    categories: Array<any>;

    // FOR THIS TO WORK - only one category can be selected - thus every search contains a category
    categoryValue: string;

    labels: Object;
    errors: Object;
    msgs: Object;

    ctSelected: boolean;

    toggleImageSize: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private _ngZone: NgZone,
        private formBuilder: FormBuilder,
        public _varsService: VariablesService,
        private _validatorsService: ValidatorsService,
        private _miscService: MiscService,
        private apollo: Angular2Apollo) { }
        
    ngOnInit() {
        this._varsService.setReactiveTitleName('EDIT ITEM: 1lb = 16oz, 2lb = 32oz, 3lb = 48oz, 4lb = 64oz,  5lb = 80oz');

        this._varsService.resetFormErrorVairables();
        this.labels = this._varsService.labels;
        this.errors = this._varsService.errors;
        this.msgs = this._varsService.msgs;

        this.unitsList = this._varsService.unitsList;
        this.categories = this._varsService.categories;

        this.route.params.subscribe((params) => {

            if (params['redirect']) {
                this.redirect = params['redirect'];
                let p1 = decodeURIComponent(params['redirect']);
                let p2 = p1.split(/;info=/);
                if (p2[1]) {
                    this.redirectItemInfo = JSON.parse( p2[1] );
                }
            }

            if (params['contractor']) {
                this.contractor = true;
            }

            console.log("^^^^^^^^ BUILD FORM NOW ^^^^^^^^^ contractor = " + this.contractor);
            this.editItemForm = this.formBuilder.group({
                name: ['', this._validatorsService.isValidItemName ],
                size: [''],
                unit: ['', Validators.required],
                image: [''],
                public: ['', Validators.required],
                category: ['', Validators.required],
                note: [''],
            });

            // Edit existing item - if no itemId, add new item
            if (params['itemId']) {

                // Edit existing item
                if (params['action'] == 'edit') {

                    // Edit existing item
                    if (params['itemId']) {
                        this.itemId = params['itemId'];

                        this.apolloItem = this.apollo.watchQuery({
                            query: gql`
                          query ItemInfo($id: String) {
                                apItem(id: $id) {
                                        _id
                                        name
                                        size
                                        unit
                                        image
                                        public
                                        note
                                        category
                                        upc
                                        brand
                                        model
                                        size2
                                        image2
                                        tags
                                    }
                                }`,
                                variables: {
                                    id: this.itemId
                                },
                                fetchPolicy: 'network-only'
                            })
                            .map( ({ data }) => {
                                console.log(data.apItem);
                                console.log(data.apItem.upc);

                                this.upc = data.apItem.upc;
                                this.brand = data.apItem.brand;
                                this.model = data.apItem.model;
                                this.size2 = data.apItem.size2;
                                this.image2 = data.apItem.image2;
                                
                                // add new catetory to catetories array
                                if (data.apItem.category) {
                                    this.categories.push(   { value: data.apItem.category, viewValue: data.apItem.category},)
                                }

                                let note = '';
                                if (data.apItem.note != undefined) {
                                    note = data.apItem.note.replace(':contractor', '');                                    
                                }

                                this.editItemForm.patchValue({
                                    name: data.apItem.name,
                                    size: data.apItem.size,
                                    unit: data.apItem.unit,
                                    image: data.apItem.image,
                                    public: data.apItem.public,
                                    category: data.apItem.category,
                                    note: note.replace('contractor', '')
                                });

                                this.itemImage = data.apItem.image;

                                // Initialize tags
                                data.apItem.tags.map(x => {
                                    // console.log(x);
                                    this._varsService.initTagObjValue(x, this.itemId);
                                })

                                if (this.contractor) {
                                    this.itemImage = this.itemImage.replace('125x', '600x');                                
                                    
                                    // Use larger Raw image if it exist on Google
                                    var iArray = this.itemImage.split("/");
                                    console.warn(iArray[3] + ' -xx- ' + iArray[5]);
                                    Meteor.call('checkValidImage',  Meteor.settings.public.GOOGLE_IMAGE_PATH + Meteor.settings.public.GOOGLE_RAW + iArray[5], (error, res) => {
                                        this._ngZone.run(() => { // run inside Angular2 world
                                            if (error) {
                                                console.log(error);
                                            }
                                            else {
                                                console.log(res);
                                                if(res) {
                                                    this.itemImage = Meteor.settings.public.GOOGLE_IMAGE_PATH + Meteor.settings.public.GOOGLE_RAW + iArray[5];                                                    
                                                }
                                            }
                                        });
                                    });
                                }


                                return data.apItem;
                            });

                    }
                    else {
                        // enter default state
                        this.categoryValue = 'other';
                    }

                }
                // Approve item
                else if (params['action'] == 'approve') {
                    this.action = 1;

                }
                else if (params['action'] == 'reject') {
                    this.action = 2;

                }
            }

        });
    }


    onChangeUnits(unit) {
        this._ngZone.run(() => { // run inside Angular2 world
            if (unit == '-c-') {
                this.editItemForm.patchValue({
                    // size: 1,
                    unit: 'ct'
                });
                this.ctSelected = true;
            }
            else if (unit == '-w-') {
                this.editItemForm.patchValue({
                    unit: 'oz'
                });
                this.ctSelected = false;
            }
            else if (unit == '-v-') {
                this.editItemForm.patchValue({
                    unit: 'gal'
                });
                this.ctSelected = false;
            }
            else {
                this.ctSelected = false;
            }
        });
    }


    /**
     *
     */
    editExistingItem() {
        if (this.editItemForm.valid) {
            this.display_spinner = true;
            this._varsService.setReactiveError();

            let iu = <Item>{};
            iu._id = this.itemId;
            iu.name = this.editItemForm.value.name;
            iu.image = this.editItemForm.value.image;
            iu.category = this.editItemForm.value.category;
            iu.unit = this.editItemForm.value.unit;
        
            // ensure public is a number
            if (this.editItemForm.value.public) {
                iu.public = 1;            
            }
            else {
                iu.public = 0;                
            }

            iu.size = parseFloat(this.editItemForm.value.size);

            // add ":contractor" to note - required by Client App server DDP code
            if (this.editItemForm.value.note == 'contractor') {
                iu.note = 'contractor';
            }
            else if (this.editItemForm.value.note) {

                if ( this.editItemForm.value.note.includes(':contractor') ) {
                    iu.note = this.editItemForm.value.note;
                }
                else {
                    iu.note = this.editItemForm.value.note + ' :contractor';
                }
            }
            else if (this.contractor )  {
                iu.note = 'contractor';
            }
            else {
                iu.note = '';
            }
            
            iu.tags = this._varsService.createTagObjArray(this.itemId);

            // update item - pass in a new paramter ??
            Meteor.call('parent.ddp.items.update', iu, this.contractor, (err, res) => {

                this._ngZone.run(() => { // run inside Angular2 world
                    this.display_spinner = false;
                    if (err) {
                        console.error("!!!!!!!! ERROR: EditItem !!!!!!!!!");
                        console.error(err);
                        this._varsService.setReactiveError();
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: Items.update..." + res.error);
                            this._varsService.setReactiveError();
                        }
                        else {
                            console.log("SUCCESSFULLY UPDATED ITEM...");
                            if (this.redirect) {
                                this.customRedirect();
                            }
                            else {
                                this.router.navigate(['/items']);
                            }
                        }
                    }
                });

            });
        }
        else {
            // Process Form Errors
            let validateFields = {};
            validateFields['itemName'] = 1;
            this.errors = this._varsService.processFormControlErrors(this.editItemForm.controls, validateFields);
        }
    }


    /**
     *
     */
    toggleImageFunc() {
        if (this.toggleImageSize) {
            this.toggleImageSize = false;
        }
        else {
            this.toggleImageSize = true;
        }
    }


    /**
     *
     */
    ApproveItem(item) {
        console.error(item);
        alert('Approve that mother');
    }

    /**
     *
     */
    RejectItem(item) {
        console.error(item);
        alert('reject that mother');
    }

    /**
     * 
     */
    customRedirect() {
        let redirectInfo = this._miscService.constructRedirectQuery(this.redirect);
        this.router.navigate([redirectInfo.main, redirectInfo.params]);
    }

}

import { Component, OnInit, NgZone }   from '@angular/core';
import { ActivatedRoute }  from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { VariablesService } from '../services/VariablesService';

import gql from 'graphql-tag';

import template from './items-duplicate.html';


@Component({
    selector: 'items-duplicate',
    template,
})
export class ItemsDuplicateComponent implements OnInit {
    apolloMasterItem: ApolloQueryObservable<any>;
    masterItemForm: FormGroup;
    masterItemInfo:  Object;

    apolloItem: ApolloQueryObservable<any>;
    editItemForm: FormGroup;
    itemInfo:  Object;

    itemId: string;
    display_spinner: boolean = false;

    labels: Object;
    errors: Object;
    msgs: Object;

    constructor(private route: ActivatedRoute,
                private _ngZone: NgZone,
                private formBuilder: FormBuilder,
                public _varsService: VariablesService,
                private apollo: Angular2Apollo) { }


    ngOnInit() {

        this._varsService.resetFormErrorVairables();
        this.labels = this._varsService.labels;
        this.errors = this._varsService.errors;
        this.msgs = this._varsService.msgs;

        this.masterItemForm = this.formBuilder.group({
            id: ['', Validators.required],
        });

        this.route.params.subscribe((params) => {

            console.log("^^^^^^^^ BUILD FORM NOW ^^^^^^^^^" );
            this.editItemForm = this.formBuilder.group({
                itemId: ['', Validators.required],
            });

            // Edit existing store
            if (params['itemId']) {
                this.itemId = params['itemId'];

                this.editItemForm.patchValue({
                    itemId: this.itemId
                });

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
                            }
                          }
                        `,
                    variables: {
                        id: this.itemId
                    }
                })
                    .map( ({ data }) => {
                        // console.log(data);
                        // console.log(data.apItem.name);
                        this.itemInfo = data.apItem;

                        return data.apItem;
                    });

            }

        });
    }

    /**
     *
     */
    ReplaceDuplicateItem() {

        if (this.masterItemInfo) {
            this.display_spinner = true;
            this._varsService.setReactiveError();

            // Replace duplicate item:  masterId, duplicateId
            Meteor.call('items.duplicate', this.masterItemForm.value.id, this.itemId, (err, res) => {
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
                            return;
                        }
                        else {
                            console.warn("SUCCESSFULLY UPDATED ITEM...");
                            this.onRefreshClicked();
                            // this.router.navigate(['/items']);
                        }
                    }
                });
            });

        }

    }

    /**
     * 
     */
    GetMasterItem() {
        if (this.masterItemForm.valid) {
            this.apolloMasterItem = this.apollo.watchQuery({
                query: gql`
                      query ItemInfo($id: String) {
                        apItem(id: $id) {
                            _id
                            name
                            size
                            image
                            public
                            note
                            category
                        }
                      }
                    `,
                variables: {
                    id: this.masterItemForm.value.id
                },
                fetchPolicy: 'network-only'
            })
                .map(({data}) => {
                    console.log(data);
                    console.log(data.apItem.name);

                    this.masterItemInfo = data.apItem;
                    return data.apItem;
                });
        }
    }


    onRefreshClicked() {
    }

}

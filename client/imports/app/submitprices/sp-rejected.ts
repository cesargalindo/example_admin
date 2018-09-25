import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit } from '@angular/core';
import { Router }  from '@angular/router';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';

import { VariablesService } from '../services/VariablesService';
import { SnackbarService } from '../services/SnackbarService';

import gql from 'graphql-tag';

import template from "./sp-rejected.html";

@Component({
    selector: 'sp-rejected',
    template,
})
export class SPRejectedComponent implements OnInit {
    apolloSubmitprices2: ApolloQueryObservable<any>;
    apolloSubmitpricesCount2: ApolloQueryObservable<any>;

    total: number = 0;

    pageSize: number = 8;
    p: number = 1;
    dateOrder: number = -1;

    status: number = 3;

    currentDate: number;

    display_spinner: boolean = true;

    constructor(
        public _snackbar: SnackbarService,
        public _varsService: VariablesService,
        private apollo: Angular2Apollo,
        private router: Router,
        private _ngZone: NgZone) { }

    // NOTE - auth-guard.ts will redirect to home page to load services if page is newly refreshed before getting here
    ngOnInit() {
        // Hide top toolbar to allow buttons to be shown on top
        this._varsService.setReactiveHideToolbar(true);

        // Monitor reactiveLogin using an Observable subject
        let reactiveError  =  this._varsService.getReactiveError();
        reactiveError.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (x) {
                    this._snackbar.displaySnackbar(1);

                }
            });
        });

        this.apolloSubmitpricesCount2 = this.apollo.watchQuery({
            query: gql`
                query SubmitpricesCount2($ownerId: String, $status: Int) {
                  apSubmitpricesCount(ownerId: $ownerId, status: $status) {
                    count
                  }
                }
              `,
            variables: {
                ownerId: 'xskip',
                status: this.status
            },
            fetchPolicy: 'network-only'
        })
            .map( x => {
                console.warn('######## THE COUNT ####### ' +  x.data.apSubmitpricesCount.count);
                console.log(x.data);
                this.total = x.data.apSubmitpricesCount.count;
            });


        // load initial page
        this.getRejectedprices(this.p);
    }


    getRejectedprices(page) {
        this.p = page;
        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: {updated: this.dateOrder},
        };

        let serializeOptions = JSON.stringify(options);

        this.apolloSubmitprices2 = this.apollo.watchQuery({
            query: gql`
              query MySubmitPrices2($ownerId: String, $options: String, $status: Int) {
                apSubmitprices(ownerId: $ownerId, options: $options, status: $status) {
                    _id
                    priceId
                    owner
                    price
                    submittedAt
                    updated
                    status
                    paidAt
                    payout
                    soldOut
                    note
                    priceT2 {
                        price
                        quantity
                        itemT {
                            name
                            size
                            image
                        }
                        storeT {
                            name
                            address
                        }
                    }
                }
              }
            `,
            variables: {
                ownerId: 'xskip',
                options: serializeOptions,
                status: this.status
            },
            fetchPolicy: 'network-only'
        })
            .map( ({ data }) => {

                this.display_spinner = false;
                console.warn('######## THE DATA ####### ' +  data.apSubmitprices.length);
                console.log(data.apSubmitprices);

                return data.apSubmitprices;
            });

    }


    detailedView(sp) {
        this.router.navigate(['/spdetails', { spId: sp._id, redirect: 'sprejected' }]);
    }

}

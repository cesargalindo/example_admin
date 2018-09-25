import { Component, NgZone, OnInit } from "@angular/core";

import { RequestPrice } from "../../../../both/models/requestprice.model";
import { RequestPrices } from "../../../../both/collections/requestprices.collection";

import { VariablesService } from '../services/VariablesService';
import { Router }  from '@angular/router';

import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

import { Counts } from 'meteor/tmeasday:publish-counts';

import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import gql from 'graphql-tag';

import template from "./rp-schedule-list.html";

@Component({
    selector: "rp-schedule-list",
    template,
})
export class RPScheduleList implements OnInit {

    // combine observables
    private combined$: Observable<any[]>;
    data: Observable<RequestPrice[]>;
    subCount: Observable<any>;

    private requestSub: Subscription;

    pageSize: number = 10;
    dateOrder: number = -1;
    p: number = 1;

    // Data pushed to template
    totalCount: number;
    dataArray: Array<any>;

    apolloScheduledItems: ApolloQueryObservable<any>;
    apolloScheduledStores: ApolloQueryObservable<any>;

    subItems: Observable<any>;
    subStores: Observable<any>;

    itemsArray: Object;
    storesArray: Object;

    private combined2$: Observable<any[]>;
    errors: Object;

    constructor(
        private _ngZone: NgZone,
        private router: Router,
        private apollo: Angular2Apollo,
        public _varsService: VariablesService) { }


    ngOnInit() {
        // show top tuoolbar
        this._varsService.setReactiveHideToolbar(false);
        this.errors = this._varsService.errors;

        this._varsService.setReactiveTitleName('SCHEDULED REQUESTS');
        this.getPageX(this.p);
    }


    getPageX(x) {
        this.p = x;

        this.getObservables();

        // Pushed data to dataArray when both observables have fired
        this.combined$ = Observable.combineLatest(this.data, this.subCount);

        this.combined$.subscribe(x => {
            let itemIds = x[0].map(y => {
                return y.itemId;
            });

            let storeIds = x[0].map(y => {
                return y.storeId;
            });

            itemIds =_.uniq(itemIds);
            storeIds = _.uniq(storeIds);

            this.getItemStoreData(x[0], itemIds, storeIds);
        });
    }



    getObservables() {
        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: {created: this.dateOrder},
        };

        this.requestSub = MeteorObservable.subscribe('requestprices', options).zone().subscribe();

        this.subCount = new Observable.create(observer => {
            MeteorObservable.autorun().zone().subscribe(() => {
                this.totalCount = Counts.get('numberOfRequests');
                if (this.totalCount) {
                    observer.next(this.totalCount);
                    observer.complete();
                }

            });
        });

        this.data = RequestPrices.find({}, options);
    }


    /**
     * Get items matching storeIds array
     * 
     * @param rp 
     * @param itemIds 
     * @param storeIds 
     */
    getItemStoreData(rp, itemIds, storeIds) {

        let serializedItemIds = JSON.stringify(itemIds);
        let serializedStoreIds = JSON.stringify(storeIds);

        this.subItems = new Observable.create(observer => {
            this.apolloScheduledItems = this.apollo.query({
                query: gql`
                      query ItemsInfoQuery($serializedIds: String) {
                        apItemsByIds(serializedIds: $serializedIds) {
                            _id
                            name
                            size
                            image
                        }
                      }
                    `,
                variables: {
                    serializedIds: serializedItemIds
                }
            })
                .subscribe(({data}) => {
                    this.itemsArray = _.indexBy(data.apItemsByIds, '_id');
                    observer.next(this.itemsArray);
                    observer.complete();
                });
        });


        this.subStores = new Observable.create(observer => {
            this.apolloScheduledStores = this.apollo.query({
                query: gql`
                      query StoresInfoQuery($serializedIds: String) {
                        apStoresByIds(serializedIds: $serializedIds) {
                            _id
                            name
                            address
                        }
                      }
                    `,
                variables: {
                    serializedIds: serializedStoreIds
                }
            })
                .subscribe(({data}) => {
                    this.storesArray = _.indexBy(data.apStoresByIds, '_id');
                    observer.next(this.storesArray);
                    observer.complete();
                });
        });


        // Combine Stores and Items into one Observable
        this.combined2$ = Observable.combineLatest(this.subItems, this.subStores);
        this.combined2$.subscribe(z => {

            this.dataArray = rp.map(v => {
                v.storeName = z[1][v.storeId].name;
                v.storeAddress = z[1][v.storeId].address;

                v.itemName = z[0][v.itemId].name;
                v.itemSize = z[0][v.itemId].size;

                v.payRequest = v.payRequest / 100;

                return v;
            });

        });

    }


    /**
     * 
     * @param rp 
     */
    editRequest(rp) {
        this.router.navigate(['/rp-schedule-cr', rp]);
    }


    /**
     * 
     * @param rp 
     */
    cancelScheduledRequest(rp) {

        if (confirm("Click OK to cancel this mother...") == true) {
            var txt = "yes";
        } else {
            var txt = "no";
        }

        if (txt == 'yes') {
            this.errors['error'] = '';
            this.errors['success'] = '';

            let rpUpdate = <RequestPrice>{};
            rpUpdate._id = rp._id;
            rpUpdate.note = 'cancel';
            rpUpdate.status = 3;

            Meteor.call('requestprices.edit.schedule', rpUpdate, (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    if (err) {
                        console.error("!!!!!!!! GO AN ERROR ON: cancelScheduledRequest... !!!!!!!!!");
                        console.error(err);
                        this.errors['error'] = this.errors['error'] + " -- " + err;
                    } else {

                        if (!res.status) {
                            this.errors['error'] = this.errors['error'] + ' -- ' + res.error;
                            console.error('cancelScheduledRequest...' + res.error);
                        }
                        else {
                            // success!
                            this.errors['success'] = this.errors['success'] + ' -- Cancelled requestprice for storeId: ' + res.storeId;
                        }
                    }
                });
            });
        }
    }



}
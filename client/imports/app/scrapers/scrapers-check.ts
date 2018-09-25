
import { Component, OnInit, NgZone } from "@angular/core";
import { Router } from '@angular/router';

import { VariablesService } from '../services/VariablesService';

import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import gql from 'graphql-tag';

import template from "./scrapers-check.html";
import style from "./scrapers-check.scss";

@Component({
    selector: 'scrapers-check',
    template,
    styles: [ style ]
})
export class ScrapersCheckComponent implements OnInit {
    apolloItems2: ApolloQueryObservable<any>;
    apolloItemsCount2: ApolloQueryObservable<any>;

    pageSize: number = 25;
    dateOrder: number = -1;
    p: number = 1;

    status: number;

    // Data pushed to template
    total: number;

    imageToggle: Object = {};
    removedItem: Object = {};
    dupItemsCounts: Object = {};

    storeChains: Array<any>;
    scrapedStore: string;
    
    constructor(
        private router: Router,
        private _ngZone: NgZone,
        private apollo: Angular2Apollo,
        public _varsService: VariablesService) { }

    ngOnInit() {
        this.status = 20;

        this._varsService.setReactiveTitleName('Same Item selected in multiple Sitems');

        this.storeChains = this._varsService.storeChains;

        if (this._varsService.owner) {
            this.scrapedStore = this._varsService.owner;
        }
        else {
            this.scrapedStore = "Safeway";
        }

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


    onChangeStore(store) {
        this.scrapedStore = store;
        this._varsService.owner = store;

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
                                scrapeItemT2 {
                                    _id
                                    owner
                                    name
                                    size
                                    unit
                                    quantity
                                    upc
                                    category
                                    description
                                    image
                                    updatedAt
                                    prices {
                                        _id
                                        gid
                                        price
                                        startsAt
                                    }
                                    mitems {
                                        itemId
                                        created
                                        itemT {
                                            _id
                                            name
                                            size
                                            unit
                                            image
                                            upc
                                        }
                                    }
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

                    data.apDupItems.map(y => {
                        console.log(y);
                        console.error(y.dupitems.length)
                        this.dupItemsCounts[y._id] = y.dupitems.length;
                    })

                    console.error(this.dupItemsCounts);

                    return data.apDupItems;
                });
        });
    }


    /**
     * 
     * @param item 
     */
    matchItems(item) {
        this.router.navigate(['/items-match', { info:  JSON.stringify(item) }]);
    }

    /**
     * 
     * @param d_id 
     * @param si_id 
     * @param i_id 
     */
    removeItem(d_id, si_id, i_id,) {
        Meteor.call('removeDupItemFromSitem', d_id, si_id, i_id, this.dupItemsCounts[d_id], (err, res) => {
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
                        this.removedItem[si_id] = 1;
                        this.removedItem[i_id] = 1;
                    }
                }
            });
        });

    }

    /**
     * Togle Image size
     * 
     * @param id 
     * @param sid 
     */
    imageToggleClick(id, sid) {
        if (id == 'skip') {
            if (this.imageToggle[sid]) {
                this.imageToggle[sid] = 0;
            }
            else {
                this.imageToggle[sid] = 1;
            }
        }
        else {
            if (this.imageToggle[id] && this.imageToggle[sid]) {
                this.imageToggle[id] = 0;
                this.imageToggle[sid] = 0;                
            }
            else {
                this.imageToggle[id] = 1;
                this.imageToggle[sid] = 1;
            }   
        }

    }


    /**
     * Discover items used in multiple sitems for the same store...
     * 
     */
    processSitemItemDuplicates() {
        Meteor.call('processSitemItemDuplicates', this.scrapedStore, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: deleting item !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: deleting item..." + res.error);
                    }
                    else {
                        console.log('Successfully deleted item: ');
                    }
                }
            });
        });
    }



}




import { Component, OnInit, NgZone } from "@angular/core";
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { MeteorObservable } from 'meteor-rxjs';
import { Observable } from 'rxjs/Rx';

import { Settings } from "../../../../both/collections/settings.collection";

import { VariablesService } from '../services/VariablesService';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/UserService';

import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import gql from 'graphql-tag';

import template from "./scrapers-list1.html";
import style from "./scrapers-list1.scss";

@Component({
    selector: "scrapers-list1",
    template,
    styles: [ style ]
})
export class ScrapersList1Component implements OnInit {
    apolloItems2: ApolloQueryObservable<any>;
    apolloItemsCount2: ApolloQueryObservable<any>;

    pageSize: number = 25;
    dateOrder: number = -1;
    p: number;
    pskip1: number = 1;
    pskip2: number = 11;
    overrideSkip: boolean = false;

    itemsForm: FormGroup;
    searchName: string = '';
    name1: string;
    name2: string;
    name3: string;
    name4: string;
    
    scrapedStore: string;
    upcMatch: boolean;
    status: number;
    updatedAt: number;
    scrapedAtReported: Object = {};

    total: number;
    itemStatus: Object = {};

    storeChains: Array<any>;

    isAdmin: boolean = false;
    display_progress: boolean = false;
    progress_bar: number;

    selectedProduce: string = '--';
    selectedMeat: string = '--';
    selectedOther: string = '--';

    constructor(
        private router: Router,
        private formBuilder: FormBuilder,        
        private _ngZone: NgZone,
        private _authService: AuthService,
        public _userService: UserService,        
        private apollo: Angular2Apollo,
        public _varsService: VariablesService) { }

    ngOnInit() {
        this.upcMatch = false;                                      

        this.status = 1;    // display all with status $lt 2   -- status = 1, item not found, save for later
        // this.status = 2;    // dsiplay all with status == 2 -- skip
        // this.status = 0;    // display all

        this._varsService.setReactiveTitleName('Items Match 1');

        // TODO these varialbles should be in _varsService
        if (this._userService.overrideSkip != undefined) {
            this.overrideSkip = this._userService.overrideSkip;
        }

        if (this._userService.searchName != undefined) {
            this.searchName = this._userService.searchName;
        }

        this.itemsForm = this.formBuilder.group({
            name: [this.searchName]
        });

        this.storeChains = this._varsService.storeChains;

        this._varsService.note = '';
        this._varsService.name = '';
        this._varsService.selectedItemId = '';
        this._varsService.params = {};

        if (this._varsService.chainName) {
            this.scrapedStore = this._varsService.chainName;
        }
        else {
            this.scrapedStore = "Safeway";
        }

        // Restrict Contractor to specific store
        if ( (this._userService.storeChain != undefined) && (this._userService.storeChain != '')) {
            this.storeChains = [
                {value: this._userService.storeChain, viewValue: this._userService.storeChain},
              ];
            this.scrapedStore = this._userService.storeChain;
        }

        if (this._varsService.page) {
            this.p = this._varsService.page;
        }
        else {
            this.p = 1;
        }

        // display Skip option if user is admin
        this.isAdmin = this._authService.isAdmin;

        MeteorObservable.subscribe('settings').zone().subscribe();

        // Check if Settings info is in local Meteor collection
       let info = Settings.find({}).fetch();
        if (info.length) {
            info.map(x => {
                this.scrapedAtReported[x.chainName] = x.scrapedAt;
            });

            this.dataLoadWithReportInfo();
        }
        else {
            let cnt = 0;
            // Capture chainName and scrapedAt for later use
            Settings.find({}).subscribe(z => {
                z.map(x => {
                    this.scrapedAtReported[x.chainName] = x.scrapedAt;
                });

                // IMPORTANT: I'm assuming we more than one item in Settings report
                if (cnt > 0) {
                    // Wait 250 ms before to esnure all scrapedAtReported[] data has been loaded
                    let timer = Observable
                    .timer(250,250)
                    .take(1)
                    .subscribe( t => {
                        this.dataLoadWithReportInfo();
                        timer.unsubscribe();
                    });
                }
                cnt++;
                
            })
        }
    }


    dataLoadWithReportInfo() {
        if (this.scrapedAtReported[this.scrapedStore] == undefined) {
            this.updatedAt = 0;
        }
        else {
            this.updatedAt = this.scrapedAtReported[this.scrapedStore];
        }

        // load initial page
        this.getItemsCount();        
        this.getItems(this.p);
    }


    applyFilter() {
        // re-load initial page
        this.getItemsCount();        
        this.getItems(this.p);
    }


    getItemsCount() {
        this.name1 = '';
        this.name2 = '';
        this.name3 = '';
        this.name4 = '';
        
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
        if (res[3] != undefined) {
            this.name4 = res[3];
        }

        this.apolloItemsCount2 = this.apollo.watchQuery({
            query: gql`
                query ItemsCount2($chainName: String, $upcMatch: Boolean, $status: Int, $updatedAt: Float, $itemName1: String, $itemName2: String, $itemName3: String, $itemName4: String) {
                    apScrapeItems2ByChainCount(chainName: $chainName, upcMatch: $upcMatch, status: $status, updatedAt: $updatedAt, itemName1: $itemName1, itemName2: $itemName2, itemName3: $itemName3, itemName4: $itemName4) {
                        count
                    }
                }
                `,
            variables: {
                chainName: this.scrapedStore,
                upcMatch: this.upcMatch,
                status: this.status,
                updatedAt: this.updatedAt,
                itemName1: this.name1, 
                itemName2: this.name2, 
                itemName3: this.name3, 
                itemName4: this.name4
            },
            fetchPolicy: 'network-only'
        })
        .map( x => {
            console.warn('######## THE COUNT ####### ' +  x.data.apScrapeItems2ByChainCount.count);
            // restrict user data
            if (this._userService.total) {
                this.total = this._userService.total;
            }
            else {
                this.total = x.data.apScrapeItems2ByChainCount.count;
            }
        });
    }


    getItems(page) {
        let maxPager =   Math.round( this.total / this.pageSize );
        this.pskip1 = page - 10;
        if (this.pskip1 <= 1) {
            this.pskip1 = 1;
        }

        this.pskip2 = page + 10;
        if (this.pskip2 >= maxPager) {
            this.pskip2 = maxPager;
        }

        this._varsService.page = page;
        this.p = page;

        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: {created: this.dateOrder},
        };

        // restrict user data
        if (this._userService.total) {
            options = {
                limit: this.pageSize,
                skip: (this.p - 1 + this._userService.skip) * this.pageSize,
                sort: {created: this.dateOrder},
            };
        }

        let serializeOptions = JSON.stringify(options);

        
        if (this.name1 == '') {
            // Reset
            this.overrideSkip = false;
            this._userService.overrideSkip = false;
        }
        if (this.overrideSkip) {
            // Override skip - by hacking this.name4
            this.name4 = "SKIP";
        }

        this._ngZone.run(() => { // run inside Angular2 world
            this.apolloItems2 = this.apollo.watchQuery({
                query: gql`
                    query MyItems2($chainName: String, $upcMatch: Boolean, $status: Int, $updatedAt: Float, $itemName1: String, $itemName2: String, $itemName3: String, $itemName4: String, $options: String) {
                        apScrapeItems2ByChain(chainName: $chainName, upcMatch: $upcMatch, status: $status, updatedAt: $updatedAt, itemName1: $itemName1, itemName2: $itemName2, itemName3: $itemName3, itemName4: $itemName4, options: $options) {
                            _id
                            chainName
                            owner
                            name
                            size
                            unit
                            quantity
                            category
                            description
                            note
                            MerchantIdNumber
                            image
                            updatedAt
                            createdAt
                            upcMatch
                            status
                            itemT {
                                _id
                                name
                                size
                                unit
                                upc
                            }
                            mitems {
                                itemId
                                created
                                quantity
                                itemT {
                                    _id
                                    name
                                    size
                                    unit
                                    image
                                    category
                                    upc
                                }
                            }
                        }
                    }
                `,
                variables: {
                    chainName: this.scrapedStore,
                    upcMatch: this.upcMatch,
                    status: this.status,
                    updatedAt: this.updatedAt,
                    itemName1: this.name1, 
                    itemName2: this.name2, 
                    itemName3: this.name3, 
                    itemName4: this.name4,
                    options: serializeOptions
                },
                fetchPolicy: 'network-only'
            })
                .map( ({ data }) => {
                    console.warn('######## THE DATA ####### ' +  data.apScrapeItems2ByChain.length);
                    console.log(data.apScrapeItems2ByChain);

                    data.apScrapeItems2ByChain.map( x => {
                        if (x.status == 'null' || x.status == 0) {
                            // console.log('null = ' + x.status);
                            this.itemStatus[x._id] = 0;
                        }
                        else {
                            this.itemStatus[x._id] = x.status;                            
                        }
                    })

                    // Set 
                    return data.apScrapeItems2ByChain;
                });
        });

    }


    /**
     * 
     * @param item 
     */
    matchItems(item) {
        this._varsService.params = item;
        this.router.navigate(['/items-match']);
    }


    /**
     * 
     * @param x 
     */
    onChangeFilterTerm(x) {
        this.overrideSkip = true;
        this._userService.overrideSkip = true;

        if (x.value != '--') {
            this.searchName = x.value;
            this.getItemsCount();        
            this.getItems(this.p);
        }
        else {
            this.searchName = '';
            this.getItemsCount();        
            this.getItems(this.p);
        }
    }

    /**
     * 
     * @param store 
     */
    onChangeStore(store) {
        // alert(store + ' -- ' + this.scrapedAtReported[store]);
        this.scrapedStore = store;
        this._varsService.chainName = store;

        if (this.scrapedAtReported[store] == undefined) {
            this.updatedAt = 0;
        }
        else {
            this.updatedAt = this.scrapedAtReported[store];
        }

        // load new store scrapes
        this.getItemsCount();        
        this.getItems(this.p);
    }


    editItemNote(it) {
        this._varsService.status = 0;
        this._varsService.note = it.note;
        this._varsService.name = it.name;
        this._varsService.selectedItemId = it._id;
        document.getElementById('foofooclick').click();        
    }


    editItemStatus(it) {
        if (this.itemStatus[it._id] == undefined) {
            this._varsService.status = 2;   // skip
            this.itemStatus[it._id] = 2;
        }
        else {
            // toggle status
            if (this.itemStatus[it._id] > 0) {
                this._varsService.status = 0;
                this.itemStatus[it._id] = 0;
            }
            else {
                this._varsService.status = 2;
                this.itemStatus[it._id] = 2;
            }
        }

        Meteor.call('updateSitemStatus', this.itemStatus[it._id], it._id, (err, res) => {
            if (err) {
                console.error("!!!!!!!! ERROR: updateSitemStatus !!!!!!!!!");
                console.error(err);
            } else {
                if (!res.status) {
                    console.error("!!!!!!!! ERROR ON: updateSitemStatus...." + res.error);
                    return;
                }
                else {
                    console.log("SUCCESSFUL updateSitemStatus ...");
                }
            }

            document.getElementById('forceCloseClick').click();
        });
    }


    /**
     * Process sitems matches  - manually matched with items
     */
    processScrapedMatches() {
        if (this.isAdmin) {
            this.display_progress = true;
            this.progress_bar = 0;
            let timer = Observable
            .timer(1000,1000)
            .subscribe( t => {
                this.progress_bar = this.progress_bar  + 0.5;
            });

            // If prices are global 
            if (this.scrapedStore == 'Trader Joes') {

                Meteor.call('processGlobalScrapedMatches', this.scrapedStore, (err, res) => {
                    this._ngZone.run(() => { // run inside Angular2 world
                        if (err) {
                            console.error("!!!!!!!! ERROR: processGlobalScrapedMatches !!!!!!!!!");
                            console.error(err);
                        } else {
                            if (!res.status) {
                                console.error("!!!!!!!! ERROR ON: processGlobalScrapedMatches...." + res.error);
                                return;
                            }
                            else {
                                console.log("SUCCESSFUL processGlobalScrapedMatches ...");
                                console.log(res.data);
                                
                            }
                        }

                        timer.unsubscribe();
                        this.display_progress = false;
                    });
                });
            }
            else {
                Meteor.call('processScrapedMatches', this.scrapedStore, (err, res) => {
                    this._ngZone.run(() => { // run inside Angular2 world
                        if (err) {
                            console.error("!!!!!!!! ERROR: processScrapedMatches !!!!!!!!!");
                            console.error(err);
                        } else {
                            if (!res.status) {
                                console.error("!!!!!!!! ERROR ON: processScrapedMatches...." + res.error);
                                return;
                            }
                            else {
                                console.log("SUCCESSFUL processScrapedMatches ...");
                                console.log(res.data);
                                
                            }
                        }

                        timer.unsubscribe();
                        this.display_progress = false;
                    });
                });
            }
        }
    }

    /**
     * Clean up erroneaous images
     */
    replaceBogusImagesItems() {
        if (this.isAdmin) {
            this.display_progress = true;
            this.progress_bar = 0;
            let timer = Observable
            .timer(1000,1000)
            .subscribe( t => {
                this.progress_bar = this.progress_bar  + 0.5;
            });

            Meteor.call('replaceBogusImagesItems', (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    if (err) {
                        console.error("!!!!!!!! ERROR: replaceBogusImagesItems !!!!!!!!!");
                        console.error(err);
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: replaceBogusImagesItems...." + res.error);
                            return;
                        }
                        else {
                            console.log("SUCCESSFUL replaceBogusImagesItems ...");
                            console.log(res.data);
                            
                        }
                    }

                    timer.unsubscribe();
                    this.display_progress = false;
                });
            });
        }
    }

}


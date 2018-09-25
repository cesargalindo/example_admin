import { Component, OnInit, NgZone } from "@angular/core";
import { Router } from '@angular/router';

import { Settings } from "../../../../both/collections/settings.collection";
import { VariablesService } from '../services/VariablesService';

import { Observable } from 'rxjs/Rx';
import { MeteorObservable } from 'meteor-rxjs';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import gql from 'graphql-tag';

import template from "./scrapers-list2.html";
import style from "./scrapers-list2.scss";


// ################## IMPORT ITEMS AND STORE from CG database ####################                               
// 1) Export items *.txt and stores *.txt from Admin App (cg database)                                       
// 2) Copy mongo-items.txt and mongo-stores.txt in Development to private directory of Admin app             
// 3) Click pink button Import Mongo "txt" and Import Stores "txt" from Admin App (hen database)             

// ################## HOW to import scraped prices ####################                                      
// 1) export sitems from scraped_stores database                                                             
    //  mongoexport -h 101.101.101.101:17401 -d scraped_stores -c items --out sitems.json 

// 2) import sitems from into meteor database                                                                
    //  mongoimport -h 101.101.101.101:17401 -d meteor -c sitems < sitems.json
    //  mongoimport -h 101.101.101.101:17401 -d meteor -c sitems < sitems.json
// 3) set  pcMatch = false                                                                                   
// 4a) go to i-Scrapers2 page and view each page to set upcMatch: true on sitems for matching upc            
// 4b) "item" upcMatch field is updated by Apollo                                                            
// 5) set upcMatch = true                                                                                    


// ################## Take it to main DB (cg database) ####################                                  
// 1) export and import sitems                                                                               
    // mongoexport -h 101.101.101.101:17401 -d meteor -c sitems --out processed-sitems.json 
    // mongoimport -h 101.101.101.101:17401 -d meteor -c sitems < rocessed-sitems.json 

// 2) goto i-Scrapers2 page and import Target Prices

// ==================== convert Category from array to string: for Walmart ================                     ss 
// db.sitems.find({chainName: "Walmart"}).forEach( function (x) {
	// x.category = x.category[1];
	// db.sitems.save(x);  
// });

@Component({
    selector: "scrapers-list2",
    template,
    styles: [ style ]
})
export class ScrapersList2Component implements OnInit {
    apolloItems2: ApolloQueryObservable<any>;
    apolloItemsCount2: ApolloQueryObservable<any>;

    pageSize: number = 5;
    dateOrder: number = -1;
    p: number = 1;

    upcMatch: boolean = false;

    // Data pushed to template
    total: number;

	//show some useful info on html
    compInfo: Array<any>;
    
	//the local file from input tag
    file: any = null;
    
    storeChains: Array<any>;
    chainName: string = 'Target';
    updatedAt: number;

    display_progress: boolean = false;
    progress_bar: number;

    constructor(
        private router: Router,
        private _ngZone: NgZone,
        private apollo: Angular2Apollo,
        public _varsService: VariablesService) { }


    ngOnInit() {
        this._varsService.setReactiveTitleName('Scrape Items 2');

        this.storeChains = [
            {value: "Target", viewValue: "Target"},
            {value: "Whole Foods", viewValue: "Whole Foods"},
            {value: "Walmart", viewValue:"Walmart"},
          ];

        // load initial page
        this.getItemsCount();
        this.getItems(this.p);

        // this.updatedAt is only used when creating prices
        this.updatedAt = 0;

        MeteorObservable.subscribe('settings').zone().subscribe();
        Settings.find({chainName: this.chainName}).subscribe(z => {
            if (z != undefined) {
                this.updatedAt = z[0].scrapedAt;
            }
        })
    }


    /**
     * Filter sitems by UPC Matches
     */
    upcMatchesOnly() {
        if (this.upcMatch) {
            this.upcMatch = false;
        }
        else {
            this.upcMatch = true;
        }

        this.getItemsCount();
        this.getItems(this.p);
    }


    getItemsCount() {
        this.apolloItemsCount2 = this.apollo.watchQuery({
            query: gql`
                query ItemsCount2($chainName: String, $upcMatch: Boolean, $updatedAt: Float) {
                    apScrapeItems2ByChainCount(chainName: $chainName, upcMatch: $upcMatch, updatedAt: $updatedAt) {
                        count
                    }
                }
                `,
            variables: {
                chainName: this.chainName,
                upcMatch: this.upcMatch,
                updatedAt: 0
            },
            fetchPolicy: 'network-only'
        })
            .map( x => {
                console.warn('######## THE COUNT ####### ' +  x.data.apScrapeItems2ByChainCount.count);
                this.total = x.data.apScrapeItems2ByChainCount.count;
            });
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
                    query MyItems2($chainName: String, $upcMatch: Boolean, $updatedAt: Float, $options: String) {
                        apScrapeItems2ByChain(chainName: $chainName, upcMatch: $upcMatch, updatedAt: $updatedAt, options: $options) {
                            _id
                            chainName
                            owner
                            name
                            quantity
                            upc
                            category
                            MerchantIdNumber
                            image
                            updatedAt
                            createdAt
                            upcMatch
                            prices {
                                _id
                                gid
                                price
                                startsAt
                            }
                            itemT {
                                _id
                                name
                                size
                                unit
                            }
                        }
                    }
                `,
                variables: {
                    chainName: this.chainName,
                    upcMatch: this.upcMatch,
                    updatedAt: 0,
                    options: serializeOptions
                },
                fetchPolicy: 'network-only'
            })
                .map( ({ data }) => {
                    console.warn('######## THE DATA ####### ' +  data.apScrapeItems2ByChain.length);
                    console.log(data.apScrapeItems2ByChain);
                    return data.apScrapeItems2ByChain;
                });
        });

    }

    /**
     * @param store 
     */
    onChangeStore(store) {
        this.chainName = store;
        // reset - if exist it will get reset
        this.updatedAt = 0;

        this.getItemsCount();
        this.getItems(this.p);

        MeteorObservable.subscribe('settings').zone().subscribe();
        Settings.find({chainName: this.chainName}).subscribe(z => {
            if (z != undefined) {
                this.updatedAt = z[0].scrapedAt;
            }
        })
    }

    /**
     * @param item 
     */
    matchItems(item) {
        this.router.navigate(['/items-match', { info:  JSON.stringify(item) }]);
    }


    /**
     * Create prices for UPC matchs - Target and Whole Foods only
     * 
     */
    createPriceEntries() {
        this.display_progress = true;
        this.progress_bar = 0;
        let timer = Observable
        .timer(1000,1000)
        .subscribe( t => {
            this.progress_bar = this.progress_bar  + 0.5;
        });

        Meteor.call('addNewScrapedPrices', this.chainName, this.updatedAt, this.total, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world

                timer.unsubscribe();
                this.display_progress = false;

                if (err) {
                    console.error("!!!!!!!! ERROR: addNewScrapedPrices !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: addNewScrapedPrices...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL addNewScrapedPrices ...");
                    }
                }
            });
        });
    }


    /** 
     * loop through all sitems and set upcMatch = true for UPC matches
     * 
     */
    updateSitemsUPCMatch() {
        if (this.total == 0) {
            alert('set this.upcMatch = false to get a count of sitems...');
            return;
        }

        this.display_progress = true;
        this.progress_bar = 0;
        let timer = Observable
        .timer(1000,1000)
        .subscribe( t => {
            this.progress_bar = this.progress_bar  + 0.5;
        });


        Meteor.call('updateSitemsUPCMatch', this.chainName, this.total, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world

                timer.unsubscribe();
                this.display_progress = false;

                if (err) {
                    console.error("!!!!!!!! ERROR: updateSitemsUPCMatch !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: updateSitemsUPCMatch...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL updateSitemsUPCMatch ...");
                    }
                }
            });
        });

    }

    updateItemsSynonyms() {
        this.display_progress = true;
        this.progress_bar = 0;
        let timer = Observable
        .timer(1000,1000)
        .subscribe( t => {
            this.progress_bar = this.progress_bar  + 1;
        });

        Meteor.call('updateItemsSynonyms', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world

                timer.unsubscribe();
                this.display_progress = false;

                if (err) {
                    console.error("!!!!!!!! ERROR: updateItemsSynonyms !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: updateItemsSynonyms...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL updateItemsSynonyms ...");
                    }
                }
            });
        });
    }
    
    
    sanitizeSitems() {
        this.display_progress = true;
        this.progress_bar = 0;
        let timer = Observable
        .timer(1000,1000)
        .subscribe( t => {
            this.progress_bar = this.progress_bar  + 1;
        });

        Meteor.call('sanitizeSitems', (err, res) => {

            timer.unsubscribe();
            this.display_progress = false;

            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: sanitizeSitems !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: sanitizeSitems...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL sanitizeSitems ...");
                    }
                }
            });
        });
    }
    
    
    updateSitemsSynonyms() {
        this.display_progress = true;
        this.progress_bar = 0;
        let timer = Observable
        .timer(1000,1000)
        .subscribe( t => {
            this.progress_bar = this.progress_bar  + 0.5;
        });

        Meteor.call('updateSitemsSynonyms', (err, res) => {

            timer.unsubscribe();
            this.display_progress = false;

            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: updateSitemsSynonyms !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: updateSitemsSynonyms...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL updateSitemsSynonyms ...");
                    }
                }
            });
        });
    }


    revertItemNames() {
        alert('revertItemNames has been blocked...');
        return;

        Meteor.call('revertItemNames', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: revertItemNames !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: revertItemNames...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL revertItemNames ...");
                    }
                }
            });
        });
    }


    cleanUpItemSearchTitle() {
        Meteor.call('cleanUpItemSearchTitle', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: cleanUpItemSearchTitle !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: cleanUpItemSearchTitle...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL cleanUpItemSearchTitle ...");
                    }
                }
            });
        });
    }


    cleanUpUndefinedSearchTitle() {
        alert('write code here... UNSURE OF THE PROCESS???');
    }

    
    revertSItemNames() {
        alert('revertSItemNames has been blocked...');
        return;

        Meteor.call('revertSItemNames', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: revertSItemNames !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: revertSItemNames...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL revertSItemNames ...");
                    }
                }
            });
        });
    }


    initMitemsInSitems() {
        Meteor.call('initMitemsInSitems', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: initMitemsInSitems !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: initMitemsInSitems...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL initMitemsInSitems ...");
                    }
                }
            });
        }); 
    }

    
    fixAlphTagIssues() {
        alert('fixAlphTagIssues has been blocked...');
        return;

        Meteor.call('fixAlphTagIssues', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: fixAlphTagIssues !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: fixAlphTagIssues...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL fixAlphTagIssues ...");
                    }
                }
            });
        }); 
    }


    addId2ScrapePrices() {
        Meteor.call('addId2ScrapePrices', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: addId2ScrapePrices !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: addId2ScrapePrices...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL addId2ScrapePrices ...");
                    }
                }
            });
        }); 
    }
    

    conertItemsUpcToIntegers() {
        Meteor.call('conertItemsUpcToIntegers', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: conertItemsUpcToIntegers !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: conertItemsUpcToIntegers...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL conertItemsUpcToIntegers ...");
                    }
                }
            });
        }); 
    }


    removeInvalidItemId() {
        this.display_progress = true;
        this.progress_bar = 0;
        let timer = Observable
        .timer(1000,1000)
        .subscribe( t => {
            this.progress_bar = this.progress_bar  + 0.25;
        });

        Meteor.call('removeInvalidItemId', (err, res) => {

            timer.unsubscribe();
            this.display_progress = false;

            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: removeInvalidItemId !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: removeInvalidItemId...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL removeInvalidItemId ...");
                    }
                }
            });
        }); 
    }


    findMissingUPCsItems() {

        this.display_progress = true;
        this.progress_bar = 0;
        let timer = Observable
        .timer(1000,1000)
        .subscribe( t => {
            this.progress_bar = this.progress_bar  + 0.25;
        });

        Meteor.call('findMissingUPCsItems', this.chainName, (err, res) => {

            timer.unsubscribe();
            this.display_progress = false;

            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: findMissingUPCsItems !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: findMissingUPCsItems...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL findMissingUPCsItems ...");
                    }
                }
            });
        }); 
    }

    fixInvalidSprice() {
        this.display_progress = true;
        this.progress_bar = 0;
        let timer = Observable
        .timer(1000,1000)
        .subscribe( t => {
            this.progress_bar = this.progress_bar  + 0.25;
        });

        Meteor.call('fixInvalidSprice', (err, res) => {
            timer.unsubscribe();
            this.display_progress = false;

            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: fixInvalidSprice !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: fixInvalidSprice...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL fixInvalidSprice ...");
                    }
                }
            });
        }); 
    }

    updateValidSprice() {
        this.display_progress = true;
        this.progress_bar = 0;
        let timer = Observable
        .timer(1000,1000)
        .subscribe( t => {
            this.progress_bar = this.progress_bar  + 0.25;
        });

        Meteor.call('updateValidSprice', (err, res) => {

            timer.unsubscribe();
            this.display_progress = false;

            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: updateValidSprice !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: updateValidSprice...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL updateValidSprice ...");
                    }
                }
            });
        }); 
    }


    fixInvalidImagePath() {
        this.display_progress = true;
        this.progress_bar = 0;
        let timer = Observable
        .timer(1000,1000)
        .subscribe( t => {
            this.progress_bar = this.progress_bar  + 0.25;
        });

        Meteor.call('fixInvalidImagePath', (err, res) => {

            timer.unsubscribe();
            this.display_progress = false;

            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: fixInvalidImagePath !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: fixInvalidImagePath...." + res.error);
                        return;
                    }
                    else {
                        console.log("SUCCESSFUL fixInvalidImagePath ...");
                    }
                }
            });
        }); 
    }



    
}


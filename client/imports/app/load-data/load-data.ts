import { Component, NgZone, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { UserService } from '../services/UserService';
import { VariablesService } from '../services/VariablesService';

import template from "./load-data.html";

@Component({
    selector: 'load-data',
    template
})
export class LoadDataComponent implements OnInit {

    DB_URL: string = Meteor.settings.public.DB_URL;
    ES_URL: string = Meteor.settings.public.ES_URL;

    ITEM_FILE_URL: string = Meteor.settings.public.ITEM_FILE_URL;
    STORE_FILE_URL: string = Meteor.settings.public.STORE_FILE_URL;
    PRICE_FILE_URL: string = Meteor.settings.public.PRICE_FILE_URL;

    OPLOG_FILE: string = Meteor.settings.public.OPLOG_FILE;

    itemMongoCount: number = 0;
    itemESCount: number = 0;
    itemFileCount: number = 0;
    itemExportFileCount: number = 0;

    storeMongoCount: number = 0;
    storeFileCount: number = 0;
    storeExportFileCount: number = 0;

    priceMongoCount: number = 0;
    pricesESCount: number = 0;
    priceExportFileCount: number = 0;

    missing: Object;
    synced: Object;

    missingPrices: Object;
    syncedPrices: Object;

    constructor(
        private _ngZone: NgZone,
        public _userService: UserService,
        private _varsService: VariablesService) {}


    ngOnInit() {
        this._varsService.setReactiveTitleName('LOAD DATA - USERS');

        // show top toolbar
        this._varsService.setReactiveHideToolbar(false);
    }

    // ####################################### ITEMS #########################################################

    getItemInfo() {
        this.getItemMongoCount();

        this.getItemFileCount();

        this.getItemExportedFileCount();

        this.getItemESCount();
    }

    getItemFileCount() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('getItemsFromFileTotal', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### getItemFileCount 009 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('getItemFileCount 009 COUNT = ' + x);
                console.error(x);
                this.itemFileCount = x;
            });
        })
    }

    getItemExportedFileCount() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('getItemsExportedFileCount', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### getItemExportedFileCount 03 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('getItemExportedFileCount 03 = ' + x);
                console.error(x);
                this.itemExportFileCount = x;
            });
        })
    }

    getItemMongoCount() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('getAllItems', -1, (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### getItemMongoCount ###############################');
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(cnt => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('COUNT = ' + cnt);
                this.itemMongoCount = cnt;
            });
        })
    }

    getItemESCount() {

        let goo = new Observable.create(observer => {

            // ss -  Elasticsearch call must reside in server...
            Meteor.call('itemESCount', (error, res) => {

                this._ngZone.run(() => {

                    if (error) {
                        throw error;

                    } else {

                        console.log("!!!!!!!!!!!!!!!!!!!!! successfully returned from Elasticsearch method call in client !!!!!!!!!!!!!");
                        console.log(res);

                        // qq works instantly with ngZone
                        observer.next(res);
                        observer.complete();

                    }
                });

            });

            console.log('===== promise getItemESCount started ====== ');
        });

        goo.subscribe(cnt => {
            console.warn('===== promise getItemESCount done ====== ' + cnt);
            this.itemESCount = cnt;
        });
    }

    importItemsMongo() {
        alert('------- call halted == return');
        return;

        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('importItemsFromCSVFile', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### importItemsFromCSVFile 009 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });
        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('importItemsFromCSVFile 009 COUNT = ' + x);
                console.error(x);
                this.itemFileCount = x;
            });
        })
    }

    importItemsMongoTXT() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('importItemsFromTXTFile', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### importItemsMongoTXT 009 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });
        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('importItemsMongoTXT 565 COUNT = ' + x);
                console.error(x);
                this.itemFileCount = x;
            });
        })
    }

    exportMongoItems() {
        Meteor.call('exportMongoItems', (error, res) => {
            if (error) {
                console.log(error);
            }
            else {
                console.warn('######################### exportMongoItems ###############################');
            }
        });
    }

    importItemsES() {
        Meteor.call('importItemsES', (error, res) => {
            if (error) {
                console.log(error);
            }
            else {
                console.warn('######################### Imported Items into ES ###############################');
            }
        });
    }

    resetItemsES() {
        if (confirm("ARE YOU SURE - delete Items Elasticesearch data") == true) {
            var txt = "yes";
        } else {
            var txt = "no";
        }

        if (txt == 'yes') {
            Meteor.call('resetItemsES', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### Reset Items ES ###############################');
                }
            });
        }
    }

    analyzeItems() {
        Meteor.call('analyzeItems', false, (error, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### analyzeItems ###############################');
                    console.log(res);
                    this.synced = [];
                    this.missing = res;
                }
            });
        });
    }

    syncItems() {
        Meteor.call('analyzeItems', true, (error, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### synced Items ###############################');
                    console.log(res);
                    this.synced = res;
                    this.missing = [];

                }
            });
        });
    }

    addUPCFromCSVFile() {
        Meteor.call('addUPCFromCSVFile', true, (error, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### addUPCFromCSVFile ###############################');
                    console.log(res);
                }
            });
        });
    }


    // ####################################### STORES #########################################################


    getStoreInfo() {
        this.getstoreMongoCount();

        this.getStoreFileCount();

        this.getStoreExportedFileCount();
    }

    getstoreMongoCount() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('getAllStores', -1, (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### getItemMongoCount ###############################');
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(cnt => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('COUNT = ' + cnt);
                this.storeMongoCount = cnt;
            });
        })
    }

    getStoreFileCount() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('getStoresFromFileTotal', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### getStoresFromFileTotal 112 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('getStoresFromFileTotal 112 COUNT = ' + x);
                console.error(x);
                this.storeFileCount = x;
            });
        })
    }


    getStoreExportedFileCount() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('getStoresExportedFileCount', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### getStoresExportedFileCount 044 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('getStoresExportedFileCount 044 = ' + x);
                console.error(x);
                this.storeExportFileCount = x;
            });
        })
    }


    importStoresMongo() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub
            Meteor.call('importStoresFromCSVFile', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### importItemsFromCSVFile 009 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('importItemsFromCSVFile 009 COUNT = ' + x);
                console.error(x);
                this.itemFileCount = x;
            });
        })
    }


    importStoresMongoTXT() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub
            Meteor.call('importStoresFromTXTFile', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### importStoresMongoTXT 055 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('importStoresMongoTXT 056 COUNT = ' + x);
                console.error(x);
                this.itemFileCount = x;
            });
        })
    }


    exportMongoStores() {
        Meteor.call('exportMongoStores', (error, res) => {
            if (error) {
                console.log(error);
            }
            else {
                console.warn('######################### exportMongoStores ###############################');
            }
        });
    }

    // ####################################### PRICES #########################################################

    getPriceInfo() {
        this.getPriceMongoCount();
        this.getPriceExportedFileCount();
        this.getPriceESCount();
    }

    getPriceMongoCount() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('getAllPrices', -1, (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### priceMongoCount ###############################');
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(cnt => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('COUNT = ' + cnt);
                this.priceMongoCount = cnt;
            });
        })
    }

    getPriceExportedFileCount() {
        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('getPricesExportedFileCount', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### getPricesExportedFileCount 322 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('getPricesExportedFileCount 322 = ' + x);
                console.error(x);
                this.priceExportFileCount = x;
            });
        })
    }

    getPriceESCount() {
        let goo = new Observable.create(observer => {
            Meteor.call('pricesESCount', (error, res) => {

                this._ngZone.run(() => {

                    if (error) {
                        throw error;

                    } else {

                        console.log("!!!!!!!!!!!!!!!!!!!!! successfully returned from Elasticsearch method call in client !!!!!!!!!!!!!");
                        console.log(res);

                        // qq works instantly with ngZone
                        observer.next(res);
                        observer.complete();

                    }
                });
            });
            console.log('===== promise pricesESCount started ====== ');
        });

        goo.subscribe(cnt => {
            console.warn('===== promise pricesESCount done ====== ' + cnt);
            this.pricesESCount = cnt;
        });
    }


    addRandomPrices() {
        Meteor.call('addRandomPrices', (error, res) => {
            if (error) {
                console.log(error);
            }
            else {
                console.warn('######################### addRandomPrices ###############################');
            }
        });
    }


    exportMongoPrices() {
        Meteor.call('exportMongoPrices', (error, res) => {
            if (error) {
                console.log(error);
            }
            else {
                console.warn('######################### exportMongoPrices ###############################');
            }
        });
    }


    importPricesMongo() {
        Meteor.call('importPricesMongo', (error, res) => {
            if (error) {
                console.log(error);
            }
            else {
                console.warn('######################### importPricesMongo ###############################');
            }
        });
    }

    importPricesES() {
        Meteor.call('importPricesES', (error, res) => {
            if (error) {
                console.log(error);
            }
            else {
                console.warn('######################### Imported Prices into ES ###############################');
            }
        });
    }

    resetPricesES() {
        if (confirm("ARE YOU SURE - delete Prices Elasticesearch data") == true) {
            var txt = "yes";
        } else {
            var txt = "no";
        }

        if (txt == 'yes') {
            Meteor.call('resetPricesES', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### Reset Items ES ###############################');
                }
            });
        }
    }

    analyzePrices() {
        Meteor.call('analyzePrices', false, (error, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### analyzePrices ###############################');
                    console.log(res);
                    this.missingPrices = res;
                }
            });
        });
    }


    syncPrices() {
        Meteor.call('analyzePrices', true, (error, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### Synced Prices ###############################');
                    console.log(res);
                    this.syncedPrices = res;

                }
            });
        });
    }

    // ####################################### RE-LOAD from OpLost #########################################################
    loadOpLogFile() {

        alert('OpLog edit has been blocked...');
        return;

        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('getOplogData', (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### getStoresFromFileTotal 112 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('getStoresFromFileTotal 112 COUNT = ' + x);
                console.error(x);
                this.storeFileCount = x;
            });
        })

    }


    // ####################################### PEPE ITEMS #########################################################
    importPepeItemsMongo() {

        let email = 'cdgalindo@yahoo.com';

        let foo = new Observable.create(observer => {
            // Retrieve matching stores - call mongoDB directly, avoid sub/pub

            Meteor.call('importPepeItemsFromCSVFile', email, (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.warn('######################### importItemsFromCSVFile 009 ###############################');
                    console.warn(res);
                    observer.next(res);
                    observer.complete();
                }
            });

        });

        foo.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                console.error('importItemsFromCSVFile 009 COUNT = ' + x);
                console.error(x);
                this.itemFileCount = x;
            });
        })
    }

    importPepeItemsES() {
        Meteor.call('importPepeItemsES', (error, res) => {
            if (error) {
                console.log(error);
            }
            else {
                console.warn('######################### Imported Items into ES ###############################');
            }
        });
    }

}



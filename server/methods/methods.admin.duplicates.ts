import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Duplicate } from '../../both/models/duplicate.model';

import { getSitemMatches } from '../functions/functions.admin.scrapes';
import { duplicatesUpdate } from '../functions/functions.admin.duplicates';

let Future = Npm.require( 'fibers/future' );
let fs = require('fs');

let MONGO_URL = Meteor.settings.MONGO_URL;
let MATCH_TERMS = Meteor.settings.public.MATCH_TERMS;

Meteor.methods({

    /**
     *  Merge duplicate items
     * 
     * @param it 
     * @param im 
     */
    'mergeDuplicateItems'(it, im) {
        if (this.userId) {
            if (Roles.userIsInRole(Meteor.userId(), 'superadmin')) {
                let itemId = im._id;
                im = _.omit(im,'_id');
         
                // Create our future instance.
                let future = new Future();

                let MongoClient = Npm.require('mongodb').MongoClient;
                MongoClient.connect(MONGO_URL, function (err, db) {
                    if (err) {
                        future.return({
                            status: false,
                            error: err
                        });
                    } 
                    else {
                        let collection = db.collection('items');
                        // Update a single item
                        collection.updateOne({
                                _id: itemId
                            }, 
                            {
                                $set: im
                            }, 
                            function(err, res) {
                                if (err) {
                                    console.error(err);
                                    future.return({
                                        status: false,
                                        error: err
                                    });
                                }
                                else {
                                    console.log('updated item ' + itemId);
                                    it.dupitems.map(x => {
                                        if (itemId != x.itemId) {
                                            console.error('delete item -- ' + x.itemId);
                                            let res8 = deleteItemSkipImage(x.itemId);
                                        }
                                    });

                                    let res9 = duplicatesUpdate(it._id, { status: 1});

                                    future.return({
                                        status: true,
                                    });
                                    db.close();
                                }
                            });
                    }
                });

                return future.wait();
            }
        }
    },


    /**
     *  insert duplicate entry containing 2 or more selected duplicate items
     * 
     * @param dups 
     */
    'setItemDuplicates'(dups) {
        if (this.userId) {
            let evenId = '';
            let oddId = '';
            let d = new Array();
            _.each(dups, function(val, key) {
                let d1:DUPITEM = {itemId: val};
                d.push(d1);
            });

            // Create our future instance.
            let future = new Future();

            let MongoClient = Npm.require('mongodb').MongoClient;
            MongoClient.connect(MONGO_URL, function (err, db) {
                if (err) {
                    future.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    let collection = db.collection('duplicates');
                    let dup = <Duplicate>{};
                    dup._id = Random.id();
                    dup.created = new Date().getTime();
                    dup.status = 0;
                    dup.dupitems = d;

                    collection.insertOne(dup, function(err, res) {
                        if (err) {
                            future.return({
                                status: false,
                                error: err
                            });                          
                        }
                        else if (res.insertedCount) {
                            console.log('############## Inserted DuplicateItems ID= ' + res.insertedId);
                            console.log(d);
                            future.return({
                                status: true,
                                id: res.insertedId
                            }); 
                        }
                        else {
                            future.return({
                                status: false,
                                error: 'duplicates insert failed - ' + dup.dupitems
                            });
                        }

                        db.close();
                    });

                }
            });

            return future.wait();
        }
    },


    /**
     * Loop through each item and find duplicate UPC 
     * Create a duplicate entry for each duplicate UPC find
     * 
     */
    'identify.duplicate.upc.items'() {
        if (this.userId) {
            if (Roles.userIsInRole(Meteor.userId(), 'superadmin')) {
                // Create our future instance.
                let loopMax = 1000;
                let future = new Future();

                let upcArray = {}
                let dupsObject = [];
                let cnt = 0;

                let MongoClient = Npm.require('mongodb').MongoClient;
                MongoClient.connect(MONGO_URL, function (err, db) {
                    if (err) {
                        future.return({
                            status: false,
                            error: err
                        });
                    } 
                    else {
                        let collection = db.collection('items');
                        collection.count()
                        .then(function (count) {
                            let cnt =  Math.round(count/loopMax);
                            if ( count > cnt * loopMax) {
                                cnt++;
                            }

                            for (let i = 1; i <= cnt; i++) {

                                let res = getItemsLoopMax(loopMax, i);
                                res.data.map(y => {
                                    if (upcArray[y.upc]) {
                                        dupsObject.push({
                                            // upc: y.upc,
                                            id1: upcArray[y.upc],
                                            id2: y._id
                                        });
                                        console.log( cnt + ' -DUPLICATE- ' + y._id + ' -- ' + y.upc);
                                    }
                                    else {
                                        upcArray[y.upc] = y._id;
                                    }
                                })
                            }

                            dupsObject.map(v => {
                                let res = insertDuplicatesSameUPC(v);
                            });

                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                            future.return({
                                status: true,
                                data: 'poo'
                            });

                        });
                    }
                });

                return future.wait();
            }
        }
    },

    /**
     * Worker function to clean up deplicate UPC - delete identical items
     * 
     */
    'autoCLean.duplicate.upc.items'() {
        if (this.userId) {
            if (Roles.userIsInRole(Meteor.userId(), 'superadmin')) {
                // Create our future instance.
                let loopMax = 1000;
                let future = new Future();

                let upcArray = {}
                let sizeUnitArray = {}
                let noteArray = {}
                let dupsObject = [];
                let cnt = 0;
                let sizeUnitCnt = 0;

                let MongoClient = Npm.require('mongodb').MongoClient;
                MongoClient.connect(MONGO_URL, function (err, db) {
                    if (err) {
                        future.return({
                            status: false,
                            error: err
                        });
                    } 
                    else {
                        let collection = db.collection('items');
                        collection.count()
                        .then(function (count) {

                            let cnt =  Math.round(count/loopMax);
                            if ( count > cnt * loopMax) {
                                cnt++;
                            }

                            for (let i = 1; i <= cnt; i++) {

                                let res = getItemsLoopMax(loopMax, i);
                                res.data.map(y => {
                                    sizeUnitCnt = 0;
                                    if (upcArray[y.upc]) {

                                        if (y.unit != null) { sizeUnitCnt++ }
                                        if (y.size != null) { sizeUnitCnt++ }

                                        dupsObject.push({
                                            // upc: y.upc,
                                            su1: sizeUnitArray[y.upc],
                                            id1: upcArray[y.upc],
                                            note1: noteArray[y.upc],
                                            su2: sizeUnitCnt,
                                            id2: y._id,
                                            note2: y.note
                                        });
                                    }
                                    else {
                                        if (y.unit != null) { sizeUnitCnt++ }
                                        if (y.size != null) { sizeUnitCnt++ }
                                        upcArray[y.upc] = y._id;
                                        sizeUnitArray[y.upc] =sizeUnitCnt;
                                        noteArray[y.upc] = y.note;
                                    }
                                })
                            }

                            console.error( "dupsObject.length = " + dupsObject.length);

                            dupsObject.map(v => {
                                if (v.su1 == v.su2) {
                                    // skip for now

                                    if (v.note1 == 'contractor') {
                                        // let res8 = deleteItemSkipImage(v.id2);
                                        if (v.note2 == 'please fix') {
                                            let res8 = deleteItemSkipImage(v.id2);
                                        }
                                    }
                                    else if (v.note2 == 'contractor') {
                                        if (v.note1 == 'please fix') {
                                            let res8 = deleteItemSkipImage(v.id1);
                                        }
                                    }
                                    else if ( (v.note1 == 'please fix') && (v.note2 == 'please fix') ) {
                                        console.log(v.note1 + ' -- ' + v.note2);
                                        let res8 = deleteItemSkipImage(v.id2);
                                    }
                                    
                                }
                                else if (v.su1 > v.su2 ){
                                    console.log('delete ITEM 2   su1 = '  + v.su1 + ' ---  su2 = ' + v.su2 )
                                    let res8 = deleteItemSkipImage(v.id2);
                                }
                                else {
                                    console.log('delete ITEM 1   su1 = '  + v.su1 + ' ---  su2 = ' + v.su2 )
                                    let res8 = deleteItemSkipImage(v.id1);
                                }

                            });

                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                            future.return({
                                status: true,
                                data: 'poo'
                            });

                        });
                    }
                });

                return future.wait();
            }
        }
    },


    /**
     * Loop through each item and find names
     * Create a duplicate entry for each duplicate name find
     * 
     */
    'identify.duplicate.name.items'() {
        if (this.userId) {
            if (Roles.userIsInRole(Meteor.userId(), 'superadmin')) {
                // Create our future instance.
                let loopMax = 1000;
                let future = new Future();

                let nameArray = {}
                let dupsObject = [];
                let cnt = 0;

                let MongoClient = Npm.require('mongodb').MongoClient;
                MongoClient.connect(MONGO_URL, function (err, db) {
                    if (err) {
                        future.return({
                            status: false,
                            error: err
                        });
                    } 
                    else {
                        let collection = db.collection('items');
                        collection.count()
                        .then(function (count) {
                            let cnt =  Math.round(count/loopMax);
                            if ( count > cnt * loopMax) {
                                cnt++;
                            }

                            for (let i = 1; i <= cnt; i++) {
                                console.log(cnt + ' -- ' + i);

                                let res = getItemsLoopMaxbyName(loopMax, i);
                                res.data.map(y => {
                                    let temp = y.name.split(' :DUPLICATE:');
                                    // console.log( y.name + ' -- ' + temp[0] );

                                    if (nameArray[temp[0]]) {
                                        dupsObject.push({
                                            id1: nameArray[temp[0]],
                                            id2: y._id
                                        });
                                    }
                                    else {
                                        nameArray[temp[0]] = y._id;
                                    }


                                })
                            }

                            dupsObject.map(v => {
                                let res = insertDuplicatesSameUPC(v);
                            });

                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                            future.return({
                                status: true,
                                data: 'poo'
                            });

                        });
                    }
                });

                return future.wait();
            }
        }
    },


    /**
     *  Insert duplicte entry for selected items - worker function
     * 
     * @param dups 
     */
    'insertDuplicates'(dups) {
        //ww - Don't add Dummy PAIDTO, bogus IDs will break My-RequestPrices
        // (C4) request price on item #3,  set duration = 0 hours -- Status  = 0, price = 2.3
        // let p1:PAIDTO = {spId: 'booboo1', owner: 'Bobby', paidAt: currentDate, payout: 100, status: 'go'};
        // let p2:PAIDTO = {spId: 'booboo2', owner: 'Bobby2', paidAt: currentDate, payout: 102, status: 'go2'};
        //
        // let c = new Array();
        // c.push(p1);
        // c.push(p2);
        // requestprice_entity.paidTos = c;

        let cnt = 0;
        let evenId = '';
        let oddId = '';
        let d = new Array();


        _.each(dups, function(val, key) {
            let d1:DUPITEM = {itemId: val};
            d.push(d1);
            cnt++;
        });

        if (this.userId) {

            let MongoClient = Npm.require('mongodb').MongoClient;
            let promise = new Promise((resolve) => {
            
                MongoClient.connect(MONGO_URL, function (err, db) {
                    if (err) {
                        resolve({
                            status: false,
                            error: err
                        });
                    } 
                    else {
                        let collection = db.collection('duplicates');
                        let dup = <Duplicate>{};
                        dup._id = Random.id();
                        dup.created = new Date().getTime();
                        dup.status = 0;
                        dup.dupitems = d;

                        collection.insertOne(dup, function(err, res) {
                            if (err) {
                                throw err;                                
                            }
                            else if (res.insertedCount) {
                                console.log('############## Inserted DuplicateItems ID= ' + res.insertedId);
                            }
   
                            db.close();
                        });

                    }
                });
            });

            return promise.then(x => {
                console.log('-- this is my duplicates entity...');
                return x;
            });
        }
    },


    /**
     * 1) Retrieve sitems with matches to items for this store
     * 2) Determing items selected by multiple sitems
     * 3) Record finding in duplicates collection
     * 
     * 
     * @param scrapedStore 
     */
    'processSitemItemDuplicates'(scrapedStore) {

        let itemsArray = {};    // [itemId] = sitemId
        let dups = {};
        
        let matches = getSitemMatches(scrapedStore, true);
        if (matches.status) {

            // console.log(matches.data);

            _.each(matches.data, function(val, key) {
                val.mitems.map(x => {
                    if (itemsArray[x.itemId]) {
                        let d = new Array();
                        
                        if (_.size( dups[x.itemId])) {
                            d = dups[x.itemId];
                        }
                        else {
                            let d0:DUPITEM = {itemId: x.itemId, sitemId: itemsArray[x.itemId]};
                            d.push(d0);
                        }

                        let d1:DUPITEM = {itemId: x.itemId, sitemId: val._id};
                        d.push(d1);

                        dups[x.itemId] = d;
                    }
                    else {
                        itemsArray[x.itemId] = val._id;
                    }
                })
            });

            _.each(dups, function(val, key) {
                insertDuplicateSitemItem(scrapedStore, val);
            });

            return { status: true }
        }

    },


});



/**
 * Retrieve X number of items syncrounsly
 * 
 * @param loopMax 
 * @param cnt 
 */
function getSitemsWithMatches(loopMax: number, cnt: number) {

    let skip = (cnt - 1) * loopMax;

    // Create our future instance.
    var future2 = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            future2.return({
                status: false,
                error: err
            });
        } else {
            // $nin: [ 5, 15 ]
            let collection = db.collection('items');
            collection.find({upc: { $nin: ['undefined', "null", null] } })
            .limit(loopMax)
            .skip(skip)
            .toArray(function (err, results) {
                // Let's close the db -- don't close until you receive the results...
                db.close();
                future2.return({
                    status: true,
                    data: results
                });
            });
        }
    });

    return future2.wait();
}




/**
 * Ensure only superadmin can delete an item
 * 
 * @param itemId 
 */
function deleteItemSkipImage(itemId: string) {
    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            console.error(err);
        } else {
            let collection = db.collection('items');
            collection.deleteOne({ _id: itemId }, function(err2, result) {
                if (err2) {
                    console.error(err2);
                }
                else {
                    console.log("Removed item with itemId = " + itemId);
                }

                db.close();
            });
        }
    });
}



/**
 * Retrieve X number of items syncrounsly
 * 
 * @param loopMax 
 * @param cnt 
 */
function getItemsLoopMax(loopMax: number, cnt: number) {

    let skip = (cnt - 1) * loopMax;

    // Create our future instance.
    var future2 = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            future2.return({
                status: false,
                error: err
            });
        } else {
            // $nin: [ 5, 15 ]
            let collection = db.collection('items');
            collection.find({upc: { $nin: ['undefined', "null", null] } })
            .limit(loopMax)
            .skip(skip)
            .toArray(function (err, results) {
                console.log('loop entries: ' + results.length);
                // Let's close the db -- don't close until you receive the results...
                db.close();
                future2.return({
                    status: true,
                    data: results
                });
            });
        }
    });

    return future2.wait();
}


/**
 * Retrieve X number of items syncrounsly
 * where name matches "please fix";
 * 
 * @param loopMax 
 * @param cnt 
 */
function getItemsLoopMaxbyName(loopMax: number, cnt: number) {

    let skip = (cnt - 1) * loopMax;

    // Create our future instance.
    var future2 = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            future2.return({
                status: false,
                error: err
            });
        } else {
            let collection = db.collection('items');
            collection.find({name: {$regex: ':DUPLICATE:', '$options': 'i'}})
            .limit(loopMax)
            .skip(skip)
            .toArray(function (err, results) {
                console.log('loop entries: ' + results.length);
                // Let's close the db -- don't close until you receive the results...
                db.close();
                future2.return({
                    status: true,
                    data: results
                });
            });
        }
    });

    return future2.wait();
}


/**
 *  Insert duplicte entry for selected items
 * 
 * @param dup 
 */
function insertDuplicatesSameUPC(dup) {
    let cnt = 0;
    let evenId = '';
    let oddId = '';
    let d = new Array();
    
    _.each(dup, function(val, key) {
        // console.log(key + ' -- ' + val)
        let d1:DUPITEM = {itemId: val};
        d.push(d1);
        cnt++;
    });
    
    // Create our future instance.
    let futureV = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureV.return({
                status: false,
                error: err
            });  
        } 
        else {
            let collection = db.collection('duplicates');
            let dup = <Duplicate>{};
            dup._id = Random.id();
            dup.created = new Date().getTime();
            dup.status = 0;
            dup.dupitems = d;

            collection.insertOne(dup, function(err, res) {
                if (err) {
                    futureV.return({
                        status: false,
                        error: err
                    });                            
                }
                else if (res.insertedCount) {
                    console.log('############## Inserted DuplicateItems ID= ' + res.insertedId);
                    futureV.return({
                        status: true,
                        data: 'ok'
                    });
                }

                db.close();
            });

        }
    });

    return futureV.wait();
}


/**
 *  Insert duplicte entry for selected items
 * 
 * @param scrapedStore 
 * @param d 
 */
function insertDuplicateSitemItem(scrapedStore, d) {
    // Create our future instance.
    let futureV = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureV.return({
                status: false,
                error: err
            });  
        } 
        else {
            let collection = db.collection('duplicates');
            let dup = <Duplicate>{};
            dup._id = Random.id();
            dup.created = new Date().getTime();
            dup.status = 20;
            dup.scrapedStore = scrapedStore;
            dup.dupitems = d;

            collection.insertOne(dup, function(err, res) {
                if (err) {
                    futureV.return({
                        status: false,
                        error: err
                    });                            
                }
                else if (res.insertedCount) {
                    console.log('############## insertDuplicateSitemItem ID= ' + res.insertedId);
                    futureV.return({
                        status: true,
                        data: 'ok'
                    });
                }

                db.close();
            });

        }
    });

    return futureV.wait();
}
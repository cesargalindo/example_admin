import { Meteor } from 'meteor/meteor';

// npm install fs
let fs = require('fs');
let Future = Npm.require( 'fibers/future' );

let MONGO_URL = Meteor.settings.MONGO_URL;

Meteor.methods({


    /**
     * Genereate Report of scraped items
     */
    'getScraperReport'() {
        if (this.userId) {
            let res2a = '';
            let res2b = '';
            let results = [];
            let updatedAt = 0;
            let storeName = '';
            let daStores = {};

            let res1b = getAggregateStoresFromPrices();
            
            res1b.data.map(x => {
                res2b = getMaxPricesUpdated(x._id);

                console.log(x._id + ' -------- ' + x.store_info[0].name + ' -- ' + res2b.data[0].updated);                

                storeName = x.store_info[0].name;
                // consolidate to chainName
                if ( (storeName == 'Walmart Neighborhood Market') || (storeName == 'Walmart Supercenter') ) {
                    storeName = 'Walmart';
                }
                else if (storeName == 'Whole Foods Market') {
                    storeName = 'Whole Foods';
                }
                else if (storeName == 'Rancho San Miguel Market') {
                    storeName = 'Rancho San Miguel Markets';
                }
                else if (storeName == 'Smart & Final Extra!') {
                    storeName = 'Smart and Final';
                }
                
                // Capture latest "updated" date
                if (daStores[storeName] == undefined) {
                    daStores[storeName] = res2b.data[0].updated;
                }
                else if (res2b.data[0].updated > daStores[storeName]) {
                    daStores[storeName] = res2b.data[0].updated;
                }
            });

            // console.error(daStores);
            // return {status: false};

            let res1a = getAggregateChainNames();            
            res1a.data.map(x => {

                res2a = getMaxUpdatedAt(x._id);
                
                if (res2a.data[0] == undefined) {
                    console.log('==xx=xx==x==x 11 =x=x=x=x=x=x=x=x=x ' + x._id + ' -- undefined -- ' + daStores[x._id] );
                    updatedAt = 0;
                }
                else {
                    console.log('==xx=xx==x==x 22 =x=x=x=x=x=x=x=x=x ' + x._id + ' -- ' + res2a.data[0].updatedAt + ' -- ' + daStores[x._id] );
                    updatedAt = res2a.data[0].updatedAt; 
                }

                let updateRequired = false;
                if ( (updatedAt != undefined) && (daStores[x._id] != undefined) ) {
                    if (updatedAt > daStores[x._id]) {
                        updateRequired = true;
                    }
                } 
                
                results.push({ 
                    chainName: x._id,
                    updatedAt: updatedAt,
                    updateRequired: updateRequired,
                    updated: daStores[x._id]
                });

            })

            // console.log(results);
            return {
                status : true,
                data: results
            }
        }
        else {
            return { status: false }
        }
    },


});

/**
 * Retrieve latest sitem with an mitem 
 * 
 * @param chainName 
 */
function getMaxUpdatedAt(chainName) {
    // Create our future instance.
    let futureA = new Future();
    let MongoClient = Npm.require('mongodb').MongoClient;


    // Modify query for Targert - Target doesn't not contain mitem matches - matches are based on UPC
    let query = {};
    if (chainName == 'Target') {
        query = { chainName: "Target", upcMatch: true };
    }
    else if (chainName == 'Whole Foods') {
        query = { chainName: "Whole Foods", upcMatch: true };
    }
    else {
        query = {
            chainName: chainName,
            'mitems.0.itemId': { $exists: true }                
        }
    }

    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureA.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('sitems');
            collection.find(query).sort({updatedAt: -1}).limit(1).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getMaxUpdatedAt: sitem .. ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    // console.log(results);
                    futureA.return({
                        status: true,
                        data: results
                    });
                }
                db.close();
            });
        }
    });
    return futureA.wait();
}

/**
 * 
 */
function getAggregateChainNames() {
    // Create our future instance.
    let futureA = new Future();
    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureA.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('sitems');
            collection.aggregate([ { $group : { _id : "$chainName" } } ]).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getAggregateChainNames: item .. ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    // console.log(results);
                    futureA.return({
                        status: true,
                        data: results
                    });
                }
                db.close();
            });
        }
    });
    return futureA.wait();
}


/**
 * Retrieve latest updatedAt for each prices-store combo
 * 
 * @param storeId 
 */
function getMaxPricesUpdated(storeId) {
    // Create our future instance.
    let futureA = new Future();
    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureA.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('prices');
            collection.find({
                storeId: storeId,
            }).sort({updated: -1}).limit(1).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getMaxPricesUpdated - prices ... ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    // console.log(results);
                    futureA.return({
                        status: true,
                        data: results
                    });
                }
                db.close();
            });
        }
    });
    return futureA.wait();
}

/**
 * 
 */
function getAggregateStoresFromPrices() {
    // Create our future instance.
    let futureA = new Future();
    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureA.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('prices');
            collection.aggregate([ 
                { $group : { _id : "$storeId" } },
                { $lookup:
                      {
                        from: "stores",
                        localField: "_id",
                        foreignField: "_id",
                        as: "store_info"
                      }
                 }
            ]).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getAggregateStoresFromPrices: item .. ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    // console.log(results);
                    futureA.return({
                        status: true,
                        data: results
                    });
                }
                db.close();
            });
        }
    });
    return futureA.wait();
}
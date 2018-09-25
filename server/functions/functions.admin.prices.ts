import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Price } from '../../both/models/price.model';
import { Tprice } from '../../both/models/tprice.model';

let Future = Npm.require( 'fibers/future' );


/**
 * Get price matching ItemId, StoreId, and quantity
 * 
 * @param itemId 
 * @param storeId 
 * @param quantity 
 */
export function getPriceMatch(itemId: string, storeId: string, quantity: number) {
        
    // Create our future instance.
    var future = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            future.return({
                status: false,
                error: err
            });
        } else {
            let collection = db.collection('prices');
            collection.find({
                itemId: itemId,
                storeId: storeId,
                quantity: parseInt(quantity)
            }).toArray(function (err, results) {
                future.return({
                    status: true,
                    results: results,
                    data: results.length
                });

                // Let's close the db -- don't close until you receive the results...
                db.close();
            });
        }
    });

    return future.wait();
}



/**
 * Price info is inserted into Elasticsearch through another process
 *
 * @param pi 
 */
export function addNewPrice(pi: Price) {
    // retrieve item info to calculate gunits and gsize - include quantity value
    if ( (pi.gsize == undefined) || (pi.gunit == undefined)) {
        console.error('ERROR: ++++++++++++ pricesInsert ++++++++++++ gsize = ' + pi.gsize + '  gunit = ' + pi.gunit + '  quanity = ' + pi.quantity);
        return;
    }

    // Create our future instance.
    let future = new Future();
    
    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            future.return({
                status: false,
                error: err
            });
        }
        else {
            let collection = db.collection('prices');

            collection.insertOne(pi, function(err, res) {
                db.close();
                
                if (res == undefined) {
                    future.return({
                        status: false,
                        error: 'price insert failed'
                    });  
                }
                else if (res.insertedCount) {
                    // console.log('############## STORE INSERT NEW PRICE= ' + res.insertedId);
                    future.return({
                        status: true,
                        id: res.insertedId
                    });

                }
                else {
                    future.return({
                        status: false,
                        error: 'price insert failed'
                    });
                }
            });
        }
    });

    return future.wait();
}



/**
 * Monitor payoutRequest changes on price updates - before and after
 *
 * @param pu 
 */
export function pricesUpdate(pu: Price) {

    // Create our future instance.
    let futurePU = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            console.log(err);
            futurePU.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('prices');
            // Update a single item
            collection.updateOne({
                    _id: pu._id
                }, 
                {
                    $set: {
                        updated: pu.updated,
                        submittedAt: pu.updated,
                        startsAt: pu.startsAt,
                        price: pu.price
                    }
                }, 
                function(err, res) {
                    if (err) {
                        console.error(err);
                        futurePU.return({
                            status: false,
                            error: err
                        });
                    }
                    else {
                        futurePU.return({
                            status: true,
                            id: pu._id
                        });
                    }
                    db.close();
                    
                });
        }
    });

    return futurePU.wait();
}


/**
 * Get Tprice matching ItemId, StoreId, and quantity
 * 
 * @param itemId 
 * @param storeId 
 * @param quantity 
 */
export function getTpriceMatch(itemId: string, storeId: string, quantity: number) {
        
    // Create our future instance.
    var future = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            future.return({
                status: false,
                error: err
            });
        } else {
            let collection = db.collection('tprices');

            collection.find({
                itemId: itemId,
                storeId: storeId,
                quantity: quantity
            }).toArray(function (err, results) {
                // Let's close the db -- don't close until you receive the results...
                db.close();
                future.return({
                    status: true,
                    results: results,
                    data: results.length
                });
            });
        }
    });

    return future.wait();
}


/**
 * Update existing Tprice
 *
 * @param pid 
 * @param query 
 */
export function tpricesUpdate(pid, query) {

    // Create our future instance.
    let futurePU = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            console.log(err);
            futurePU.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('tprices');
            // Update a single item
            collection.updateOne({
                    _id: pid
                }, 
                {
                    $set: query
                }, 
                function(err, res) {
                    if (err) {
                        console.error(err);
                        futurePU.return({
                            status: false,
                            error: err
                        });
                    }
                    else {
                        // console.log("Prices updated: " + pid);
                        futurePU.return({
                            status: true,
                            id: pid
                        });
                    }
                    db.close();
                    
                });
        }
    });

    return futurePU.wait();
}


/**
 * Insert a new Tprice
 *
 * @param pi 
 */
export function addNewTprice(pi: Tprice) {
    // retrieve item info to calculate gunits and gsize - include quantity value
    if ( (pi.gsize == undefined) || (pi.gunit == undefined)) {
        console.error('ERROR: ++++++++++++ tpricesInsert ++++++++++++ gsize = ' + pi.gsize + '  gunit = ' + pi.gunit + '  quanity = ' + pi.quantity);
        return;
    }

    // Create our future instance.
    let future = new Future();
    
    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            future.return({
                status: false,
                error: err
            });
        }
        else {
            let collection = db.collection('tprices');

            collection.insertOne(pi, function(err, res) {
                db.close();
                
                if (res == undefined) {
                    future.return({
                        status: false,
                        error: 'tprice insert failed'
                    });  
                }
                else if (res.insertedCount) {
                    // console.log('############## STORE INSERT NEW TPRICE= ' + res.insertedId);
                    future.return({
                        status: true,
                        id: res.insertedId
                    });

                }
                else {
                    future.return({
                        status: false,
                        error: 'tprice insert failed'
                    });
                }
            });
        }
    });

    return future.wait();
}


/**
 * Price info is inserted into Elasticsearch through another process
 *
 * @param p2 
 * @param storeId 
 */
export function addNewPrice2(p2: Price, storeId) {

    // Create our future instance.
    let futureA = new Future();

    p2.storeId = storeId;
    p2._id = Random.id();
    let rawPrice = p2.price * p2.gsize;
    let pMult = getRndPercent(75, 125);
    p2.price = rawPrice * pMult / p2.gsize;

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            console.error(err);
            futureA.return({
                status: false, 
                error: err
            });
        }
        else {
            let collection = db.collection('prices');
            collection.insertOne(p2, function(err, res) {
                if (res == undefined) {
                    console.error(err);
                    console.error('Error addNewPrice2 insert failed -- 40...'); 
                }
                else if (res.insertedCount) {
                    // console.log('############## STORE INSERT NEW PRICE= ' + res.insertedId);

                }
                else {
                    console.error('Error addNewPrice2 insert failed... -- 41'); 
                }

                db.close();
                futureA.return({
                    status: true,
                });
            });
        }
    });

    return futureA.wait();    
}


function getRndPercent(min, max) {
    return ( Math.floor(Math.random() * (max - min + 1) ) + min ) / 100;
}
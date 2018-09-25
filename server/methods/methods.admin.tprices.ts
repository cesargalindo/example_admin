import { Meteor } from 'meteor/meteor';

import { addUpdatePriceFromTprice } from '../functions/functions.admin.scrapes';

import { getPriceMatch, getTpriceMatch, tpricesUpdate, addNewTprice } from '../functions/functions.admin.prices';
import { getGlobalSize } from '../functions/functions.admin.misc';
import { getLocaUser } from '../functions/functions.admin.users';
import { getStorebyStorechain } from '../functions/functions.admin.stores';

import { Tprice } from '../../both/models/tprice.model';

import { Random } from 'meteor/random';
let Future = Npm.require( 'fibers/future' );


Meteor.methods({

    /**
     * Update existing tprice
     * 
     * @param tprice 
     */
    'editExistingTprice'(tprice: Tprice) {

        console.log(tprice);

        let tid = tprice._id;
        tprice = _.omit(tprice,'_id');

        let res = tpricesUpdate(tid, tprice);

        if(res.status) {
            console.log('tpricesUpdate - Updated Tprice: ' + res.id);
        }
        else {
            console.error(res.error);
            return { 
                status: false,
                error: res.error
             }
        }

    },


    /**
     * Create prices from Manually entered prices
     * 1) Retrieve list of stores grouped by storeIds in tprices - join store chainName to each storeId 
     * 2) Loop through each storeId group
     *    3) Retrieve trpices matching this storeId
     *    4) Loop through each tprices
     *       5) addUpdatePriceFromTprice
     * 
     * @param email 
     */
    'processManualPrices'(email: string) {

        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            let uid = Meteor.userId();
            let newItemCache = {};
            let sizes = {};
            let units = {};
            let itemNames = {};
            let currentDate = new Date().getTime();

            // Only allow custom email if Admin user
            if (email) {
                let uInfo = getLocaUser(email);
                uid = uInfo._id;
            }

            console.log( Meteor.userId() + ' #### ' +  email + ' #### ' + uid );

            let storeData = funcGetStoresFromMyTprices(uid);

            storeData.data.map(st => {
                console.log(st._id + ' -==- ' + st.sp[0].chainName);

                // get list of stores for store Chain name
                let storeInfo = getStorebyStorechain(st.sp[0].chainName);

                let myTPs = funcGetMyTprices(uid, st._id);

                 myTPs.data.map(t => {
                     if (sizes[t.itemId] == undefined) {
                         //  Get item info - size, unit
                         let res3 = Meteor.call('getItem', t.itemId, 0);
                         if (res3.length) {
                             console.log(res3[0].size + ' ===0=== ' +  t.itemId + ' ===0=== ' + res3[0].unit);
                             sizes[t.itemId] = res3[0].size;
                             units[t.itemId] = res3[0].unit;
                             itemNames[t.itemId] = res3[0].name;
                         }
                         else {
                             console.error("WTF - this item doesn't exist - " + t.itemId);
                             return;
                         }
                     }

                     let pr = {
                        price: t.price * t.gsize,
                        startsAt: t.startsAt
                     }

                     let m = {
                         itemId: t.itemId,
                         quantity: t.quantity
                     }

                    let res22 = addUpdatePriceFromTprice(storeInfo, newItemCache, sizes, units, itemNames, currentDate, t.itemId, pr, m);

                    // Update cache
                    newItemCache = res22.newIC;

                    let res3 = tpricesUpdate(t._id, {status: 1});
                 });
            })

            return { status: true }
        }
    },


    /**
     * Add temporary price added manually by contractors
     * 1) If itemId, storeId, and Qty commbo doesn't exist - add it as a "price" and "tprice" collection
     * 2) If itemId, storeId, and Qty combo EXIST 
     *    a) update "price" collection if startDate is greater than existing startsAt in "price" collection
     *    b) add or update "tprice" collection
     * 
     * @param itemId 
     * @param storeId 
     * @param startDate 
     * @param price 
     * @param quantity 
     */
    'addNewTempPrice'(itemId: string, storeId: string, startDate: number, price: number, quantity: number) {

        if (this.userId) {

            if (Roles.userIsInRole(Meteor.userId(), 'contractor')) {

                let currentDate = new Date().getTime();

                let priceInfo = getPriceMatch(itemId, storeId, quantity);

                let tpriceInfo = getTpriceMatch(itemId, storeId, quantity);

                // get itemInfo
                let itemInfo = Meteor.call('getItem', itemId, '');
                // console.log(itemInfo);
                if (itemInfo.length == 0) {
                    return { 
                        status: false,
                        error: 'ERROR: itemId does not exist: ' + itemId
                    }
                }

                // Determine pid so we can save it in Tprice -- uis pid from price collection if it exist
                let pid = '%%$$###$$@@!!!';
                if (priceInfo.status && tpriceInfo.status) {
                    if (priceInfo.data) {
                        pid = priceInfo.results[0]._id;
                    }
                    else {
                        pid = Random.id();
                    }
                }


                if (priceInfo.status && tpriceInfo.status) {
                    // Update or insert Tprice
                    if (tpriceInfo.data) {
                        // Tprice already exist, update
                        console.log(tpriceInfo.results);
                        let tprice = price / tpriceInfo.results[0].gsize;

                        let res = tpricesUpdate(tpriceInfo.results[0]._id, {
                            updated: currentDate,
                            submittedAt: currentDate,
                            submitterId: Meteor.userId(),
                            startsAt: startDate,
                            price: tprice,
                            status: 0
                        });

                        if(res.status) {
                            console.log('tpricesUpdate - Updated Tprice: ' + res.id);
                        }
                        else {
                            console.error(res.error);
                            return { 
                                status: false,
                                error: res.error
                             }
                        }
                    }
                    else {
                        // itemId, StoreId, Qty does not exit - insert new Tprice
                        let t = <Tprice>{};
                        t._id = Random.id();
                        t.priceId = pid;
                        t.itemId = itemId;
                        t.storeId = storeId;
                        t.submittedAt = currentDate;
                        t.submitterId = Meteor.userId();
                        t.updated = currentDate;
                        t.startsAt = startDate;
                        t.quantity = parseInt(quantity);
                        t.status = 0;

                        let gInfo = getGlobalSize(itemInfo[0].size, itemInfo[0].unit);
                        t.gsize = gInfo.gsize * quantity;
                        t.gunit = gInfo.gunit;
                        t.price = price / t.gsize;

                        // Create real prices 
                        let res = addNewTprice(t);

                        if(res.status) {
                            console.log('addNewTprice - Inserted new Tprice = ' + res.id);
                        }
                        else {
                            console.error(res.error);
                            return { 
                                status: false,
                                error: res.error
                             }
                        }
                    }

                }
                else {
                    return { 
                        status: false,
                        error: priceInfo.error + ' -- ' + tpriceInfo.error
                     }
                }

                return { status: true }
            }
        }
    },

    /**
     * 
     * @param options 
     * @param sort 
     * @param email 
     */
    'getMyTprices'(options: Object, sort: Object, email: string) {
        if (this.userId) {
            let uid = Meteor.userId();

            // Only allow custom email if Admin user
            if (email) {
                if  ( Roles.userIsInRole(Meteor.userId(), 'superadmin') )  {
                    let uInfo = getLocaUser(email);
                    uid = uInfo._id;
                }
            }

            let query = { 
                submitterId: uid,
                status: 0
            };

            let MongoClient = Npm.require('mongodb').MongoClient;
            let allResults = Promise.all([

                new Promise((resolve) => {

                    setTimeout(() => {

                        MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('tprices');
                                let count = collection.find(query).count();
                                // weird count is not available here but is available after it resolves in then(..)
                                resolve(count);
                            }
                        });
                    }, 1);
                }),


                new Promise((resolve) => {
                    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                        if (err) {
                            throw err;
                        } 
                        else {
                            let collection = db.collection('tprices');
                            collection.aggregate([
                                { $match: query },
                                { $lookup:
                                      {
                                        from: "stores",
                                        localField: "storeId",
                                        foreignField: "_id",
                                        as: "store_info"
                                      }
                                 },
                                 { $sort: sort }
                            ]).toArray(function (err, results) {
                                if (err) {
                                    console.error('ERROR 1 getMyTprices .. ');
                                    console.error(err);
                                    resolve(err);
                                } 
                                else {
                                    resolve(results);
                                }
                                db.close();
                            });
                        }
                    });
                
                }),

            ]);

            return allResults.then(x => {
                let res = {
                    pricesList: x[1],
                    total: x[0]
                };

                return res;
            });
        }
    },



    /**
     * Ensure user has to be logged in to delete
     * 
     * @param tid 
     */
    'deleteTprice'(tid: string) {
        if (Meteor.userId()) {
            // Create our future instance.
            let futureDel = new Future();

            let MongoClient = Npm.require('mongodb').MongoClient;
            MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                if (err) {
                    futureDel.return({
                        status: false,
                        error: err
                    });
                } else {
                    let collection = db.collection('tprices');
                    collection.deleteOne({ _id: tid }, function(err, result) {
                        if (err) {
                            futureDel.return({
                                status: false,
                                error: err
                            });
                        }
                        else {
                            futureDel.return({
                                status: true,
                                id: tid
                            }); 
                        }
                        db.close();
                    });
                }
            });

            return futureDel.wait();
        }
    },





});


// #######################################################################################

/**
 * 
 * @param uid 
 */
function funcGetStoresFromMyTprices(uid: string) {
    // Create our future instance.
    let futureU = new Future();

    let query = { 
        submitterId: uid,
        status: 0
    };

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            throw err;
        } 
        else {
            let collection = db.collection('tprices');

            collection.aggregate([
                { $match: query },
                { $group : { _id : "$storeId" } },
                { $lookup:
                    {
                      from: "stores",
                      localField: "_id",
                      foreignField: "_id",
                      as: "sp"
                    }
               },
            ]).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getSitemMatchesWSprices .. ');
                    console.error(err);
                    futureU.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    futureU.return({
                        status: true,
                        data: results
                    });
                }
                db.close();
            });
        }
    });

    return futureU.wait();
}

/**
 * 
 * @param uid 
 * @param storeId 
 */
function  funcGetMyTprices(uid: string, storeId: string) {
    // Create our future instance.
    let futureU = new Future();

    let query = { 
        submitterId: uid,
        status: 0,
        storeId: storeId,
    };

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            throw err;
        } 
        else {
            let collection = db.collection('tprices');
            collection.find(query).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 funcGetMyTprices .. ');
                    console.error(err);
                    futureU.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    futureU.return({
                        status: false,
                        data: results
                    });
                }
                db.close();
            });

        }
    });

    return futureU.wait();
}


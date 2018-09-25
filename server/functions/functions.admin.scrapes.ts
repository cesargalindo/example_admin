import { Random } from 'meteor/random';
import { Settings } from "../../both/collections/settings.collection";

import { addNewPrice, pricesUpdate, getPriceMatch } from '../functions/functions.admin.prices';
import { getItemMatch, itemsInsert } from '../functions/functions.admin.items';
import { getGlobalSize } from '../functions/functions.admin.misc';

import { Price } from '../../both/models/price.model';

let Future = Npm.require( 'fibers/future' );
let MONGO_URL = Meteor.settings.MONGO_URL;

/**
 * Add new item if Quantity is not equal to integer
 * Add/Update price
 * 
 * @param storeInfo 
 * @param newItemCache 
 * @param sizes 
 * @param units 
 * @param itemNames 
 * @param currentDate 
 * @param itemId 
 * @param pr 
 * @param m 
 */
export function addUpdatePriceFromTprice(storeInfo, newItemCache, sizes, units, itemNames, currentDate, itemId, pr, m) {

    // CHECK IF PRICEID-ITEMID-STOREID already exist
    // DO NOT USE -- ignore pr.quantity == prices[0].quantity 
    // USE quantity from mitem, if quantity not provided in mitem, default to 1

    let p = <Price>{};
    // if quantity is missing from mitem - use defualt value of 1 
    p.quantity = m.quantity;
    if (m.quantity == null) {
        p.quantity = 1;
    }

    let newQ = 1;
    let newSize = 0;

    // check if quantity is decimal
    // decimal quantities are allowed in items matches when manually entered by contractors
    // create a new items with adjusted size and quantity
    if (p.quantity % 1) {

        let r1 = 0;
        let res4 = '';
        // ################## calculate new size and quantity based on decimal quantity... ############ 
        if (p.quantity < 1) {
            newQ = 1;
            r1 = p.quantity;
            newSize = sizes[m.itemId] * p.quantity;
            // console.log('id ==== ' + m.itemId + ' newQ = ' + newQ + '  ,  r1 = ' + r1);
        }
        else {
            newQ = Math.trunc(p.quantity);
            r1 = p.quantity - newQ;
            newSize = sizes[m.itemId] * (p.quantity);
            // console.log('p.quantity=' + p.quantity + '  newQ= ' + newQ + '  r1=' + r1 + '  newSize = ' + newSize + " -- oldSize=" + sizes[m.itemId] + ' unit= ' +  units[m.itemId] );
        }


        // ################## check if newSize Qty units Item already exist ############ 
        if (newItemCache[itemNames[m.itemId] + ":" + newQ + ":" + newSize + ":" + units[m.itemId]]) {
            res4 = {
                status: true,
                data: [{
                    _id: newItemCache[itemNames[m.itemId] + ":" + newQ + ":" + newSize + ":" + units[m.itemId]]
                }]
            };
        }
        else {
            res4 = getItemMatch(itemNames[m.itemId], newQ, newSize, units[m.itemId]);
        }

        if (res4.status) {
            if (res4.data.length) {
                console.log('************* got BRAND NEW ITEM HERE 88888 .... ************** ' + res4.data[0]._id);
                console.log(m.itemId + ' ==== 88888 >>>> ' + itemNames[m.itemId] + ":" + newQ + ":" + newSize + ":" + units[m.itemId] + ' == ' + newItemCache[itemNames[m.itemId] + ":" + newQ + ":" + newSize + ":" + units[m.itemId]]);
                itemId = res4.data[0]._id;
            }
            else {
                console.log('************* INSERT BRAND NEW ITEM HERE 88888 .... **************');
                let res5 = Meteor.call('getItem', m.itemId, 0);
                let ii = res5[0];
                ii._id = Random.id();
                ii.created = new Date().getTime(); 
                ii.quantity = newQ;
                ii.size = newSize;
                ii = _.omit(ii,'upc');  // always omit to avoid duplicate upc

                let itemRes = itemsInsert(ii); 

                // To avoid delay when new data is available in Mongo - create a temp cache of new data
                newItemCache[itemNames[m.itemId] + ":" + newQ + ":" + newSize + ":" + units[m.itemId]] = itemRes.id

                console.log(m.itemId + ' =x=x=x 00 x=x= ' + itemRes.id);

                itemId = itemRes.id;
            }
        }

    }
    else {
        newQ = p.quantity;
        newSize = sizes[itemId];
    }

    // ################## create new prices or update existing prices ############ 

    let gInfo = getGlobalSize(newSize, units[m.itemId]);
    console.log(gInfo);
    p.gsize = gInfo.gsize * newQ;
    p.gunit = gInfo.gunit;
    p.price = pr.price / p.gsize;
    p.quantity = newQ;

    // Add or Update Price for each store using global scraped price
    storeInfo.data.map(s => {
        let res5 = addUpdatePriceFromScrapes('skip', itemId, s._id, newQ, pr, p, currentDate);
    });

    return {
        status: true,
        newIC: newItemCache
    }
}

/**
 * Update exsting prices from sitem info
 * 
 * @param sid 
 * @param itemId 
 * @param storeId 
 * @param newQ 
 * @param y 
 * @param p 
 * @param currentDate 
 */
export function addUpdatePriceFromScrapes(sid, itemId, storeId, newQ, y, p, currentDate) {

    let pInfo = getPriceMatch(itemId, storeId, newQ);

    if (pInfo.status) {

        if (pInfo.results[0]) {
            // Price already exist, update
            p._id = pInfo.results[0]._id;
            p.submittedAt = currentDate;
            p.updated = currentDate;
            p.soldOut = false;
            p.startsAt = y.startsAt;
            p.quantity = parseInt(p.quantity);

            if (sid != 'skip') {
                updateOneSitem(sid, { priceProcessed: true });
            }

            // update Price if startsAt is greater
            if (y.startsAt >= pInfo.results[0].startsAt) {

                // Update sitem to reflect price processed so we can exclude processed sitems
                // updateOneSitem(sid, { priceProcessed: true });

                // Updates fields: updated, submittedAt, price                                    
                let res = pricesUpdate(p);
                if(res.status) {
                    console.log('== >> == >> Updated price = ' + res.id);
                }
                else {
                    console.error(res.error);
                    return;
                }
            }
        }
        else {
            p._id = Random.id();
            p.itemId = itemId;
            p.storeId = storeId;
            p.note = 'scraped-price';
            p.soldOut = false;
            p.submittedAt = currentDate;
            p.updated = currentDate;
            p.expiresAt = 0;
            p.startsAt = y.startsAt;
            p.quantity = parseInt(p.quantity);

            // Update sitem to reflect price processed so we can exclude processed sitems
            if (sid != 'skip') {
                updateOneSitem(sid, { priceProcessed: true });
            }
            
            let res = addNewPrice(p);
            if(res.status) {
                console.log('== >> == >> Inserted new price = ' + res.id);
            }
            else {
                console.error(res.error);
            }
        }
    }
    else {
        console.error('ERROR:------------ PRICE NOT FOUND 2 --------------');
    }

}


/**
 * Retrieve sitem to item matches per store
 * 
 * @param store 
 */
export function getSitemMatchesWSprices(store: string) {
    
    // Create our future instance.
    let futureA = new Future();

    //  _id: { $in: [ "5ab2c0681cb9ba251029fa32", "5ab2bdab1cb9ba251029f975", "5ab2bcda1cb9ba251029f95b" ]},
    // Safeway  _id: { $in: [ "5af21ff6d0f082671ba15cf6", "5af21ff8d0f082671ba15dfc", "5af22004d0f082671ba1638c" ]},

    // Decimal Qty  _id: { $in: [ "5a9749e266c30359ee07923a" ]},
    // Decimal Qty  _id: { $in: [ "5a973dd3c6a7b6527365ebea", "5a9749e266c30359ee07923a", "5a974a0b66c30359ee0799b8", "5a974a1766c30359ee079bdd" ]},

    // tt exclude upcMatch = true  -- scraper 2 will handle UPC matches
    let query = {
            upcMatch: { $ne: true },
            chainName: store,
            status: { $ne: 9 },
            // _id: { $in: [ "5a973dd3c6a7b6527365ebea", "5a9749e266c30359ee07923a", "5a974a0b66c30359ee0799b8", "5a974a1766c30359ee079bdd" ] },
            'mitems.0.itemId': { $exists: true },
            // ###### filter by priceProcessed #### 
            priceProcessed: {$in: ['undefined', "null", null, false]}
        };


    // Skip previously processed SITEMS
    let info = Settings.find({
        chainName: store
    }).fetch();


    // Settings for SITEM exist in ZoJab's Admin db
    if (info.length) {
        query = {
            upcMatch: { $ne: true },
            chainName: store,
            status: { $ne: 9 },
            'mitems.0.itemId': { $exists: true },
            updatedAt: { $gt: info[0].scrapedAt },
            priceProcessed: {$in: ['undefined', "null", null, false]}
        };
    }

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureA.return({
                status: false,
                error: err
            });
            return {
                status: false,
                error: err
            }
        } 
        else {

            let collection = db.collection('sitems');
            collection.aggregate([
                { $match: query },
                { $lookup:
                      {
                        from: "sprices",
                        localField: "_id",
                        foreignField: "sitem",
                        as: "sp"
                      }
                 },
            ]).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getSitemMatchesWSprices .. ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    console.log('&&&&&&&&&&&&&&&&&&&&&&&& getSitemMatchesWSprices &&&&&&&&&&&&&&&&&&&&&&&& ==> ' + _.size(results));
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
 * Retrieve sitem to item matches per store
 * 
 * @param store 
 */
export function getSitemMatches(store: string) {
    
    // Create our future instance.
    let futureA = new Future();

    let query = {
            chainName: store,
            status: { $ne: 9 },
        //     _id: { $in: [ "5af21ff6d0f082671ba15cf6", "5af21ff8d0f082671ba15dfc", "5af22004d0f082671ba1638c" ]},
            'mitems.0.itemId': { $exists: true }
        };


    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureA.return({
                status: false,
                error: err
            });
            return {
                status: false,
                error: err
            }
        } 
        else {
            let collection = db.collection('sitems');
            collection.find(query).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1: pull getSitemMatches ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    console.log(store + ' -------- got my getSitemMatches ------- ' + results.length);
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
 * @param chainName 
 */
export function findMissingItemsUPC(chainName) {
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

            collection.find({ 
                chainName: chainName,
                upcMatch: true,
            }).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 findMissingItemsUPC ' + chainName);
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else {
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
 * Update sitem - id and query 
 * Syncronous Update
 * 
 * @param id 
 * @param setQuery 
 */
export function updateOneSitem(id: string, setQuery: object) {
    // Create our future instance.
    let futureB = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureB.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('sitems');
            collection.updateOne({
                _id: id
            }, 
            {
                $set: setQuery
            }, 
            function(err, res) {
                if (err) {
                    console.error('ERROR 1: unable to update Sitem ');
                    console.error(err);
                    futureB.return({
                        status: false,
                        error: err
                    });
                } 
                else if (res.result.nModified) {
                    // console.log(id + '-- UPDATED -- SET:' + setQuery);
                    futureB.return({
                        status: true,
                    });
                }
                else {
                    // console.error('ERROR2 :unable to update Sitem ' + id + ' == ' + setQuery);
                    futureB.return({
                        status: false,
                        error: 'ERROR2 :unable to update Sitem ' + id + ' == ' + setQuery
                    });
                }
                db.close();
            });
        }
    });

    return futureB.wait();
}


/**
 * Get sitems valid and invalid
 * 
 * @param valid 
 */
export function getSitemsCountValidSprices(valid: boolean) {
    // Create our future instance.
    let futureB = new Future();

    // ########## chainname ########
    let query = {};
    if (valid) {
        query = {
            // chainName: "Safeway",
            validSprice: true
        };
    }
    else {
        query = {
            // chainName: "Safeway",
            validSprice: { $in: ['undefined', null, 'infinity', false] }
        };
    }

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            futureB.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('sitems');
            collection.count(query,
            function(err, count) {
                if (err) {
                    console.error('ERROR getSitemsCountValidSprices ... ');
                    console.error(err);
                    futureB.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    console.log('&&&&&&&&&&&& COUNT &&&&&&&&&&& ' + count);
                    futureB.return({
                        status: true,
                        count: count
                    });
                }

                db.close();
            });
        }
    });

    return futureB.wait();
}

/**
 * 
 * @param id 
 */
export function getSitem(id: string) {
    
    // Create our future instance.
    let futureA = new Future();

    let query = {
            _id: id,
        };


    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureA.return({
                status: false,
                error: err
            });
            return {
                status: false,
                error: err
            }
        } 
        else {
            let collection = db.collection('sitems');
            collection.find(query).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1: pull getSitemMatches ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    futureA.return({
                        status: true,
                        data: results[0]
                    });
                }
                db.close();
            });
        }
    });

    return futureA.wait();
}
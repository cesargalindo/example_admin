import { Meteor } from 'meteor/meteor';
import { ScrapeItem } from '../../both/models/scrapeitem.model';

import { getSitemMatchesWSprices, getSitemsCountValidSprices, addUpdatePriceFromScrapes, addUpdatePriceFromTprice, updateOneSitem  } from '../functions/functions.admin.scrapes';
import { getStorebyGID, getStorebyStorechain } from '../functions/functions.admin.stores';
import { getGlobalSize } from '../functions/functions.admin.misc';
import { duplicatesUpdate } from '../functions/functions.admin.duplicates';
import { getItemMatch, itemsInsert, getItemMatches, ddpItemsUpdate } from '../functions/functions.admin.items';

import { Price } from '../../both/models/price.model';

import { Random } from 'meteor/random';

// npm install fs
let fs = require('fs');
let Future = Npm.require( 'fibers/future' );
let MONGO_URL = Meteor.settings.MONGO_URL;

// ######  Apollo setup ###### ss 
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';
let fetch = require('node-fetch');
global.fetch = fetch;

let client = new ApolloClient({
    link: new HttpLink({ uri: Meteor.settings.public.GRAPHQL_URL }),
    cache: new InMemoryCache()
});

const updateSitemsUPCMatchApollo = gql`
    query MyItems2($chainName: String, $options: String) {
        apScrapeItems2ByChainUpdate(chainName: $chainName, options: $options) {
            _id
            itemT {
                _id
            }
        }
    }
`;

const getScrapeItems2ByChain = gql`
    query MyItems3($status: Int, $options: String) {
        apScrapeItems2ByChain(status: $status, options: $options) {
            _id
            upcMatch
            validSprice
            status
            prices {
                _id
                price
            }
        }
    }
`;


Meteor.methods({


    /**
     * Update sitems with upcMatch: true  if existing item exist with matching UPC
     * 
     * @param chainName 
     * @param total 
     */
    'updateSitemsUPCMatch'(chainName, total) {
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            let loops =  Math.ceil( total / 300 );
            for (let i = 1; i <= loops; i++) {
    
                let options = {
                    limit: 300,
                    skip: (i - 1) * 300,
                };
    
                let serializeOptions = JSON.stringify(options);
    
                let foo = funcUpdateSitemsUPCMatch(chainName, serializeOptions);
            }

            return { status: true }
        }
    },


    /**
     * Remove duplicate item from sitem and duplicate entry
     * If duplicate entry contains 1 entry, set status = 21 - marked as done...
     * 
     * @param d_id 
     * @param si_id 
     * @param i_id 
     * @param cnt 
     */
    'removeDupItemFromSitem'(d_id: string, si_id: string, i_id: string, cnt: number) {
        let res1 = deleteItemFromSitem(si_id, i_id);
        // console.error(res1);

        let res2 = deleteSitemFromDup(d_id, si_id);
        // console.error(res2);
        
        // If we are down to 2 duplicate items, close duplicate collection
        if (cnt < 3) {
            duplicatesUpdate(d_id, { status: 21});
        }

        return { status: true };
    },


    /**
     * Create prices for Items matched to Scraped items - Global Prices
     * If we have a decimal quanity - re-cacluate new size and check if item, price exist
     * If not create a new item, excluding UPC
     * 
     * 
     * @param store 
     */
    'processGlobalScrapedMatches'(store: string) {
        let newItemCache = {};
        // let storeIds = {};
        let sizes = {};
        let units = {};
        let itemNames = {};
        let currentDate = new Date().getTime();

        let matches = getSitemMatchesWSprices(store);

        // get list of stores for store Chain name
        let storeInfo = getStorebyStorechain(store);

        if (matches.status) {

            matches.data.map(si => {

                let PRICES = si.sp;

                PRICES.map(pr => {
                    // If price doesn't have a startsAt, set it = currentDate
                    if (pr.startsAt == undefined) {
                        pr.startsAt = currentDate
                    }
                    
                    // ########## Loop through mitems  ###########
                    si.mitems.map(m => {
                        
                        if (sizes[m.itemId] == undefined) {
                            // Get item info - size, unit
                            let res3 = Meteor.call('getItem', m.itemId, 0);
                            if (res3.length) {
                                console.log(res3[0].size + ' ===0=== ' +  m.itemId + ' ===0=== ' + res3[0].unit);
                                sizes[m.itemId] = res3[0].size;
                                units[m.itemId] = res3[0].unit;
                                itemNames[m.itemId] = res3[0].name;
                            }
                            else {
                                console.error("this item doesn't exist - " + m.itemId);
                                return;
                            }
                        }

                        // Update sitem to reflect price processed so we can exclude processed sitems
                        updateOneSitem(si._id, { priceProcessed: true });

                        // ################ updating from Scraped price here - not tprice #############
                        let res22 = addUpdatePriceFromTprice(storeInfo, newItemCache, sizes, units, itemNames, currentDate, m.itemId, pr, m);

                        // Update cache
                        newItemCache = res22.newIC;
                        
                    });         // si.mitems.map

                });         // PRICES.map 

            });         // matches.data.map

            return { status: true }
        }
        else {
            console.error('###################### processScrapedMatches ###################');
            return {
                status: false,
                error: "No matches found"
            }
        }
    },


    /**
     * Create prices for Items matched to Scraped items
     * If we have a decimal quanity - re-cacluate new size and check if item, price exist
     * If not create a new item, excluding UPC
     * 
     * @param store 
     */
    'processScrapedMatches'(store: string) {
        let newItemCache = {};
        let storeIds = {};
        let sizes = {};
        let units = {};
        let itemNames = {};
        let currentDate = new Date().getTime();

        let matches = getSitemMatchesWSprices(store);  

        if (matches.status) {

            matches.data.map(si => {

                let PRICES = '';
                if (si.sp.length) {
                    // New format
                    PRICES = si.sp;
                }
                else {
                    // Skip Safeway old prices array - has lots of issues
                    if (store != 'Safeway') {
                        // Old format - use old prices, eventually delete old structure all together
                        PRICES = si.prices;
                    }
                }

                if (PRICES != '') {
                    PRICES.map(pr => {
                        if (storeIds[pr.gid] == undefined) {
                            // ss Get store info - _id
                            
                            console.log('gid = ' + pr.gid); 
                            
                            let sInfo = getStorebyGID(pr.gid);
                            if (sInfo.status) {
                                // console.log(sInfo.data);
                                storeIds[pr.gid] = sInfo.data._id;
                            }
                            else {
                                console.error('###################### getStorebyGID ###################');
                                console.error(sInfo.error);
                            }
                        }
    
                        // If price doesn't have a startsAt, set it = currentDate
                        if (pr.startsAt == undefined) {
                            pr.startsAt = currentDate
                        }
                        
                        // ########## Loop through mitems  ########### 
                        si.mitems.map(m => {
                            let itemId = m.itemId;
    
                            // console.log(z);
                            if (sizes[m.itemId] == undefined) {
                                // Get item info - size, unit
                                let res3 = Meteor.call('getItem', m.itemId, 0);
                                if (res3.length) {
                                    sizes[m.itemId] = res3[0].size;
                                    units[m.itemId] = res3[0].unit;
                                    itemNames[m.itemId] = res3[0].name;
                                }
                                else {
                                    console.error("this item doesn't exist - " + m.itemId);
                                    return;
                                }
                            }
    
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
                                }
                                else {
                                    newQ = Math.trunc(p.quantity);
                                    r1 = p.quantity - newQ;
                                    newSize = sizes[m.itemId] * (p.quantity);
                                }
    
    
                                // ################## check if newSize Qty units Item already exist ############ g
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
                                    console.log(res4.data.length);
    
                                    if (res4.data.length) {
                                        itemId = res4.data[0]._id;
                                    }
                                    else {
                                        let res5 = Meteor.call('getItem', m.itemId, 0);
                                        let ii = res5[0];
                                        ii._id = Random.id();
                                        ii.created = new Date().getTime(); 
                                        ii.quantity = newQ;
                                        ii.size = newSize;
                                        // always omit to avoid duplicate upc
                                        ii = _.omit(ii,'upc');  
    
                                        let itemRes = itemsInsert(ii); 
    
                                        // To avoid delay when new data is available in Mongo - create a temp cache of new data
                                        newItemCache[itemNames[m.itemId] + ":" + newQ + ":" + newSize + ":" + units[m.itemId]] = itemRes.id
    
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
                            p.gsize = gInfo.gsize * newQ;
                            p.gunit = gInfo.gunit;
                            p.price = pr.price / p.gsize;
                            p.quantity = newQ;
    
                            let res5 = addUpdatePriceFromScrapes(si._id, itemId, storeIds[pr.gid], newQ, pr, p, currentDate);
    
                        });         // si.mitems.map
    
                    });         // PRICES.map 
                }


            });         // matches.data.map

            return { status: true }
        }
        else {
            console.error('###################### processScrapedMatches ###################');
            return {
                status: false,
                error: "No matches found"
            }
        }

    },


    /**
     * Replace image containing invalid/missing with default google no_image.gif
     * 
     */
    'replaceBogusImagesItems'() {
        // Create our future instance.
        let futurePull = new Future();

        let MongoClient = Npm.require('mongodb').MongoClient;
        MongoClient.connect(MONGO_URL, function (err, db) {
            if (err) {
                console.error(err);
                futurePull.return({
                    status: false,
                    error: err
                });
            } else {
                let collection = db.collection('items');

                // Update a multiple items
                collection.update({ 
                    image: { $regex: "100616_", $options: "i"}
                },
                { "$set": {
                        "image": "https://storage.googleapis.com/medium300x/no/no_image.gif"
                    }
                },
                {
                    multi: true
                },
                function(err, res) {
                    console.log(res.result);
                    if (err) {
                        console.error('ERROR unable to update image ... ');
                        console.error(err);
                        futurePull.return({
                            status: false,
                            error: err
                        });
                    } 
                    else if (res.result.nModified) {
                        futurePull.return({
                            status: true,
                            msg: 'updated items '
                        }); 
                    }
                    else {
                        console.error('ERROR2 : pull sitem from duplicates - NOT FOUND ');
                        futurePull.return({
                            status: false,
                            error: 'faile to update item image - '
                        });
                    }
                });
            }
        });

        return futurePull.wait();

    },

    /**
     * 
     */
    'updateValidSprice'() {

        let total = 0;
        let result1 = getSitemsCountValidSprices(false);
        if (result1.status) {
            total = result1.count;

            let loops =  Math.ceil( total / 100 );
            for (let i = 1; i <= loops; i++) {
    
                let options = {
                    limit: 100,
                    skip: (i - 1) * 100,
                };
                let serializeOptions = JSON.stringify(options);
                let res2 = getSitemsValidSprices(111, serializeOptions);

                // console.log(foo.data);
                res2.data.map( x => {
                    if (x.prices.length) {
                        let res3 = updateSitemsValidSprices(x._id, true)
                    }
                })
            }

        }

        return { status: true }
    },

    /**
     * Update sprice with invalid mitems entries
     */
    'fixInvalidSprice'() {
        let total = 0;
        let result1 = getSitemsCountValidSprices(true);
        if (result1.status) {
            total = result1.count;

            let loops =  Math.ceil( total / 100 );
            for (let i = 1; i <= loops; i++) {
    
                let options = {
                    limit: 100,
                    skip: (i - 1) * 100,
                };
                let serializeOptions = JSON.stringify(options);
                let res2 = getSitemsValidSprices(222, serializeOptions);

                // console.log(foo.data);
                res2.data.map( x => {
                    if (x.prices.length) {
                        // got a valid price, leave validSprice = true
                    }
                    else {
                        let res3 = updateSitemsValidSprices(x._id, false)
                    }
                })
            }

        }

        return { status: true }
    },


    /**
     * Fix invalid item images
     */
    'fixInvalidImagePath'() {
        let result = getItemMatches();
        if (result.status) {
            result.data.map( x => {
                // console.log(x.image);
                // https://images-ff-original.s3.us-west-2.amazonaws.com/5ba29812c125164705e5f3d0.png
                // https://s3-us-west-2.amazonaws.com/images-ff-resized/125x/5ba29998c125164705e60b80.png
                let newImage = x.image.replace(/images-ff-original.s3.us-west-2.amazonaws.com/g, 's3-us-west-2.amazonaws.com/images-ff-resized/125x' );                    
                
                x.image = newImage;
                let res3 = ddpItemsUpdate(x);
            })
        }

        return { status: true }
    },


    /**
     * Update sitem note
     */
    'updateSitemNote'(note: string, itemId: string) {
        console.log(itemId + ' -- ' + note);
        let MongoClient = Npm.require('mongodb').MongoClient;
        let promise = new Promise((resolve) => {
            MongoClient.connect(MONGO_URL, function (err, db) {
                if (err) {
                    resolve({
                        status: false,
                        error: err
                    });
                } else {
                    let collection = db.collection('sitems');
    
                    collection.updateOne({
                        _id: itemId
                    }, {
                        $set: { 
                            note: note
                        }
                    }, function(err, res) {
                        console.log(res.result);

                        if (err) {
                            console.error(err);
                            resolve({
                                status: false,
                                error: err
                            });
                        } 
                        else if (res.result.nModified) {
                            resolve({
                                status: true,
                                msg: 'updated sitem ' + itemId
                            });
                        }
                        else {
                            console.error('ERROR2 : updateSitemNote : sitemId not found ' + itemId);
                            resolve({
                                status: false,
                                error: 'update failed - updateSitemNote - sitem NOT FOUND - ' + itemId
                            });
                        }

                        // close db connection
                        db.close();                        
                    });
                }
            });

        });

        return promise.then(x => {
            return x;
        });
    },


    /**
     * Update sitem status
     */
    'updateSitemStatus'(status: number, itemId: string) {
        console.log(itemId + ' -- ' + status);
        let MongoClient = Npm.require('mongodb').MongoClient;
        let promise = new Promise((resolve) => {
            MongoClient.connect(MONGO_URL, function (err, db) {
                if (err) {
                    resolve({
                        status: false,
                        error: err
                    });
                } else {
                    let collection = db.collection('sitems');
    
                    collection.updateOne({
                        _id: itemId
                    }, {
                        $set: { 
                            status: status
                        }
                    }, function(err, res) {
                        console.log(res.result);

                        if (err) {
                            console.error('ERROR 1: unable to update sitem ');
                            console.error(err);
                            resolve({
                                status: false,
                                error: err
                            });
                        } 
                        else if (res.result.nModified) {
                            resolve({
                                status: true,
                                msg: 'updated sitem ' + itemId
                            });
                        }
                        else {
                            console.error('ERROR2 : sitemId not found ' + itemId);
                            resolve({
                                status: false,
                                error: 'update failed - sitem NOT FOUND - ' + itemId
                            });
                        }

                        // close db connection
                        db.close();
                    });
                }
            });

        });

        return promise.then(x => {
            return x;
        });
    },


    /**
     * Update Item name
     */
    'updateItemName'(name: string, itemId: string) {
        console.log(itemId + ' -- ' + name);
        let MongoClient = Npm.require('mongodb').MongoClient;
        let promise = new Promise((resolve) => {
            MongoClient.connect(MONGO_URL, function (err, db) {
                if (err) {
                    resolve({
                        status: false,
                        error: err
                    });
                } else {
                    let collection = db.collection('items');
    
                    collection.updateOne({
                        _id: itemId
                    }, {
                        $set: { 
                            name: name
                        }
                    }, function(err, res) {
                        if (err) {
                            console.error('ERROR 1: unable to update Item ' + itemId);
                            console.error(err);
                            resolve({
                                status: false,
                                error: err
                            });
                        } 
                        else if (res.result.nModified) {
                            resolve({
                                status: true,
                                msg: 'updated item ' + itemId
                            });
                        }
                        else {
                            console.error('ERROR2 : updateItemName : itemId not found ' + itemId);
                            resolve({
                                status: false,
                                error: 'update failed - updateItemName - item NOT FOUND - ' + itemId
                            });
                        }

                        // close db connection
                        db.close();
                    });
                }
            });

        });

        return promise.then(x => {
            return x;
        });
    },



    /**
     * Update ScrapeItem - remove selected item
     * 
     */
    'scrapedItem.pull'(scrapeId: string, itemId: string) {

        let MongoClient = Npm.require('mongodb').MongoClient;
        let promise = new Promise((resolve) => {

            MongoClient.connect(MONGO_URL, function (err, db) {
                if (err) {
                    resolve({
                        status: false,
                        error: err
                    });
                } else {
                    let collection = db.collection('sitems');
    
                    // Update a single item
                    collection.update({
                        _id: scrapeId,
                        "mitems.itemId": itemId
                    }, 
                    {
                        $pull: { mitems: { itemId: itemId } }
                    }, 
                    function(err, res) {
                        if (err) {
                            console.error('ERROR 1: pull strapItem ');
                            console.error(err);
                            resolve({
                                status: false,
                                error: err
                            });
                        } 
                        else if (res.result.nModified) {
                            resolve({
                                status: true,
                                msg: 'pull strapItem ' + scrapeId
                            });
                        }
                        else {
                            console.error('ERROR2 : pull strapItem - NOT FOUND ');
                            resolve({
                                status: false,
                                error: 'pull update failed - NOT FOUND - ' + scrapeId
                            });
                        }

                        // close db connection
                        db.close();
                    });
                }
            });

        });

        return promise.then(x => {
            return x;
        });
    },


    /**
     * Update ScrapeItem - add selected item
     * 
     */
    'scrapedItem.push'(scrapeId: string, itemId: string, qty: number) {
        // When updating "$push" it wraps paid in an array  [ ], if I paids.push(paid), it wraps it in a nested arrays [ [  ] ]
        let info = {};
        if (qty != 1) {
            info = {
                itemId: itemId,
                created: new Date().getTime(),
                quantity: qty
            };
        }
        else {
            info = {
                itemId: itemId,
                created: new Date().getTime()                
            };
        }

        let mitem:mitem = info;

        let MongoClient = Npm.require('mongodb').MongoClient;
        let promise = new Promise((resolve) => {

            MongoClient.connect(MONGO_URL, function (err, db) {
                if (err) {
                    resolve({
                        status: false,
                        error: err
                    });
                } else {
                    let collection = db.collection('sitems');
    
                    // Update a single item
                    collection.updateOne({
                        _id: scrapeId,
                        "mitems.itemId": { $ne: itemId }
                    }, 
                    {
                        $push: {
                            mitems: mitem
                        }
                    }, 
                    function(err, res) {
                        if (err) {
                            console.error('ERROR 1: push strapItem ');
                            console.error(err);
                            
                            resolve({
                                status: false,
                                error: err
                            });
                        } 
                        else if (res.modifiedCount) {
                            resolve({
                                status: true,
                                msg: 'push strapItem ' + scrapeId
                            });
                        }
                        else {
                            console.error('ERROR 2: push strapItem - NOT FOUND ' + scrapeId);
                            resolve({
                                status: false,
                                error: 'push update failed - not found - ' + scrapeId
                            });
                        }

                        // close db connection
                        db.close();
                    });
                }
            });

        });

        return promise.then(x => {
            console.log('-- this is my scraped item entity...');
            // console.log(x);
            return x;
        });
    },


    /** 
     * Replace item name synonyms with default name
    */
    'updateItemsSynonyms'() {

        if (this.userId) {
            let array = fs.readFileSync( Assets.absoluteFilePath("synonyms.csv") , 'ascii').toString().split("\r");

            for (let i = 0; i < array.length; i++) {
                let p0 = '';

                let res0 = array[i].replace(/"/g, '@@');                    // replace " with @@
                res0 = res0.replace(/@@{1}(.*?)(,?)@@{1}/g, '$1:$2:');      // replace , with :,:
                res0 = res0.replace(/::/g, '');                             // replace :: with NOTHING
                res0 = res0.replace(/:,:/g, ':#:');                         // replace :,: with :#:
                let res = res0.split(",");
                
                if (res[1] && (res[1] != ',')) {
                    p0 = res[0].replace(/^\s+|\s+$/g, "");
                    p0 = p0.replace(/:#:/g, ",");
                    res[1] = res[1].replace(/:#:/g, ",");
                    
                    // let xresult = processItemSynonyms(',', "MAIN TERM");
                    let xresult = processItemSynonyms(p0, res[1]);
                    if (res[2]) {
                        res[2] = res[2].replace(/:#:/g, ",");
                        let xresult = processItemSynonyms(p0, res[2]);
                        if (res[3]) {
                            res[3] = res[3].replace(/:#:/g, ",");
                            let xresult = processItemSynonyms(p0, res[3]);
                            if (res[4]) {
                                res[4] = res[4].replace(/:#:/g, ",");
                                let xresult = processItemSynonyms(p0, res[4]);
                                if (res[5]) {
                                    res[5] = res[5].replace(/:#:/g, ",");
                                    let xresult = processItemSynonyms(p0, res[5]);
                                }
                            }                                
                        }
                    }
                }
            }

            return { status: true }
        }
    },


    /**
     * remove misc html code, symbols, etc from name of SITEMS
     */
    'sanitizeSitems'() {
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            let foo = sanitizeSitemsData();
            if (foo.status) {
                return { status: true }
            }
            else {
                return { status: false }
            }

        }
    },


    /** 
     * Replace item name synonyms with default name
     * Clean up sitems
    */
   'updateSitemsSynonyms'() {
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {

            let array = fs.readFileSync( Assets.absoluteFilePath("synonyms.csv") , 'ascii').toString().split("\r");
            for (let i = 0; i < array.length; i++) {
                let p0 = '';

                let res0 = array[i].replace(/"/g, '@@');                    // replace " with @@
                // console.log('__1__ ' + res0);
                res0 = res0.replace(/@@{1}(.*?)(,?)@@{1}/g, '$1:$2:');      // replace , with :,:
                // console.log('__2__ ' + res0);
                res0 = res0.replace(/::/g, '');                             // replace :: with NOTHING
                // console.log('__3__ ' + res0);
                res0 = res0.replace(/:,:/g, ':#:');                         // replace :,: with :#:
                // console.log('__4__ ' + res0);
                
                let res = res0.split(",");
                
                if (res[1] && (res[1] != ',')) {
                    p0 = res[0].replace(/^\s+|\s+$/g, "");
                    p0 = p0.replace(/:#:/g, ",");
                    res[1] = res[1].replace(/:#:/g, ",");

                    let xresult = processSitemSynonyms(p0, res[1]);
                    if (res[2]) {
                        res[2] = res[2].replace(/:#:/g, ",");
                        let xresult = processSitemSynonyms(p0, res[2]);
                        if (res[3]) {
                            res[3] = res[3].replace(/:#:/g, ",");
                            let xresult = processSitemSynonyms(p0, res[3]);
                            if (res[4]) {
                                res[4] = res[4].replace(/:#:/g, ",");
                                let xresult = processSitemSynonyms(p0, res[4]);
                                if (res[5]) {
                                    res[5] = res[5].replace(/:#:/g, ",");                                    
                                    let xresult = processSitemSynonyms(p0, res[5]);
                                }
                            }                                
                        }
                    }
                }
             }
        }

        return { status: true }
    },


    /**
     *  Insert a new ScrapeItem
     * 
     * @param si 
     */
    'insertScrapeItem'(si: ScrapeItem) {

        if (this.userId) {

            let owner = Meteor.userId();

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

                        let collection = db.collection('sitems');
                        // ww Insert scrapedItem - include _id string, otherwise _id is installed as uint8
                        //https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string

                        // si._id = 'msZtwwqP6KzE8ZTPf';  // use this to force an error - existing id
                        si._id = Random.id();                        
                        si.created = new Date().getTime();
                        si.owner = owner;

                        collection.insertOne(si, function(err, res) {

                            if (res.insertedCount) {
                                console.log('############## Inserted ScrapeItem ID= ' + res.insertedId);

                                // Let's close the db -- don't close until you receive the results...
                                resolve(res);
                            }
                            else {
                                resolve({
                                    status: false,
                                    error: 'scrapeItem insert failed - ' + si.name
                                });
                            }

                            db.close();

                        });

                    }
                });
            });

            return promise.then(x => {
                return x;
            });

        }
    },

    /**
     * Get Sprice entry
     * 
     * @param id 
     */
    'getSPrice'(id) {
        // Create our future instance.
        let futureA = new Future();

        let MongoClient = Npm.require('mongodb').MongoClient;
        MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
            if (err) {
                console.log(err);
                futureA.return({
                    status: false,
                    error: err
                });
            } 
            else {
                // Update a single item
                let collection = db.collection('sprices');
                collection.find({
                    sitem: id
                }).toArray(function (err, results) {
                    if (err) {
                        console.error('ERROR 1: pull strapItem ');
                        console.error(err);
                        futureA.return({
                            status: false,
                            error: err
                        });
                    } 
                    else {
                        console.log(results);
                        futureA.return({
                            status: true,
                            price: results[0].price
                        });
                    }
                    db.close();
                });

            }
        });

        return futureA.wait();
    }


});

// #######################################################################################

/**
 * 
 * @param id 
 * @param status 
 */
function  updateSitemsValidSprices(id: string, status: boolean) {
    // Create our future instance.
    let futureUp = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            console.log(err);
            futureUp.return({
                status: false,
                error: err
            });
        } 
        else {
            // Update status of sitems
            let collection = db.collection('sitems');
            collection.updateOne({
                    _id: id
                }, 
                {
                    $set: {
                        validSprice: status
                    }
                }, 
                function(err, res) {
                    if (err) {
                        console.error(err);
                        futureUp.return({
                            status: false,
                            error: err
                        });
                    }
                    else {
                        futureUp.return({
                            status: true,
                        });
                    }
                    db.close();
                    
                });
        }
    });

    return futureUp.wait();
}

/**
 * 
 * @param status 
 * @param serializeOptions 
 */
function  getSitemsValidSprices(status, serializeOptions) {
    // Create our future instance.
    let futureU = new Future();

    client.query({
        query: getScrapeItems2ByChain,
        variables: {
            status: status,
            options: serializeOptions
        },
    }).then((results) => {
            futureU.return({
                status: true,
                data: results.data.apScrapeItems2ByChain
            });

        }).catch((error) => {
            console.log('there was an error with getSitemsValidSprices -- ', error);
            futureU.return({
                status: false,
                error: error
            });
    });
    return futureU.wait();
}


/**
 * Apollo Query will set upcMatch = true for sitems if UPC match is found 
 * 
 * @param chainName 
 * @param serializeOptions 
 */
function  funcUpdateSitemsUPCMatch(chainName, serializeOptions) {
    // Create our future instance.
    let futureU = new Future();

    client.query({
        query: updateSitemsUPCMatchApollo,
        variables: {
            chainName: chainName,
            options: serializeOptions
        },
    }).then((results) => {
            futureU.return({
                status: true,
            });

        }).catch((error) => {
            console.log('there was an error with updateSitemsUPCMatchApollo', error);
            futureU.return({
                status: false,
                error: error
            });
    });
    return futureU.wait();
}



/**
 * Delete item from "mitem" object in Sitem
 * 
 * @param si_id 
 * @param i_id 
 */
function deleteItemFromSitem(si_id, i_id) {

    // Create our future instance.
    let futurePull = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            console.error(err);
            futurePull.return({
                status: false,
                error: err
            });
        } else {
            let collection = db.collection('sitems');

            // Update a single item
            collection.update({
                _id: si_id,
                "mitems.itemId": i_id
            }, 
            {
                $pull: { mitems: { itemId: i_id } }
            }, 
            function(err, res) {
                console.log(res.result);
                if (err) {
                    console.error('ERROR 1: pull strapItem ');
                    console.error(err);
                    futurePull.return({
                        status: false,
                        error: err
                    });
                } 
                else if (res.result.nModified) {
                    futurePull.return({
                        status: true,
                        msg: 'pull strapItem ' + si_id + ' -- ' + i_id
                    }); 
                }
                else {
                    console.error('ERROR2 : pull strapItem - NOT FOUND ');
                    futurePull.return({
                        status: false,
                        error: 'pull update failed - NOT FOUND - ' + si_id + ' -- ' + i_id
                    });
                }
            });
        }
    });

    return futurePull.wait();
}

/**
 * Delete sitem form duplicates collection
 * 
 * @param d_id 
 * @param si_id 
 */
function deleteSitemFromDup(d_id, si_id) {

    // Create our future instance.
    let futurePull = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            console.error(err);
            futurePull.return({
                status: false,
                error: err
            });
        } else {
            let collection = db.collection('duplicates');

            // Update a single item
            collection.update({
                _id: d_id
            }, 
            {
                $pull: { dupitems: { sitemId: si_id } }
            }, 
            function(err, res) {
                console.log(res.result);
                if (err) {
                    console.error('ERROR 1: pull strapItem ');
                    console.error(err);
                    futurePull.return({
                        status: false,
                        error: err
                    });
                } 
                else if (res.result.nModified) {
                    futurePull.return({
                        status: true,
                        msg: 'pull Sitem ' + si_id + ' -- ' + d_id
                    }); 
                }
                else {
                    console.error('ERROR2 : pull sitem from duplicates - NOT FOUND ');
                    futurePull.return({
                        status: false,
                        error: 'pull update failed - NOT FOUND - ' + si_id + ' -- ' + d_id
                    });
                }
            });
        }
    });

    return futurePull.wait();
}

// #######################################################################################

/**
 * Parent function: Update item name with synonym names terms in csv file
 * 1) getItemsSynonymsMatches1
 * 2) updateItemsSynonyms2
 * 
 * 
 * @param p0 
 * @param p1 
 */
function processItemSynonyms(p0, p1) {
    p1 = p1.replace(/^\s+|\s+$/g, "");
    p1 = p1.replace(/\./g, "\\.");    
    let matches = getItemsSynonymsMatches1(p1);
    console.log( matches.data.length + '==' + p0 + '============-ITEM-==============' + p1 + '==');
    matches.data.map(x => {
        let pp = new RegExp(p1, 'gi');
        x.name = x.name.replace(pp, p0);
        let res3 = updateItemsSynonyms2(x);
    });

    return;
}

/**
 * Get items that match terms in csv file
 * 
 * 
 * @param name1 
 */
function getItemsSynonymsMatches1(name1: string) {
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
            let foo = name1 + ' ';  // add a word boundary at end

            let collection = db.collection('items');
            collection.find({
                name: {$regex: foo, '$options': 'i'}
            }).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1: pull strapItem ');
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
 * Update item with new default term in csv file
 * 
 * @param item 
 */
function updateItemsSynonyms2(item: object) {
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
            let collection = db.collection('items');
            collection.updateOne({
                _id: item._id
            }, 
            {
                $set: { name: item.name }
            }, 
            function(err, res) {
                if (err) {
                    console.error('ERROR 1: unable to update item name ');
                    console.error(err);
                    futureB.return({
                        status: false,
                        error: err
                    });
                } 
                else if (res.result.nModified) {
                    futureB.return({
                        status: true,
                    });
                }
                else {
                    console.error('ERROR2 :unable to update item name- ' + item.name);
                    futureB.return({
                        status: false,
                        error: 'ERROR2 :unable to update item name- ' + item.name
                    });
                }
                db.close();
            });
        }
    });

    return futureB.wait();
}

// ######################################################################################

/**
 * Sanitize sitems with 
 * 1) default category
 * 2) size unit info for Winco - used to assist when manually matching
 * 3) Remove crap from name - Minute® ,  Honey-Comb&#174;, etc.
 * 
 */
function sanitizeSitemsData() {
    // Create our future instance.
    let futureS = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureS.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('sitems');

            // ######### query 1 - convert Walmart field category from an array to a string #########
            collection.find({chainName: "Walmart"}).toArray(function (err, results) {
                results.map(x => {
                    if (Array.isArray(x.category)) {
                        // console.log(x.category);
                        if (x.category.length) {
                            let cat = x.category[0];
                            if (x.category[1] != undefined) {
                                cat = x.category[1];
                            }
                            
                            collection.updateOne({
                                _id: x._id
                            }, 
                            {
                                $set: { category: cat }
                            }, 
                            function(err, res) {
                                if (err) {
                                    console.error('ERROR 11: unable to update Sitem name ');
                                    console.error(err);
                                } 
                                else if (res.result.nModified) {
                                    console.log(x._id + '-UPDATED Category == ' + cat);
                                }
                                else {
                                    console.error('ERROR 12 :unable to update Sitem name  ');
                                }
                            });
                        }
                    }
                });
            });

            // ######### query 2 - split sizes for WinCo into size and unit field  ############ 
            collection.find({chainName: "WinCo"}).toArray(function (err, results) {
                results.map(x => {
                    if(_.isString(x.size)) {
                        console.log(x.size);
                        let foo = x.size.split(" ");
                        if (foo.length > 1) {
                            x.size = parseFloat(foo[0]);
                            x.unit = foo[1];     
                            
                            collection.updateOne({
                                    _id: x._id
                                }, 
                                {
                                    $set: { size: x.size, unit: x.unit }
                                }, 
                                function(err, res) {
                                    if (err) {
                                        console.error('ERROR 20: unable to update Sitem name ');
                                        console.error(err);
                                    } 
                                    else if (res.result.nModified) {
                                        console.log(x._id + '-UPDATED Size Unit == ' + x.size + ' ' + x.unit);
                                    }
                                    else {
                                        console.error('ERROR 22 :unable to update Sitem name  ');
                                    }
                                });
                        }
                    }
                });
            });

            // ######### query 3 - remove symbols from item name  ############
            collection.find().toArray(function (err, results) {
                results.map(x => {
                    let match = false;

                    if (x.name.match(/^"(.*)"$/g)) {
                        match = true;
                        x.name = x.name.replace(/^"(.*)"$/, '$1');
                        // console.log(x.name);
                    }
                    if (x.name.match(/\&#174;/g)) {
                        match = true;
                        x.name = x.name.replace(/\&#174;/, '');     // Honey-Comb&#174; Breakfast Cereal
                    }
                    if (x.name.match(/®/g)) {
                        match = true;
                        x.name = x.name.replace(/®/, '');           // Minute® 
                    }
                    if (x.name.match(/™/g)) {
                        match = true;
                        x.name = x.name.replace(/™/, '');           // Classic™ BBQ
                    }

                    if (match) {
                        collection.updateOne({
                                _id: x._id
                            }, 
                            {
                                $set: { name: x.name }
                            }, 
                            function(err, res) {
                                if (err) {
                                    console.error('ERROR 32: unable to update Sitem name ');
                                } 
                                else if (res.result.nModified) {
                                    console.log(x._id + '-UPDATED Name == ' + x.name);
                                }
                                else {
                                    // console.error('ERROR 33 :unable to update Sitem name  ');
                                }
                            });
                    }
                });

                futureS.return({
                    status: true
                });
            });

        }
    });

    return futureS.wait();
}


/**
 * Sanitize items ....  fix item title - accidently corrupted name by adding extra "Organics"
 * 
 */
function sanitizeItemsData() {

    return;  //done

    // Create our future instance.
    let futureS = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureS.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('items');

            // ######### query 3 - remove symbols from item name                  ############ ss 
            collection.find().toArray(function (err, results) {
                results.map(x => {
                    let match = false;

                    if (x.name.match(/O Organics Organic/g)) {
                        console.log('FOUND O Organics ===SKIP==> ' + x.name);
                    }
                    else if (x.name.match(/O Organics/g)) {
                        match = true;
                        x.name = x.name.replace(/O Organics/, 'O Organics Organic');     // Clean up mess
                    }

                    if (match) {
                        collection.updateOne({
                                _id: x._id
                            }, 
                            {
                                $set: { name: x.name }
                            }, 
                            function(err, res) {
                                if (err) {
                                    console.error('ERROR 32: unable to update Sitem name ');
                                    console.error(err);
                                } 
                                else if (res.result.nModified) {
                                    console.log(x._id + '-UPDATED Name == ' + x.name);
                                }
                                else {
                                    // console.error('ERROR 33 :unable to update Sitem name  ');
                                    // console.log(res);
                                }
                            });
                    }
                });

                futureS.return({
                    status: true
                });
            });
        }
    });

    return futureS.wait();
}

/**
 * Parent function: Update sitem name with synonym names terms in csv file
 * 1) getSitemsSynonymsMatches1
 * 2) updateSitemsSynonyms2
 * 
 * 
 * @param p0 
 * @param p1 
 */
function processSitemSynonyms(p0, p1) {
    p1 = p1.replace(/^\s+|\s+$/g, "");
    p1 = p1.replace(/\./g, "\\.");    
    let matches = getSitemsSynonymsMatches1(p1);
    if (p1 == '"') {
        console.error( matches.data.length + '==' + p0 + '============-SITEM-==============' + p1 + '==');
    }
    else {
        console.log( matches.data.length + '==' + p0 + '============-SITEM-==============' + p1 + '==');
    }
    matches.data.map(x => {
        let pp = new RegExp(p1, 'gi');
        x.name = x.name.replace(pp, p0);
        let res3 = updateSitemsSynonyms2(x);
        if (res3.status) {
            // proceed
        }
        else {
            // proceed
            console.error(res3.error);
        }
    });

    return;
}

/**
 * Get sitems that match terms in csv file
 * 
 * @param name1 
 */
function getSitemsSynonymsMatches1(name1: string) {

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
            let foo = name1 + ' ';  // add a word boundary at end
            
            let collection = db.collection('sitems');
            collection.find({
                name: {$regex: foo, '$options': 'i'}
            }).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1: sitem matches ');
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
 * Update sitem with name terms in csv file
 * 
 * @param item 
 */
function updateSitemsSynonyms2(item: object) {
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
                _id: item._id
            }, 
            {
                $set: { name: item.name }
            }, 
            function(err, res) {
                if (err) {
                    console.error('ERROR 1: unable to update Sitem name ');
                    console.error(err);
                    futureB.return({
                        status: false,
                        error: err
                    });
                } 
                else if (res.result.nModified) {
                    console.log(item._id + '--UPDATED--' + item.name);
                    futureB.return({
                        status: true,
                    });
                }
                else {
                    console.error('ERROR2 :unable to update Sitem name  ');
                    futureB.return({
                        status: false,
                        error: 'ERROR2 :unable to update Sitem name  '
                    });
                }
                db.close();
            });
        }
    });

    return futureB.wait();
}





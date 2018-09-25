import { Meteor } from 'meteor/meteor';

import { getStorebyGID } from '../functions/functions.admin.stores';
import { getPriceMatch, addNewPrice, pricesUpdate } from '../functions/functions.admin.prices';
import { getGlobalSize } from '../functions/functions.admin.misc';
import { updateOneSitem, getSitem } from '../functions/functions.admin.scrapes';

import { Price } from '../../both/models/price.model';

import { Random } from 'meteor/random';
let Future = Npm.require( 'fibers/future' );

// ######  Apollo setup ###### 
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

const addNewScrapedPricesApollo = gql`
    query MyItems3($chainName: String, $upcMatch: Boolean, $updatedAt: Float, $options: String) {
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
`;


Meteor.methods({

    /**
     * 
     * @param chainName 
     * @param updatedAt 
     * @param total 
     */
    'addNewScrapedPrices'(chainName: string, updatedAt: number, total: number) {

        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            let currentDate = new Date().getTime();
            let loops =  Math.ceil( total / 300 );
            let sitemIdsUpdates = {};

            for (let i = 1; i <= loops; i++) {

                let options = {
                    limit: 300,
                    skip: (i - 1) * 300,
                };
    
                let serializeOptions = JSON.stringify(options);

                let priceInfo = '';
                let info = getNewScrapedPrices(chainName, updatedAt, serializeOptions)

                if (info.status) {
                    priceInfo = info.data;

                    let gids = {};
                    let storeIds = {};

                    // Get list of gids
                    priceInfo.map(x => {
                        x.prices.map(y => {
                            gids[y.gid] = y.gid;
                        }) 
                    })
                    // console.error(gids);
                    _.each(gids, function(val, key) {
                        console.log(key + ' -- ' + val)
                        let info = getStorebyGID(key);
                        if ( (info.status) && (info.data != undefined) ) {
                            storeIds[key] = info.data._id;
                        }
                        else {
                            console.error('##################### Missing gid getStorebyGID ################### ' + key);
                        }
                    });
        
                    // add new price
                    priceInfo.map(x => {

                        console.log(x._id);
                        if (x.itemT.unit != 'ct') {
                            console.log('----- skipping unit ---- ' + x.itemT.unit);
                        }

                        if (x.itemT.size == null) {
                            console.error(x);
                        }
                        else {

                            // res5.data.prices.map(y => {
                            x.prices.map(y => {
                                // if quanity is missing from sitem - use defualt value of 1   -------------  
                                let qty = x.quanity;
                                if (x.quantity == null) {
                                    qty = 1;
                                }

                                let info = getPriceMatch(x.itemT._id, storeIds[y.gid], qty);
            
                                if (info.status) {
                                    if (info.data) {
                                        // Price already exist, update
                                        let p = <Price>{};
                                        p._id = info.results[0]._id;
                                        p.submittedAt = currentDate;
                                        p.updated = currentDate;
                                        p.startsAt = currentDate;                                
                                        let gInfo = getGlobalSize(x.itemT.size, x.itemT.unit);
                                        p.gsize = gInfo.gsize * info.results[0].quantity;
                                        p.price = y.price / p.gsize;

                                        // Update sitem to reflect price processed so we can exclude processed sitems
                                        if (sitemIdsUpdates[x._id] == undefined) {
                                            updateOneSitem(x._id, { priceProcessed: true });
                                            sitemIdsUpdates[x._id] = 1;
                                        }

                                        let res = pricesUpdate(p);
                                        if(res.status) {
                                            console.log('addNewPrice - UPDATED price: ' + res.id);
                                        }
                                        else {
                                            console.error(res.error);
                                        }
                                    }
                                    else {
                                        // itemId, StoreId, Qty does not exit - insert new price
                                        let p = <Price>{};
                                        p._id = Random.id();
                                        p.itemId = x.itemT._id;
                                        p.storeId = storeIds[y.gid];
                                        p.note = 'scraped-price';
                                        p.soldOut = false;
                                        p.submittedAt = currentDate;
                                        p.updated = currentDate;
                                        p.startsAt = currentDate;
                                        p.expiresAt = 0;
            
                                        let gInfo = getGlobalSize(x.itemT.size, x.itemT.unit);
                                        
                                        p.quantity = qty;
                                        p.gsize = gInfo.gsize * p.quantity;
                                        p.gunit = gInfo.gunit;
                                        p.price = y.price / p.gsize;
        
                                        // Update sitem to reflect price processed so we can exclude processed sitems
                                        if (sitemIdsUpdates[x._id] == undefined) {
                                            updateOneSitem(x._id, { priceProcessed: true });
                                            sitemIdsUpdates[x._id] = 1;
                                        }

                                        // Create real prices store
                                        let res = addNewPrice(p);
                                        if(res.status) {
                                            console.log('addNewPrice - INSERTED new price = ' + res.id);
                                        }
                                        else {
                                            console.error(res.error);
                                        }
                                    }
                                }
                                else {
                                    console.error('############################## getStorebyGID ###################');
                                    console.error(info.error);
                                }
                            });
                        }
                    });
                }
            }
            
            return { status: true }
        }
    },


    /**
     * @param priceId 
     */
    'getPrice'(priceId: string) {
        if (this.userId) {
            let MongoClient = Npm.require('mongodb').MongoClient;

            let promise = new Promise((resolve) => {

                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('prices');

                        collection.find({
                            "_id": priceId
                        }).toArray(function (err, results) {
                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                            resolve(results);
                        });
                    }
                });
            });

            return promise.then(x => {
                console.log('-- this is my price entity...');
                return x;
            });
        }
    },

    /**
     * 
     * @param options 
     * @param sort 
     * @param itemName 
     */
    'getPricesNew'(options: Object, sort: Object, itemName: string) {
        if (this.userId) {
            let searchRegEx = {};

            let MongoClient = Npm.require('mongodb').MongoClient;

            let allResults = Promise.all([

                new Promise((resolve) => {

                    setTimeout(() => {

                        MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('prices');

                                let count = collection.find(searchRegEx).count();
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
                        } else {
                            let collection = db.collection('prices');
                            collection.find(
                                searchRegEx,
                                options
                            )
                                .sort(sort)
                                .toArray(function (err, results) {
                                    // Let's close the db -- don't close until you receive the results...
                                    db.close();
                                    resolve(results);
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

});


// #######################################################################################

/**
 * 
 * @param chainName 
 * @param updatedAt 
 * @param serializeOptions 
 */
function  getNewScrapedPrices(chainName, updatedAt, serializeOptions) {
    // Create our future instance.
    let futureU = new Future();

    client.query({
        query: addNewScrapedPricesApollo,
        variables: {
            chainName: chainName,
            upcMatch: true,
            updatedAt: updatedAt,
            options: serializeOptions

        },
    }).then((results) => {
            console.log('---- apScrapeItems2ByChain ---- ' + results.data.apScrapeItems2ByChain.length);
            futureU.return({
                status: true,
                data: results.data.apScrapeItems2ByChain
            });

        }).catch((error) => {
            futureU.return({
                status: false,
                error: error
            });
    });
    return futureU.wait();
}
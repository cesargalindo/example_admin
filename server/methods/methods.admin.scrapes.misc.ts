import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { findMissingItemsUPC, updateOneSitem } from '../functions/functions.admin.scrapes';

import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';
let fetch = require('node-fetch');
global.fetch = fetch;

let Future = Npm.require( 'fibers/future' );

let MONGO_URL = Meteor.settings.MONGO_URL;


let client = new ApolloClient({
    link: new HttpLink({ uri: Meteor.settings.public.GRAPHQL_URL }),
    cache: new InMemoryCache()
});

const GetSitemsWithMitems = gql`
        query MySitems($status: Int) {
            apScrapeItems2IdIssue(status: $status) {
                _id
                upc
                status
                mitems {
                    itemId
                    itemT {
                        _id
                        name
                    }
                }
            }
        }
`;


Meteor.methods({

    /**
     * Worker function 
     * 
     * @param chainName 
     */
    'findMissingUPCsItems'(chainName: string) {
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {

            let res1 = findMissingItemsUPC(chainName);
            console.log('########## Checking ' + res1.data.length + ' sitems UPCs for ' + chainName + ' ..... ');

            let cnt = 0;

            if (res1.status) {
                res1.data.map(x => {
                    let upc = parseInt(x.upc);
                    // get itemInfo
                    let itemInfo = Meteor.call('getItem', '', upc);
                    if (itemInfo.length == 0) {
                        console.error('SITEM ' + x._id + ' contains INVALID Item UPC match ' + x.upc);
                        updateOneSitem(x._id, { upcMatch: false });
                    }

                    if (!(cnt % 200)) {
                        console.log('####### items processed = ' + cnt);
                    }
                    cnt++;
                });

                return { status: true }
            }
            else {
                return res1;
            }
        }
    },

    /**
     * Worker function
     */
    'removeInvalidItemId'() {
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            // Create our future instance.
            let future = new Future();

            client.query({
                query: GetSitemsWithMitems,
                variables: {
                    status: 1,
                },
            }).then((results) => {
                    console.log('---- Scraped Items with mitems ---- ' + results.data.apScrapeItems2IdIssue.length);
                    results.data.apScrapeItems2IdIssue.map(x => {
                        x.mitems.map(y => {
                            if (_.isEmpty(y.itemT)) {
                                console.log(x);
                                // console.log(y);
                                console.error(x._id + ' --NULL ITEM-- ' + y.itemId);
                                let res3 = Meteor.call('scrapedItem.pull', x._id, y.itemId);
                            }
                        })

                    })
                    future.return({
                        status: true,
                    });
                }).catch((error) => {
                    console.log('there was an error with apScrapeItems2IdIssue', error);
                    future.return({
                        status: false,
                        error: error
                    });
            });
            return future.wait();
        }
    },


    'conertItemsUpcToIntegers'() {
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            let res1 = conertItemsUpcToIntegersFunc();
        }
    },
    

    /**
     * Worker function
     */
    'revertSItemNames'() {

        console.error('revertSItemNames has been blocked');
        return {
            status: false,
            error: 'revertSItemNames has been blocked'
        }

        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            let res2 = '';
            let res1 = revertSItemName1();
            res1.data.map(x => {
                if (x.scrapedName == undefined) {
                    console.error("SKIP THIS ITEM: " + x._id + '-' + x.scrapedName);
                }
                else {
                    // console.log( _.unescape(x.scrapedName ));
                    let name = _.unescape(x.scrapedName);
                    res2 = revertSItemName2(x._id, name);
                }
            })
        }
    },


    /**
     * This code doesn't do anything - it is just examples...
     * Hijacked this code to set item name = searchTitle
     */
    'revertItemNames'() {
        console.error('revertItemNames has been blocked');
        return {
            status: false,
            error: 'revertItemNames has been blocked'
        }

        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            let p0 = 'A1';
            let p1 = 'A.1.';

            let x = "Fittea 14 Day Detox 14 Day Program - A.1. Deluxe Sauce";

            p1 = p1.replace(/^\s+|\s+$/g, "");
            p1 = p1.replace(/\./g, "\\.");
            console.log(p1);

            let pp = new RegExp(p1, 'gi');
            let y = x.replace(pp, p0);
            console.log(x);
            console.log(y);

            console.log('################################');
            p0 = 'Energy';
            p1 = 'Energy,';

            x = "5-Hour Energy, Berry - 6 ct";

            p1 = p1.replace(/^\s+|\s+$/g, "");
            p1 = p1.replace(/\./g, "\\.");
            console.log(p1);

            pp = new RegExp(p1, 'gi');
            y = x.replace(pp, p0);
            console.log(x);
            console.log(y);

            let currentDate = new Date().getTime();

            if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
                let res2 = '';
                let res1 = getItemNames1();
                res1.data.map(x => {
                    let res0 = x.name.replace(/\,/g, ' ');
                    let res1 = res0.replace(/ - /g , ' ');
                    res0 = res1.replace(/\&/g, ' ');
                    res1 = res0.replace(/\s+/g, ' ');
                    let name = _.unescape(res1);
                    // console.log(x._id + ' --' + name);
                    res2 = addFullSearchTitle2(x._id, name, currentDate);
                })
            }
        }
    },

    /**
     * Clean up searchTitle - remove words like ct, with, the, and
     */
    'cleanUpItemSearchTitle'() {
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {

            let currentDate = new Date().getTime();

            if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
                let res1 = getItemSearchTitle1();
                let res2 = '';
                let searchA = '';
                let searchB = '';
                
                let cnt = 0;

                res1.data.map(x => {

                    searchA = x.searchTitle;

                    if (searchA == undefined ) {
                        console.error(x);
                    }
                    else {

                        let update = 0;
                        
                        if (searchA.match(/ ct\b/gi) ) {
                            searchB = searchA
                            // console.log(searchA);
                            searchA = searchB.replace(/ ct\b/gi , ' ');
                            searchB = searchA.replace(/\s+/g, ' ');
                            // console.log(searchB);
                            searchA = searchB;
                            update = 1;
                        }
                        if (searchA.match(/ with /gi) ) {
                            searchB = searchA
                            searchA = searchB.replace(/ with /gi , ' ');
                            searchB = searchA.replace(/\s+/g, ' ');
                            searchA = searchB;
                            update = 1;
                        }
                        if (searchA.match(/ the /gi) ) {
                            searchB = searchA
                            // console.log(searchA);
                            searchA = searchB.replace(/ the /gi , ' ');
                            searchB = searchA.replace(/\s+/g, ' ');
                            // console.log(searchB);
                            searchA = searchB;
                            update = 1;
                        }
                        if (searchA.match(/ in /gi) ) {
                            searchB = searchA
                            // console.log(searchA);
                            searchA = searchB.replace(/ in /gi , ' ');
                            searchB = searchA.replace(/\s+/g, ' ');
                            // console.log(searchB);
                            searchA = searchB;
                            update = 1;
                        }
                        if (searchA.match(/ for /gi) ) {
                            searchB = searchA
                            // console.log(searchA);
                            searchA = searchB.replace(/ for /gi , ' ');
                            searchB = searchA.replace(/\s+/g, ' ');
                            // console.log(searchB);
                            searchA = searchB;
                            update = 1;
                        }
                        if (searchA.match(/ to /gi) ) {
                            searchB = searchA
                            // console.log(searchA);
                            searchA = searchB.replace(/ to /gi , ' ');
                            searchB = searchA.replace(/\s+/g, ' ');
                            // console.log(searchB);
                            searchA = searchB;
                            update = 1;
                        }
                        if (searchA.match(/ and /gi) ) {
                            searchB = searchA
                            console.log(searchA);
                            searchA = searchB.replace(/ and /gi , ' ');
                            searchB = searchA.replace(/\s+/g, ' ');
                            // console.log(searchB);
                            searchA = searchB;
                            update = 1;
                        }
                        if (searchA.match(/ count /gi) ) {
                            searchB = searchA
                            // console.log(searchA);
                            searchA = searchB.replace(/ count /gi , ' ');
                            searchB = searchA.replace(/\s+/g, ' ');
                            // console.log(searchB);
                            searchA = searchB;
                            update = 1;
                        }
                        if (searchA.match(/ a /gi) ) {
                            searchB = searchA
                            // console.log(searchA);
                            searchA = searchB.replace(/ a /gi , ' ');
                            searchB = searchA.replace(/\s+/g, ' ');
                            // console.log(searchB);
                            searchA = searchB;
                            update = 1;
                        }

                        if (update) {
                            // console.log(x._id + ' -2-' + searchA);
                            res2 = addFullSearchTitle2(x._id, searchA, currentDate);
                        }

                    }

                })
            }
        }
    },


    'initMitemsInSitems'() {
        // return {
        //     status: false,
        //     error: 'initMitemsInSitems has been blocked'
        // }

        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            let rex = '';
            let res1 = getNullMitems1A();
            res1.data.map(x => {
                if ((x.mitems == null) || (x.mitems == undefined)) {
                    // console.error("PROCESS THIS ITEM: " + x._id + '-' + x.mitems);
                    rex = updateNullMitems2(x._id);
                }
            });

            let res2 = getNullMitems1B();
            res2.data.map(x => {
                console.error("PROCESS THIS ITEM: " + x._id + '-' + x.mitems);
                rex = updateNullMitems2(x._id);
            });
        }
    },


    'fixAlphTagIssues'() {
        return {
            status: false,
            error: 'fixAlphTagIssues has been blocked'
        }

        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            let res2 = '';
            let res3 = '';
            let res1 = getNullItemsTagIssue1();
            res1.data.map(x => {
                console.error("PROCESS THIS ITEM: " + x._id + '-' + x.category + '-' + x.image + '-' + x.public);
                res2 = getGoodItemsTagData2(x._id);
                if (res2.status) {
                    res3 = fixNullItemsTagIssue3(res2.data[0]);
                }
                else {
                    console.error()
                }
            });
        }

        return { status: true };
    },



    'addId2ScrapePrices'() {
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            let res2 = '';
            let res1 = getNullIdScrapedPrices();

            res1.data.map(x => {
                let cnt = 0;
                x.prices.map(y => {
                    // console.log( x._id + " == PROCESS THIS ITEM: " + y.gid + '--' + y._id);
                    x.prices[cnt]._id = Random.id();
                    cnt++
                })
                res2 = updateNullIdScrapedPrices(x._id, x.prices);
            })
        }

        return { status: true };
    }

});


// ww #######################################################################################

function revertSItemName1() {
    // Create our future instance.
    let futureA = new Future();

    let query = {};
    // let query = {name: {'$regex': '.*Organic.*', '$options': 'i'}};

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
            collection.find(query, { scrapedName: 1 }).toArray(function (err, results) {
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

function revertSItemName2(id, name) {
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
            collection.updateOne({
                _id: id
            }, 
            {
                $set: { name: name }
            }, 
            function(err, res) {
                if (err) {
                    console.error('ERROR 22: unable to update sitems name ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else if (res.result.nModified) {
                    console.log(id + ' UPDATED sitems name == ' + name);
                    futureA.return({
                        status: true
                    });
                }
                else {
                    // console.error('ERROR 22 :unable to update sitems name ' + id + ' - ' + name);
                    futureA.return({
                        status: true
                    });
                }

                db.close();
            });
        }
    });

    return futureA.wait();
}

function getNullIdScrapedPrices() {
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
            collection.find({ 'prices.0.startsAt': { $gt: 1 }, 'prices.0._id': {$exists: false} }).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getNullIdScrapedPrices: sitem matches ');
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


// tt #######################################################################################

function conertItemsUpcToIntegersFunc() {
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
            let collection = db.collection('items');
            collection.find({ upc: { $nin: ['undefined', "null", null] } }).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getNullItemsTagIssue1: item .. ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    results.map(x => {
                        let upc = parseInt(x.upc);
                        collection.updateOne({
                            _id: x._id
                        }, 
                        {
                            $set: { upc: upc }
                        }, 
                        function(err, res) {
                            if (err) {
                                console.error('ERROR 11: unable to update ITEM name ');
                                console.error(err);
                            } 
                            else if (res.result.nModified) {
                                console.log(x._id + '-UPDATED ITEM UPC == ' + upc);
                            }
                            else {
                                // console.error('ERROR 12: unable to update ITEM UPC ' + x._id + ' -- ' + upc);
                            }
                        });
                    });

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


// #######################################################################################

function getNullItemsTagIssue1() {
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
            let collection = db.collection('items');
            collection.find({category: null, image: null, note: "", public: null}).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getNullItemsTagIssue1: item .. ');
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

function getGoodItemsTagData2(id) {
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
            let collection = db.collection('items2d');
            collection.find({_id: id}).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getGoodItemsTagData2: item .. ');
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

function fixNullItemsTagIssue3(item) {
    if ((item.note == undefined)||(item.note == "null")) {
        item.note = '';
    }

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
            let collection = db.collection('items');
            collection.updateOne({
                _id: item._id
            }, 
            {
                $set: { category: item.category, image: item.image, note: item.note, public: item.public }
            }, 
            function(err, res) {
                if (err) {
                    console.error('ERROR 22 fixNullItemsTagIssue3: unable to update items ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else if (res.result.nModified) {
                    console.log(' UPDATED item == ' + item._id);
                    futureA.return({
                        status: true
                    });
                }
                else {
                    console.error('ERROR 22 :unable to update fixNullItemsTagIssue3 ' + item._id);
                    futureA.return({
                        status: true
                    });
                }

                db.close();
            });
        }
    });

    return futureA.wait();
}

function updateNullIdScrapedPrices(id, prices) {
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
            collection.updateOne({
                _id: id
            }, 
            {
                $set: { prices: prices }
            }, 
            function(err, res) {
                if (err) {
                    console.error('ERROR 22 updateNullIdScrapedPrices: unable to update sitems prices ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else if (res.result.nModified) {
                    console.log(id + ' UPDATED sitems == ' + id);
                    futureA.return({
                        status: true
                    });
                }
                else {
                    // console.error('ERROR 22 :unable to update sitems name ' + id + ' - ' + name);
                    futureA.return({
                        status: true
                    });
                }

                db.close();
            });
        }
    });

    return futureA.wait();
}

function getNullMitems1A() {
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
            collection.find({mitems: { $in: ['undefined', "null", null] } }, { mitems: 1 }).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getNullMitems: sitem matches ');
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

function getNullMitems1B() {
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
            collection.find({ mitems: { $elemMatch: { itemId: null } } }, { mitems: 1 }).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1 getNullMitems: sitem matches ');
                    console.error(err);
                    futureB.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    futureB.return({
                        status: true,
                        data: results
                    });
                }
                db.close();
            });
        }
    });

    return futureB.wait();
}

function updateNullMitems2(id) {
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
            collection.updateOne({
                _id: id
            }, 
            {
                $set: { mitems: [] }
            }, 
            function(err, res) {
                if (err) {
                    console.error('ERROR 22 getNullMitems2: unable to update sitems mitems ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else if (res.result.nModified) {
                    console.log(id + ' UPDATED sitems == ' + id);
                    futureA.return({
                        status: true
                    });
                }
                else {
                    // console.error('ERROR 22 :unable to update sitems name ' + id + ' - ' + name);
                    futureA.return({
                        status: true
                    });
                }

                db.close();
            });
        }
    });

    return futureA.wait();
}


// ss #######################################################################################

function getItemNames1() {
    // Create our future instance.
    let futureA = new Future();

    let query = {};

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureA.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('items');
            collection.find(query, { name: 1 }).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1: items matches ');
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

function getItemSearchTitle1() {
    // Create our future instance.
    let futureA = new Future();

    let query = {};

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) {
            futureA.return({
                status: false,
                error: err
            });
        } 
        else {
            let collection = db.collection('items');
            collection.find(query, { searchTitle: 1 }).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1: items matches ');
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
 * 
 * @param id 
 * @param name 
 * @param currentDate 
 */
function addFullSearchTitle2(id, name, currentDate) {
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
            let collection = db.collection('items');
            collection.updateOne({
                _id: id
            }, 
            {
                $set: { 
                    searchTitle: name,
                    updated: currentDate
                }
            }, 
            function(err, res) {
                if (err) {
                    console.error('ERROR 22: unable to update items name ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else if (res.result.nModified) {
                    console.log(id + ' UPDATED items name == ' + name);
                    futureA.return({
                        status: true
                    });
                }
                else {
                    // console.error('ERROR 22 :unable to update items name ' + id + ' - ' + name);
                    futureA.return({
                        status: true
                    });
                }

                db.close();
            });
        }
    });

    return futureA.wait();
}
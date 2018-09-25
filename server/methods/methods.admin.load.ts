import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Item } from '../../both/models/item.model';
import { Price } from '../../both/models/price.model';
import { Store } from '../../both/models/store.model';
import { GeoClass } from '../imports/fixtures/stores/geoClass';
import { getGlobalSize } from '../functions/functions.admin.misc';

import { resetElasticSearchItems } from '../imports/fixtures/items/resetElasticsearch';
import { resetElasticSearchPrices } from '../imports/fixtures/prices/resetElasticsearch';

// npm install fs
let fs = require('fs');

let elasticsearch = require('elasticsearch');

// create Elasticsearch client - DISABLE DEBUGGING
let EsClientSource = new elasticsearch.Client({
    host: Meteor.settings.ELASTICSEARCH_URL,
    log : [{
        type: 'stdio',
        levels: ['error'] // change these options
    }]
});

let itemFile = Meteor.settings.public.ITEM_FILE_URL;
let itemPepeFile = Meteor.settings.public.ITEM_FILE_URL;
itemPepeFile = itemPepeFile.replace(/-items/i, '-items-pepe');

let storeFile = Meteor.settings.public.STORE_FILE_URL;
let priceFile = Meteor.settings.public.PRICE_FILE_URL;

let opLogFile_U = Meteor.settings.public.OPLOG_FILE_UPDATE;
let opLogFile_I = Meteor.settings.public.OPLOG_FILE_INSERT;

let MONGO_URL = Meteor.settings.MONGO_URL;


Meteor.methods({


    // ####################################### ITEMS #########################################################

    /**
     * Get all items that match this size
     * 
     * @param size 
     */
    'getAllItems'(size: number) {
        if (this.userId) {
            let MongoClient = Npm.require('mongodb').MongoClient;
            let promise = new Promise((resolve) => {

                MongoClient.connect(MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('items');

                        if (size > 0) {
                            collection.find({ }, {"name": 1, "size": 1}).limit(size).toArray(function (err, results) {
                                db.close();
                                resolve(results);
                            });
                        }
                        else {
                            collection.find({ }).toArray(function (err, results) {
                                db.close();
                                resolve(results);
                            });
                        }
                    }
                });
            });

            return promise.then(x => {
                if ( (size) || (size == -1)) {
                    return x.length;
                }
                else {
                    return x;
                }
            });
        }
    },

    /**
     * Return item count
     */
    'itemESCount'() {

        let hits = EsClientSource.count({
            index:  Meteor.settings.ES_INDEX_ITEMS,
            type: "items",
            body: {
                query: {
                    "match_all": { }
                }
            }
        }).then(function (body) {
            return body.count;

        }, function (error) {
            console.trace(error.message);
        });

        return hits;
    },


    /**
     *
     */
    'importItemsFromCSVFile'() {
        if (this.userId) {
            // Ensure database doesn't already have any items
            Meteor.call('getAllItems', 10, (error, res) => {
                if (error) {
                    console.error(error);
                }
                else {
                    if (!res.length) {
                        //ss - Export items in excel as a tab delimited text file so we can hande commas in name
                        let array = fs.readFileSync( Assets.absoluteFilePath("all_items.txt") , 'utf8').toString().split("\r");

                        // Reset file
                        if (array.length) {
                            fs.writeFile(itemFile, "", function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("The file was saved!");
                                }
                            });
                        }

                        let currentDate = new Date().getTime();

                        // explore slitting array into smaller pieces down the road
                        let itemsList = [];

                        for (let i = 0; i < array.length; i++) {

                            let res = array[i].split("\t");
                            if (res[3] == '') {
                                let fname = Meteor.settings.public.GOOGLE_NO_IMAGE;
                                res[3] = Meteor.settings.public.GOOGLE_IMAGE_PATH + Meteor.settings.public.GOOGLE_IMAGE_DEFAULT +  fname.substring(0, 2) + '/' +  fname;
                            }
                            else {
                                let fname = res[3];
                                res[3] = Meteor.settings.public.GOOGLE_IMAGE_PATH + Meteor.settings.public.GOOGLE_IMAGE_DEFAULT +  fname.substring(0, 2) + '/' +  fname;
                            }

                            if ( (res[0] != undefined) && (res[0] != '') ) {

                                let item = <Item>{};

                                // Provide id to Mongo to avoid saving ID as a BSON Types, ObjectId
                                item._id = Random.id();

                                // remove double quotes from beginning and end of string
                                item.name = res[0].replace(/^"(.*)"$/, '$1');
                                item.size = parseFloat(res[1].replace(/^"(.*)"$/, '$1'));
                                item.unit = res[2].replace(/^"(.*)"$/, '$1');

                                if ( item.name.includes('undefined') ) {
                                    console.error('###UNDEFINED#### = ' + item.name);
                                }

                                item.created = currentDate;
                                item.quantity = 1;
                                item.image = res[3];
                                item.public = 1;
                                if (res[4]) {
                                    item.category = res[4];
                                }
                                else {
                                    item.category = 'other';
                                }

                                if (res[5]) {
                                    item.upc = parseInt(res[5]);
                                }

                                itemsList.push(item);
                            }
                        }

                        let MongoClient = Npm.require('mongodb').MongoClient;
                        MongoClient.connect(MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('items');
                                // Insert a bunch of documents
                                collection.insert(itemsList, function(err, result) {
                                    if (err) {
                                        console.error(err)
                                    }
                                    else {
                                        console.log('************ imported batch of items ===>>> ' + result.ops.length);
                                    }
                                    db.close();
                                });
                            }
                        });
                    }
                }
            });

            return {status: true};
        }
    },


    /**
     *
     */
    'importItemsFromTXTFile'() {
        if (this.userId) {
            // Ensure database doesn't already have any items
            Meteor.call('getAllItems', 10, (error, res) => {
                if (error) {
                    console.error(error);
                }
                else {
                    if (!res.length) {
                        //ss - Export items in excel as a tab delimited text file so we can hande commas in name
                        let array = fs.readFileSync( Assets.absoluteFilePath("mongo-items.txt") , 'utf8').toString().split("\r");

                        let currentDate = new Date().getTime();

                        // explore slitting array into smaller pieces down the road
                        let itemsList = [];

                        for (let i = 0; i < array.length; i++) {

                            let res = array[i].split("\t");

                            if ( (res[0] != undefined) && (res[0] != '') ) {

                                let it = <Item>{};
                                it._id = res[0];
                                it.owner = 'raw-insert';
                                it.name = res[2];
                                it.size = parseFloat(res[3]);
                                it.unit = res[4];
                                it.quantity = parseInt(res[5]);
                                it.image = res[6];
                                it.public = parseInt(res[7]);

                                it.note = 'raw-import'                                
                                if (res[8] != undefined) {
                                    it.note = res[8];
                                }

                                it.category = res[9];

                                if (res[10] != undefined) {
                                    it.status = parseInt(res[10]);
                                }
                                it.created = parseInt(res[11]);
                                it.upc = parseInt(res[12]);
    
                                itemsList.push(it);
                            }
                        }

                        let MongoClient = Npm.require('mongodb').MongoClient;
                        MongoClient.connect(MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('items');
                                // Insert a bunch of documents
                                collection.insert(itemsList, function(err, result) {
                                    if (err) {
                                        console.error(err)
                                    }
                                    else {
                                        console.log('************ imported batch of items ===>>> ' + result.ops.length);
                                    }
                                    db.close();
                                });
                            }
                        });
                    }
                }
            });

            return {status: true};
        }
    },



    /**
     *
     */
    'exportMongoItems'() {

        if (this.userId) {

            // Ensure database doesn't already have any items
            Meteor.call('getAllItems', 0, (error, res) => {

                if (error) {
                    console.error(error);
                }
                else {
                    if (res.length) {

                        fs.writeFile(itemFile, "", function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("The file was saved!");
                            }
                        });

                        res.map(x => {
                            fs.appendFile(itemFile,
                                x._id + '\t' +
                                x.owner + '\t' +
                                x.name + '\t' +
                                x.size + '\t' +
                                x.unit + '\t' +
                                x.quantity + '\t' +
                                x.image + '\t' +
                                x.public + '\t' +
                                x.note + '\t' +
                                x.category + '\t' +
                                x.status + '\t' +
                                x.created + '\t' +
                                x.upc + '\t' +
                                x.duplicateId + "\t\r", function (err) {
                                if (err) throw err;
                            });
                        });
                    }
                }
            });

            return {status: true};
        }
    },

    /**
     *
     */
    'getItemsFromFileTotal'() {

        if (this.userId) {

            //ss - Export items in excel as a tab delimited text file so we can hande commas in name
            let array = fs.readFileSync( Assets.absoluteFilePath("all_items.txt") , 'utf8').toString().split("\r");

            let total = 0;
            for(let i = 0; i < array.length; i++) {

                let res = array[i].split("\t");

                if ( (res[0] != undefined) && (res[0] != '') ) {
                    total++;
                }
            }

            return total;
        }
    },


    /**
     *
     */
    'getItemsExportedFileCount'() {
        if (this.userId) {

            let array = fs.readFileSync( itemFile , 'utf8').toString().split("\r");
            return array.length;
        }
    },

    /**
     *
     */
    'importItemsES'() {

        if (this.userId) {

            // Ensure Elasticsearch item index is empty before inserting data
            Meteor.call('itemESCount', (error, res) => {

                if (error) {
                    throw error;
                } 
                else {
                    if (!res) {
                        let array = fs.readFileSync( itemFile , 'utf8').toString().split("\r");

                        let sleep = 0;

                        // Breakdown large array into smaller chunks
                        let chunks = Math.floor( array.length / 5000);

                        // account for remainder
                        if (array.length % 5000) {
                            chunks++;
                        }

                        for(let j = 0; j < chunks ; j++) {

                            let i = j * 5000;
                            let max = (j+1) * 5000;
                            let bulkInsert = [];

                            if (j == chunks - 1) {
                                max = array.length;
                            }

                            for(i; i < max; i++) {

                                let info1 = array[i].split(/\t/);

                                if (info1[2]) {
                                    // Get global "gunit" and include in Elasticsearch
                                    let ginfo = getGlobalSize(info1[3], info1[4]);

                                    bulkInsert.push(
                                        {index: {_index: Meteor.settings.ES_INDEX_ITEMS, _type: "items", _id: info1[0]}},
                                        {id: info1[0], name: info1[2] + ', ' + info1[3] + ' ' + info1[4], gunit: ginfo.gunit },
                                    );
                                }
                            }

                            // Stagger Elasticsearch imports by ms delays
                            sleep += 200;

                            Meteor.setTimeout(function () {
                                // Bulk import items into index Elastic Search
                                EsClientSource.bulk({
                                    body: bulkInsert
                                }, function (err, resp) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    else {
                                        console.log('************ bulk import items into Elasticsearch ===>>> ');
                                    }
                                });

                            }, sleep);
                        }

                        return {status: true};
                    }
                }
            });
        }
    },


    /**
     *
     */
    'resetItemsES'() {
        resetElasticSearchItems();
    },


    /**
     * @param sync 
     */
    'analyzeItems'(sync: boolean) {

        if (this.userId) {

            let total = 0;
            let lastId = '';

            // Get Total count
            let getItemESTotalCount = function (temp, callback) {
                EsClientSource.count({
                    index: Meteor.settings.ES_INDEX_ITEMS,
                    type: "items",
                    body: {
                        query: {
                            "match_all": {}
                        }
                    }
                }).then(function (body) {
                    callback(null, body.count);
                }, function (error) {
                    callback(null, 0);
                });
            };


            let getInitialESData = function (total, callback) {

                EsClientSource.search({
                    index: Meteor.settings.ES_INDEX_ITEMS,
                    type: "items",
                    size: 5000,
                    body: {
                        query: {
                            "match_all": {}
                        },
                        sort: [{"id": "desc"}]
                    }
                }).then(function (body) {
                    let xhits = body.hits.hits.map(x => x._source);
                    let LAST = _.last(xhits);
                    callback(null, xhits);
                }, function (error) {
                    console.trace(error.message);
                });
            };


            let getOtherESData = function (lastId, callback) {

                EsClientSource.search({
                    index: Meteor.settings.ES_INDEX_ITEMS,
                    type: "items",
                    size: 5000,
                    body: {
                        query: {
                            "match_all": {}
                        },
                        search_after: [lastId],
                        sort: [{"id": "desc"}]

                    }
                }).then(function (body) {
                    let xhits = body.hits.hits.map(x => x._source);
                    let LAST = _.last(xhits);
                    callback(null, xhits);
                }, function (error) {
                    console.trace(error.message);
                });
            };

            // Call async functions here
            let getItemESTotalCountSynch = Meteor.wrapAsync(getItemESTotalCount);
            total = getItemESTotalCountSynch('');  // wait here 

            let getInitialESDataSynch = Meteor.wrapAsync(getInitialESData);
            let result = getInitialESDataSynch(total);  // wait here 

            let xhits = result;

            let LAST = _.last(result);
            lastId = LAST.id;

            let cnt = Math.floor(total / 5000) - 1;
            // account for remainder
            if (total % 5000) {
                cnt++;
            }

            for (let i = 1; i <= cnt; i++) {
                let getOtherESDataSynch = Meteor.wrapAsync(getOtherESData);
                let b = getOtherESDataSynch(lastId);  // wait here bitch!

                let LAST = _.last(b);
                lastId = LAST.id;

                let a = xhits;
                xhits = a.concat(b);
            }

            // Transfer hits into a simple array
            let esResults = {};
            xhits.map(x => {
                esResults[x.id] = 1;
            });

            let missing = [];
            let bulkInsert = [];
            let array = fs.readFileSync(itemFile, 'utf8').toString().split("\r");

            for(let i = 0; i < array.length; i++) {
                let info1 = array[i].split(/\t/);

                if (info1[2]) {
                    if (esResults[info1[0]]) {
                        // do nothing
                    }
                    else {
                        missing.push({
                            id: info1[0],
                            name: info1[2] + ', ' + info1[3]
                        });

                        bulkInsert.push(
                            {index: {_index: Meteor.settings.ES_INDEX_ITEMS, _type: "items", _id: info1[0]}},
                            {id: info1[0], name: info1[2] + ', ' + info1[3]},
                        );
                    }
                }
            }

            // Sync mongo with ES
            if (sync) {
                // Bulk import items into index Elastic Search
                EsClientSource.bulk({
                    body: bulkInsert
                }, function (err, resp) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log('************ bulk import items into Elasticsearch ===>>> ');
                    }
                });
            }

            return missing;
        }

    },


    /**
     *
     */
    'addUPCFromCSVFile'() {
        
        // ww NOT NEEDED ANYMORE
        return;

        if (this.userId) {

            let mongoArray = fs.readFileSync( itemFile , 'utf8').toString().split("\r");

            let mongoList = {};
            for (let i = 0; i < mongoArray.length; i++) {

                let info = mongoArray[i].split(/\t/);
                if ( (info[0] != undefined) && (info[0] != '') ) {
                    
                    // Collect item in array if UPC is empty
                    if ( (info[12] == 'undefined') || (info[12] == '') ) {
                        mongoList[info[2] + '=' + info[3] + info[4]] = info[0];
                    }
                }
            }

            
            let array = fs.readFileSync( Assets.absoluteFilePath("all_items.txt") , 'utf8').toString().split("\r");
            
            let MongoClient = Npm.require('mongodb').MongoClient;            
            MongoClient.connect(MONGO_URL, function (err, db) {
                if (err) {
                    throw err;
                } else {

                    let collection = db.collection('items');

                    for (let i = 0; i < array.length; i++) {
                        
                        let res = array[i].split("\t");
        
                        if ( (res[0] != undefined) && (res[0] != '') ) {
        
                            let item = <Item>{};
        
                            // remove double quotes from beginning and end of string
                            item.name = res[0].replace(/^"(.*)"$/, '$1');
                            item.size = parseFloat(res[1].replace(/^"(.*)"$/, '$1'));
                            item.unit = res[2].replace(/^"(.*)"$/, '$1');
        
                            if ( item.name.includes('undefined') ) {
                                console.error('###UNDEFINED#### = ' + item.name);
                            }
                            else {
        
                                // Update if we have a UPC and item in mongoList array
                                if ( res[5] && mongoList[item.name + '=' + item.size + item.unit]) {
                                    console.log('GOT MY UPC = '+  res[5] + ' == ' + mongoList[item.name + '=' + item.size + item.unit]);
        
                                    // Add UPC to item
                                    collection.updateOne({ _id:  mongoList[item.name + '=' + item.size + item.unit]}, {
                                        $set:{ upc : parseInt(res[5]) }
                                    });
                                }
                            }
                        }
                    }

                    db.close();
                }
            });
            return {status: true};
        }
    },


    // ####################################### STORES #########################################################

    /**
     * @param size 
     */
    'getAllStores'(size: number) {
        if (this.userId) {
            let MongoClient = Npm.require('mongodb').MongoClient;
            let promise = new Promise((resolve) => {

                MongoClient.connect(MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('stores');

                        if (size > 0) {
                            collection.find({ }, {"gid": 1, "name": 1, "address": 1}).limit(size).toArray(function (err, results) {
                                db.close();
                                resolve(results);
                            });
                        }
                        else {
                            collection.find({}).toArray(function (err, results) {
                                db.close();
                                resolve(results);
                            });
                        }
                    }
                });
            });

            return promise.then(x => {
                console.log('-- got my stores here: ' + x.length);
                if ( (size) || (size == -1)) {
                    return x.length;
                }
                else {
                    return x;
                }
            });
        }
    },


    /**
     *
     */
    'getOplogData00'() {

        return;
        
        if (this.userId) {

            let mongoList = {};

            //ss - Export items in excel as a tab delimited text file so we can hande commas in name
            let array = fs.readFileSync( opLogFile_I , 'utf8').toString().split("\n");
            let res1 = '';
            let res2 = '';
            let res2b = '';
            let id = '';
            let timestamp = 0;

            let res3 = '';
            let res4 = '';
            let total = 0;
            let key1 = '';

            let cnt = 0;

            if (this.userId) {

                let mongoList = {};
    
                //ss - Export items in excel as a tab delimited text file so we can hande commas in name
                let array = fs.readFileSync( opLogFile_I , 'utf8').toString().split("\n");
                let res1 = Array;
                let timestamp = 0;
                let ns = '';
                let itemId = '';
                let cnt = 0;
    
                for(let i = 0; i < array.length; i++) {
                    // console.log(array[i]);
    
                    res1 = array[i].split(",");
                    // console.log(res1);
    
                    timestamp = res1[0].split('timestamp":{"t":');
    
                    if (timestamp[1] >  1518300271) {
                        ns = res1[6].split('"ns":"');
                        if ( ns[1] == 'meteor.items"' ) {
                            if (res1[12] == '"owner":"gxkusgR3Gv7TjzMeX"') {
                                cnt++;
                                itemId = res1[7].split('"o":{"_id":"');
                                mongoList[cnt] = itemId[1].replace('"', '');
                            }
                        }
                    }
                }
            } 
        }
    },



    /**
     *
     */
    'getOplogData'() {

        return;
        
        if (this.userId) {

            let mongoList = {};

            //ss - Export items in excel as a tab delimited text file so we can hande commas in name
            let array = fs.readFileSync( opLogFile_I , 'utf8').toString().split("\n");
            let res1 = Array;
            let timestamp = 0;
            let ns = '';
            let itemId = '';
            let cnt = 0;

            for(let i = 0; i < array.length; i++) {
                // console.log(array[i]);

                res1 = array[i].split(",");
                // console.log(res1);

                timestamp = res1[0].split('timestamp":{"t":');

                // console.log(i + ' -- ' + timestamp[1]);

                // if (timestamp[1] > 1510472809) {
                if (timestamp[1] >    1518300271) {
                    ns = res1[6].split('"ns":"');
                    if ( ns[1] == 'meteor.items"' ) {
                        if (res1[12] == '"owner":"gxkusgR3Gv7TjzMeX"') {
                            cnt++;
                            itemId = res1[7].split('"o":{"_id":"');
                            mongoList[cnt] = itemId[1].replace('"', '');
                        }
                    }
                }
            }

            let newOwner = 'gxkusgR3Gv7TjzMeX';            

            let MongoClient = Npm.require('mongodb').MongoClient;
            MongoClient.connect(MONGO_URL, function (err, db) {
                if (err) {
                    throw err;
                } else {
                    let collection = db.collection('items');

                    _.each(mongoList, function(itemId, key) {

                        // Update a single item with newOner
                        collection.updateOne({
                            _id: itemId
                        }, {
                            $set: { 
                                owner: newOwner
                            }
                        }, function(err, res) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                console.log('updated item ' + itemId + '  with new owner=' + newOwner);
                            }
                        });

                    });
                    db.close();
                }
            });


        }
    },


    /**
     *
     */
    'getStoresExportedFileCount'() {
        if (this.userId) {
            let array = fs.readFileSync( storeFile , 'utf8').toString().split("\r");
            return array.length;
        }
    },


    /**
     *
     */
    'importStoresFromCSVFile'() {
        if (this.userId) {
            // Ensure database doesn't already have any items
            Meteor.call('getAllStores', 10, (error, res) => {

                if (error) {
                    console.error(error);
                }
                else {
                    if (!res.length) {
                        //ss - Export items in excel as a tab delimited text file so we can hande commas in name
                        let array = fs.readFileSync(Assets.absoluteFilePath("california_companies1.txt"), 'utf8').toString().split("\r");

                        // Reset file
                        if (array.length) {
                            fs.writeFile(storeFile, "", function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("The file was saved!");
                                }
                            });
                        }

                        let geoCoords = new GeoClass();

                        // ss explore slitting array into smaller pieces down the road
                        let storesList = [];

                        // Store-Name	URL	Phone	Address	City	State	Zip	Country	Store-Hours	Lat	Lng
                        for (let i = 1; i < array.length; i++) {

                            let res = array[i].split("\t");

                            // skip blank rows
                            if ((res[0] != undefined) && (res[0] != '')) {

                                let GeoValid = true;

                                // get Lat and Lng coordinates
                                if (res[9] == '') {
                                    GeoValid = geoCoords.processGeoCoordinates(res[3], res[4], res[5]);
                                    res[9] = geoCoords.getGeoCoordinates('lat');
                                    res[10] = geoCoords.getGeoCoordinates('lng');
                                }

                                console.log(GeoValid + ': ' + res[0] + '  Address: ' + res[3] + '  City: ' + res[4] + '  LAT:' + res[9] + ' LON:' + res[10]);

                                let store = <Store>{};

                                //ss Provide id to Mongo to avoid saving ID as a BSON Types, ObjectId
                                store._id = Random.id();
                                store.name = res[0];

                                // remove double quotes from beginning and end of string
                                res[3] = res[3].replace(/^"(.*)"$/, '$1');
                                if (res[3].includes('undefined')) {
                                    console.error('###UNDEFINED in Store Address#### = ' + res[3]);
                                }

                                store.address = res[3] + ', ' + res[4] + ', ' + res[5] + ' ' + res[6];
                                store.phoneNumber = res[2];
                                store.website = res[1];
                                store.hours = res[8];
                                store.gid = res[11];

                                if (GeoValid) {
                                    store.location = {
                                        coordinates: [parseFloat(res[10]), parseFloat(res[9])],
                                        type: 'Point'
                                    };
                                    store.public = 1;

                                    // Stores.insert(store);
                                    storesList.push(store);
                                }
                                else {
                                    // set public to 0
                                    store.location = {
                                        coordinates: [0, 0],
                                        type: 'Point'
                                    };
                                    store.public = 0;

                                    storesList.push(store);
                                }

                            }
                        }

                        let MongoClient = Npm.require('mongodb').MongoClient;
                        MongoClient.connect(MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('stores');

                                // Insert a bunch of documents
                                collection.insert(storesList, function (err, result) {
                                    if (err) {
                                        console.error(err)
                                    }
                                    else {
                                        console.log('************ imported batch of stores ===>>> ' + result.ops.length);
                                    }
                                    db.close();
                                });
                            }
                        });


                    }
                }
            });

            return {status: true};
        }
    },


    /**
     *
     */
    'importStoresFromTXTFile'() {
        if (this.userId) {
            // Ensure database doesn't already have any items
            Meteor.call('getAllStores', 10, (error, res) => {

                if (error) {
                    return {
                        status: false,
                        error: error
                    };
                }
                else {
                    if (!res.length) {
                        //ss - Export items in excel as a tab delimited text file so we can hande commas in name
                        let array = fs.readFileSync(Assets.absoluteFilePath("mongo-stores.txt"), 'utf8').toString().split("\r");

                        let geoCoords = new GeoClass();

                        // ss explore slitting array into smaller pieces down the road
                        let storesList = [];

                        // Store-Name	URL	Phone	Address	City	State	Zip	Country	Store-Hours	Lat	Lng
                        for (let i = 1; i < array.length; i++) {
                            let res = array[i].split("\t");

                            // skip blank rows
                            if ((res[0] != undefined) && (res[0] != '')) {
                                let store = <Store>{};
                                store._id = res[0];
                                store.name = res[1];
                                store.address = res[2];
                                store.phoneNumber = res[3];
                                store.website = res[4];
                                store.hours = res[5];
                                store.gid = res[6];

                                store.location = {
                                    coordinates: [parseFloat(res[7]), parseFloat(res[8])],
                                    type: 'Point'
                                };
                                
                                store.public = parseInt(res[9]);
                                if (res[10] != undefined) {
                                    store.chainName = res[10];
                                }
                                if (res[11] != undefined) {
                                    store.chainLocationId = res[11];
                                }
                                storesList.push(store);
                            }

                        }
                        
                        let MongoClient = Npm.require('mongodb').MongoClient;
                        MongoClient.connect(MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('stores');
                                // Insert a bunch of documents
                                collection.insert(storesList, function (err, result) {
                                    if (err) {
                                        console.error(err)
                                    }
                                    else {
                                        console.log('************ imported batch of stores ===>>> ' + result.ops.length);
                                    }
                                    db.close();
                                });
                            }
                        });
                    }

                    return {status: true};
                }
            });
            
        }
    },


    /**
     *
     */
    'exportMongoStores'() {

        if (this.userId) {
            // Ensure database doesn't already have any items
            Meteor.call('getAllStores', 0, (error, res) => {

                if (error) {
                    console.error(error);
                }
                else {
                    if (res.length) {

                        fs.writeFile(storeFile, "", function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("The file was saved!");
                            }
                        });

                        res.map(x => {

                            console.log(x._id + x.name);

                            fs.appendFile(storeFile,
                                x._id + '\t' +
                                x.name + '\t' +
                                x.address + '\t' +
                                x.phoneNumber + '\t' +
                                x.website + '\t' +
                                x.hours + '\t' +
                                x.gid + '\t' +
                                x.location.coordinates[0] + '\t' +
                                x.location.coordinates[1] + '\t' +
                                x.public + "\t" +
                                x.chainName + "\t"+
                                x.chainLocationId + "\r", function (err) {
                                if (err) throw err;
                            });
                        });
                    }
                }
            });

            return {status: true};
        }
    },

    // ####################################### PRICES #########################################################

    /**
     * @param size 
     */
    'getAllPrices'(size: number) {
        if (this.userId) {
            let MongoClient = Npm.require('mongodb').MongoClient;
            let promise = new Promise((resolve) => {

                MongoClient.connect(MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('prices');

                        if (size > 0) {
                            collection.find({ }, {"storeId": 1, "itemId": 1}).limit(size).toArray(function (err, results) {
                                db.close();
                                resolve(results);
                            });
                        }
                        else {
                            collection.find({}).toArray(function (err, results) {
                                db.close();
                                resolve(results);
                            });
                        }
                    }
                });
            });

            return promise.then(x => {
                if ( (size) || (size == -1)) {
                    return x.length;
                }
                else {
                    return x;
                }
            });
        }
    },

    /**
     *
     */
    'getPricesExportedFileCount'() {
        if (this.userId) {

            let array = fs.readFileSync( priceFile , 'utf8').toString().split("\r");
            return array.length;
        }
    },


    /**
     *
     */
    'pricesESCount'() {

        let hits = EsClientSource.count({
            index:  Meteor.settings.ES_INDEX_PRICES,
            type: "prices",
            body: {
                query: {
                    "match_all": { }
                }
            }
        }).then(function (body) {
            return body.count;

        }, function (error) {
            console.trace(error.message);
        });

        return hits;
    },


    /**
     *
     */
    'addRandomPrices'() {
        if (this.userId) {

            // Ensure database doesn't already have any items
            Meteor.call('getUserbyEmailMethod', 'cesar+1@mutilo.com', (error, res) => {

                if (error) {
                    console.error(error);
                }
                else {
                    let owner = res._id;
                    let currentDate = new Date().getTime();

                    // Load items from file
                    let itemsArray = fs.readFileSync(itemFile, 'utf8').toString().split("\r");

                    // load stores from file
                    let storeArray = fs.readFileSync(storeFile, 'utf8').toString().split("\r");
                    
                    // for (let i = 0; i < storeArray.length; i++) {
                    for (let i = 0; i < 20; i++) {

                        let storeLine = storeArray[i].split(/\t/);

                        let pricesList = [];

                        // for (let k = 0; k < itemsArray.length; i++) {
                        for (let k = 0; k < 150; k++) {
                            let itemLine = itemsArray[k].split(/\t/);

                            // add three different quantities - vary from 1 to 10
                            for (let m = 0; m < 3; m++) {

                                let quanity = m * m + 1;

                                // give a price between 1 and 100
                                let startprice = round2(100 * Math.random()) + 1;

                                let price = <Price>{};
                                //ss Provide id to Mongo to avoid saving ID as a BSON Types, ObjectId
                                price._id = Random.id();
                                price.storeId = storeLine[0];
                                price.itemId = itemLine[0];
                                price.submittedAt = currentDate;
                                price.submitterId = owner;
                                price.expiresAt = 0;
                                price.updated = currentDate;
                                price.quantity = quanity;
                                price.note = 'load_cron';
                                price.payoutRequest = 0;
                                price.distance = 0;
                                price.soldOut = false;

                                let gglob = getGlobalSize(itemLine[3], itemLine[4]);
                                price.gsize = gglob.gsize * quanity;
                                price.gunit = gglob.gunit;

                                price.price = startprice / price.gsize;
                                
                                // Prices.insert(price).subscribe(id => { });
                                pricesList.push(price);
                            }
                        }

                        // Batch inport
                        let MongoClient = Npm.require('mongodb').MongoClient;
                        MongoClient.connect(MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('prices');
                                
                                // Insert a bunch of documents
                                collection.insert(pricesList, function (err, result) {
                                    if (err) {
                                        console.error(err)
                                    }
                                    else {
                                        console.log('************ imported batch of random prices ===>>> ' + result.ops.length);
                                    }
                                    db.close();
                                });
                            }
                        });

                    }

                }
            });

        }
    },



    /**
     *
     */
    'exportMongoPrices'() {
        if (this.userId) {
            // Ensure database doesn't already have any items
            Meteor.call('getAllPrices', 0, (error, res) => {

                if (error) {
                    console.error(error);
                }
                else {
                    if (res.length) {

                        fs.writeFile(priceFile, "", function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log("The file was saved!");
                            }
                        });

                        res.map(x => {
                            console.log(x._id + ' == ' +  x.price);

                            fs.appendFile(priceFile,
                                x._id + '\t' +
                                x.storeId + '\t' +
                                x.itemId + '\t' +
                                x.price + '\t' +
                                x.submittedAt + '\t' +
                                x.expiresAt + '\t' +
                                x.updated + '\t' +
                                x.quantity + '\t' +
                                x.note + '\t' +
                                x.payoutRequest + '\t' +
                                x.soldOut + '\t' +
                                x.distance + '\t' +
                                x.gsize + '\t' +
                                x.gunit + "\t\r", function (err) {
                                    if (err) throw err;
                                });
                        });
                    }
                }
            });

            return {status: true};
        }
    },


    importPricesMongo() {
        if (this.userId) {

            // Ensure database doesn't already have any items
            Meteor.call('getAllPrices', 10, (error, res) => {

                if (error) {
                    console.error(error);
                }
                else {
                    if (!res.length) {

                        let pricesList = [];

                        let array = fs.readFileSync( priceFile , 'utf8').toString().split("\r");
                        for (let i = 0; i < array.length; i++) {
                            let pr = array[i].split("\t");

                            let price = <Price>{};
                            price._id = pr[0];
                            price.storeId = pr[1];
                            price.itemId = pr[2];
                            price.price = pr[3];
                            price.submittedAt = pr[4];
                            price.expiresAt = pr[5];
                            price.updated = pr[6];
                            price.quantity = pr[7];
                            price.note = pr[8];
                            price.payoutRequest = pr[9];
                            price.soldOut = pr[10];
                            price.distance = pr[11];
                            price.gsize = pr[12];
                            price.gunit = pr[13];

                            pricesList.push(price);
                        }


                        // Batch inport
                        let MongoClient = Npm.require('mongodb').MongoClient;
                        MongoClient.connect(MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('prices');

                                // Insert a bunch of documents
                                collection.insert(pricesList, function (err, result) {
                                    if (err) {
                                        console.error(err)
                                    }
                                    else {
                                        console.log('************ imported batch of prices ===>>> ' + result.ops.length);
                                    }
                                    db.close();
                                });
                            }
                        });

                    }
                }
            });

            return {status: true};
        }
    },


    /**
     *
     */
    'importPricesES'() {

        if (this.userId) {

            // Ensure Elasticsearch item index is empty before inserting data
            Meteor.call('pricesESCount', (error, res) => {

                if (error) {
                    throw error;
                } 
                else {
                    if (!res) {

                        // Load items from file
                        let itemsArray = fs.readFileSync( itemFile , 'utf8').toString().split("\r");
                        // Transfer info into a simple array
                        let itemName = {};
                        for(let i = 0; i < itemsArray.length; i++) {
                            let xline = itemsArray[i].split(/\t/);
                            itemName[xline[0]] = xline[2] + ', ' +  xline[3] + ' ' + xline[4];
                        }

                        // load stores from file
                        let storeArray = fs.readFileSync( storeFile , 'utf8').toString().split("\r");
                        // Transfer info into a simple array
                        let storeLat = {};
                        let storeLon = {};
                        for(let i = 0; i < storeArray.length; i++) {
                            let xline = storeArray[i].split(/\t/);
                            storeLat[xline[0]] = xline[8];
                            storeLon[xline[0]] = xline[7];
                        }

                        let array = fs.readFileSync( priceFile , 'utf8').toString().split("\r");

                        let sleep = 0;

                        // Breakdown large array into smaller chunks
                        let chunks = Math.floor( array.length / 5000);

                        // account for remainder
                        if (array.length % 5000) {
                            chunks++;
                        }

                        for(let j = 0; j < chunks; j++) {

                            let i = j * 5000;
                            let max = (j+1) * 5000;
                            let bulkInsert = [];

                            if (j == chunks - 1) {
                                max = array.length;
                            }

                            for(i; i < max; i++) {
                                let info1 = array[i].split(/\t/);

                                if (info1[1]) {
                                    bulkInsert.push(
                                        {index: {_index: Meteor.settings.ES_INDEX_PRICES, _type: "prices", _id: info1[0]}},
                                        {
                                            id: info1[0],
                                            name: itemName[info1[2]],
                                            storeId: info1[1],
                                            itemId: info1[2],
                                            price: info1[3],
                                            payoutRequest: info1[9],
                                            quantity: info1[7],
                                            location: {
                                                lat: storeLat[info1[1]],
                                                lon: storeLon[info1[1]]
                                            },
                                            gsize: info1[12],
                                            gunit: info1[13],
                                        }
                                    );
                                }
                            }

                            // Stagger Elasticsearch imports by ms delays
                            sleep += 200;

                            Meteor.setTimeout(function () {
                                // Bulk import items into index Elastic Search
                                EsClientSource.bulk({
                                    body: bulkInsert
                                }, function (err, resp) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    else {
                                        console.log('************ bulk import prices into Elasticsearch ===>>> ');
                                    }
                                });

                            }, sleep);
                        }


                        return {status: true};
                    }
                }
            });
        }
    },


    /**
     *
     */
    'resetPricesES'() {
        resetElasticSearchPrices();
    },


    /**
     * @param sync 
     */
    'analyzePrices'(sync: boolean) {

        if (this.userId) {

            let total = 0;
            let lastId = '';

            // Get Total count
            let getPricesESTotalCount = function (temp, callback) {
                EsClientSource.count({
                    index: Meteor.settings.ES_INDEX_PRICES,
                    type: "prices",
                    body: {
                        query: {
                            "match_all": {}
                        }
                    }
                }).then(function (body) {
                    callback(null, body.count);
                }, function (error) {
                    callback(null, 0);
                });
            };


            let getInitialESData = function (total, callback) {
                EsClientSource.search({
                    index: Meteor.settings.ES_INDEX_PRICES,
                    type: "prices",
                    size: 5000,
                    body: {
                        query: {
                            "match_all": {}
                        },
                        sort: [{"id": "desc"}]
                    }
                }).then(function (body) {
                    let xhits = body.hits.hits.map(x => x._source);
                    let LAST = _.last(xhits);
                    callback(null, xhits);
                }, function (error) {
                    console.trace(error.message);

                });
            };


            let getOtherESData = function (lastId, callback) {
                EsClientSource.search({
                    index: Meteor.settings.ES_INDEX_PRICES,
                    type: "prices",
                    size: 5000,
                    body: {
                        query: {
                            "match_all": {}
                        },
                        search_after: [lastId],
                        sort: [{"id": "desc"}]

                    }
                }).then(function (body) {
                    let xhits = body.hits.hits.map(x => x._source);
                    let LAST = _.last(xhits);
                    callback(null, xhits);
                }, function (error) {
                    console.trace(error.message);

                });
            };


            // Call async functions here
            let getPricesESTotalCountSynch = Meteor.wrapAsync(getPricesESTotalCount);
            total = getPricesESTotalCountSynch('');  // wait here bitch!

            let getInitialESDataSynch = Meteor.wrapAsync(getInitialESData);
            let result = getInitialESDataSynch(total);  // wait here bitch!

            let xhits = result;

            let LAST = _.last(result);
            lastId = LAST.id;

            let cnt = Math.floor(total / 5000) - 1;
            // account for remainder
            if (total % 5000) {
                cnt++;
            }

            for (let i = 1; i <= cnt; i++) {
                let getOtherESDataSynch = Meteor.wrapAsync(getOtherESData);
                let b = getOtherESDataSynch(lastId);  // wait here bitch!

                let LAST = _.last(b);
                console.log('LAST 66  = ' + LAST.id);
                lastId = LAST.id;

                let a = xhits;
                xhits = a.concat(b);
            }

            let itemName = {};
            let storeLat = {};
            let storeLon = {};
            if (sync) {
                // Load items from file
                let itemsArray = fs.readFileSync(itemFile, 'utf8').toString().split("\r");

                // Transfer info into a simple array
                for (let i = 0; i < itemsArray.length; i++) {
                    let xline = itemsArray[i].split(/\t/);
                    itemName[xline[0]] = xline[2] + ', ' + xline[3];
                }

                // load stores from file
                let storeArray = fs.readFileSync(storeFile, 'utf8').toString().split("\r");
                // Transfer info into a simple array

                for (let i = 0; i < storeArray.length; i++) {
                    let xline = storeArray[i].split(/\t/);
                    storeLat[xline[0]] = xline[8];
                    storeLon[xline[0]] = xline[7];
                }
            }

            // Transfer hits into a simple array
            let esResults = {};
            xhits.map(x => {
                esResults[x.id] = 1;
            });

            let missing = [];
            let bulkInsert = [];
            let array = fs.readFileSync(priceFile, 'utf8').toString().split("\r");
            for (let i = 0; i < array.length; i++) {
                let info1 = array[i].split(/\t/);

                if (info1[2]) {

                    if (esResults[info1[0]]) {
                        // do nothing
                    }
                    else {
                        missing.push({
                            id: info1[0],
                            name: info1[2] + '--' + info1[3]
                        });

                        bulkInsert.push(
                            {index: {_index: Meteor.settings.ES_INDEX_PRICES, _type: "prices", _id: info1[0]}},
                            {
                                name: itemName[info1[2]],
                                id: info1[0],
                                storeId: info1[1],
                                itemId: info1[2],
                                price: info1[3],
                                payoutRequest: info1[9],
                                location: {
                                    lat: storeLat[info1[1]],
                                    lon: storeLon[info1[1]]
                                }
                            }
                        );
                    }
                }
            }

            // Sync mongo with ES
            if (sync) {
                // Bulk import items into index Elastic Search
                EsClientSource.bulk({
                    body: bulkInsert
                }, function (err, resp) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log('************ bulk import prices into Elasticsearch ===>>> ');
                    }
                });
            }
            return missing;
        }
    },


    // ####################################### ITEMS #########################################################

    /**
     * Import additional items from contractor - main purpose is to load bulk images
     * 
     * @param email 
     */
    'importPepeItemsFromCSVFile'(email) {
        
        if (this.userId) {

            // Ensure database doesn't already have any items
            Meteor.call('getUserbyEmailMethod', email, (error, res) => {
                if (error) {
                    console.error(error);
                }
                else {
                    let owner = res._id;

                    //ss - Export items in excel as a tab delimited text file so we can hande commas in name
                    let array = fs.readFileSync( Assets.absoluteFilePath("all_items_pepe.txt") , 'utf8').toString().split("\r");
            
                    // Reset file
                    if (array.length) {
                        fs.writeFile(itemPepeFile, "", function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("The file was saved!");
                            }
                        });
                    }
        
                    let currentDate = new Date().getTime();
        
                    // explore splitting array into smaller pieces down the road
                    let itemsList = [];
        
                    for (let i = 0; i < array.length; i++) {
        
                        let res = array[i].split("\t");
                        if (res[3] == '') {
                            let fname = Meteor.settings.public.GOOGLE_NO_IMAGE;
                            res[3] = Meteor.settings.public.GOOGLE_IMAGE_PATH + Meteor.settings.public.GOOGLE_IMAGE_DEFAULT +  fname.substring(0, 2) + '/' +  fname;
                        }
                        else {
                            let fname = res[3];
                            res[3] = Meteor.settings.public.GOOGLE_IMAGE_PATH + 'pepe-lepuew/' +  fname;
                        }
        
                        if ( (res[0] != undefined) && (res[0] != '') ) {
        
                            console.log('NAME: ' + res[0] + '  SIZE: ' + res[1]  + '  UNIT: ' + res[2] );
                            let item = <Item>{};
        
                            //ss Provide id to Mongo to avoid saving ID as a BSON Types, ObjectId
                            item._id = Random.id();
        
                            // remove double quotes from beginning and end of string
                            item.name = res[0].replace(/^"(.*)"$/, '$1') + "-" + i;
                            item.size = parseFloat(res[1].replace(/^"(.*)"$/, '$1'));
                            item.unit = res[2].replace(/^"(.*)"$/, '$1');
        
                            if ( item.name.includes('undefined') ) {
                                console.error('###UNDEFINED#### = ' + item.name);
                            }
        
                            item.owner = owner;
                            item.status = 0;        // set to inactive
                            
                            item.created = currentDate;
                            item.quantity = 1;
                            item.image = res[3];
                            item.public = 0;        // set to non-public
                            if (res[4]) {
                                item.category = res[4];
                            }
                            else {
                                item.category = 'other';
                            }
        
                            itemsList.push(item);
                        }
                    }
        
                    let MongoClient = Npm.require('mongodb').MongoClient;
                    MongoClient.connect(MONGO_URL, function (err, db) {
                        if (err) {
                            throw err;
                        } else {
                            let collection = db.collection('items');
                            // Insert a bunch of documents
                            collection.insert(itemsList, function(err, result) {
                                if (err) {
                                    console.error(err)
                                }
                                else {
                                    if (result.ops.length) {
                                        
                                        fs.writeFile(itemPepeFile, "", function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log("The file was saved!");
                                            }
                                        });
                
                                        result.ops.map(x => {
                                            fs.appendFile(itemPepeFile,
                                                x._id + '\t' +
                                                x.owner + '\t' +
                                                x.name + '\t' +
                                                x.size + '\t' +
                                                x.unit + '\t' +
                                                x.quantity + '\t' +
                                                x.image + '\t' +
                                                x.public + '\t' +
                                                x.note + '\t' +
                                                x.category + '\t' +
                                                x.status + '\t' +
                                                x.created + '\t' +
                                                x.duplicateId + "\t\r", function (err) {
                                                if (err) throw err;
                                            });
                                        });
                                    }
                                    
                                }
                                db.close();
                            });
                        }
                    });
                }
            });

            return {status: true};
        }
    },


    /**
     *
     */
    'importPepeItemsES'() {
        
        if (this.userId) {

            let array = fs.readFileSync( itemPepeFile , 'utf8').toString().split("\r");
            let sleep = 0;

            // Breakdown large array into smaller chunks
            let chunks = Math.floor( array.length / 5000);

            // account for remainder
            if (array.length % 5000) {
                chunks++;
            }

            for(let j = 0; j < chunks ; j++) {

                let i = j * 5000;
                let max = (j+1) * 5000;
                let bulkInsert = [];

                if (j == chunks - 1) {
                    max = array.length;
                }

                for(i; i < max; i++) {

                    let info1 = array[i].split(/\t/);

                    if (info1[2]) {
                        // Get global "gunit" and include in Elasticsearch
                        let ginfo = getGlobalSize(info1[3], info1[4]);

                        bulkInsert.push(
                            {index: {_index: Meteor.settings.ES_INDEX_ITEMS, _type: "items", _id: info1[0]}},
                            {id: info1[0], name: info1[2] + ', ' + info1[3] + ' ' + info1[4], gunit: ginfo.gunit },
                        );
                    }
                }

                // Stagger Elasticsearch imports by ms delays
                sleep += 200;

                Meteor.setTimeout(function () {
                    // Bulk import items into index Elastic Search
                    EsClientSource.bulk({
                        body: bulkInsert
                    }, function (err, resp) {
                        if (err) {
                            console.error(err);
                        }
                        else {
                            console.log('************ bulk import items into Elasticsearch ===>>> ');
                        }
                    });

                }, sleep);
            }

            return {status: true};

        }
    },
        

});


// TODO: make this a global function
function round2(number) {
    return Math.round(number * 100) / 100;
}

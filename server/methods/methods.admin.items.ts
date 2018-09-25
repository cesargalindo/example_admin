import { Meteor } from 'meteor/meteor';
import { Item } from '../../both/models/item.model';

import { ddpItemsUpdate } from '../functions/functions.admin.items';

let Future = Npm.require( 'fibers/future' );
let cmd = require('node-cmd');

Meteor.methods({
    

    /**
     * Update item searchTitle
     * 
     * @param item 
     * @param searchTitle 
     */
    'updateItemSearchTitle'(item: Item, searchTitle) {
        // Verify user is logged in
        if (Meteor.userId()) {
            item.searchTitle = searchTitle;
            item.note = 'update-searchTitle';
            let resItem = ddpItemsUpdate(item);                            
            return resItem;
        }
    },


    /**
     * Reterive item from MongoDB
     * 
     * @param itemId 
     * @param upc 
     */
    'getItem'(itemId: string, upc: number) {
        if (Meteor.userId()) {
            let query = {};
            if (upc) {
                query = { upc: upc };
            }
            else {
                query = { _id: itemId }
            }

            let MongoClient = Npm.require('mongodb').MongoClient;
            let promise = new Promise((resolve) => {
                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('items');
                        collection.find(query).toArray(function (err, results) {
                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                            resolve(results);
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
     * Retreive group of items from mongodb
     * 
     * @param options 
     * @param itemName 
     */
    'getItemsNew'(options: Object, itemName: string) {
        if (Meteor.userId()) {
            let searchRegEx = {name: {'$regex': '.*' + (itemName || '') + '.*', '$options': 'i'}};

            if (itemName.length < 2) {
                searchRegEx = {};
            }

            let MongoClient = Npm.require('mongodb').MongoClient;
            let allResults = Promise.all([

                new Promise((resolve) => {

                    setTimeout(() => {

                        MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('items');

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
                            let collection = db.collection('items');

                            collection.find(
                                searchRegEx,
                                options
                            ).toArray(function (err, results) {
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
                    itemsList: x[1],
                    total: x[0]
                };
                return res;
            });
        }
    },


    /**
     * 
     * Duplicate contractors items exactly but without the UPC
     * ONLY duplicate contractor items which don't exist in main system
     * 
     * 1 - duplicate item with same Owner with new itemId "_dp" - these items will be flagged as completed
     * 2 - update existing items with admin as owner and name "::"
     * 3 - itmes "::" will need to be updated
     * 
     * @param masterId 
     * @param data 
     */
    'items.duplicate.many'(masterId, data: string) {
        check(masterId, String);
        if (Meteor.userId()) {
            if (Roles.userIsInRole(Meteor.userId(), 'superadmin')) {

                let MongoClient = Npm.require('mongodb').MongoClient;

                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('items');
                        let info = JSON.parse(data);
                        let newInfo = info.map(x => {
                            
                            x._id = x._id + '_dp';
                            x.name = x.name + '::';     // Need this here to avoid Item, size quantity error

                            delete x.__typename;
                            delete x.size2;
                            delete x.image2;
                            delete x.price2;
                            if (x.quantity2 == null) {
                                delete x.quantity2;                                
                            }                                    
                            if (x.storeId2 == null) {
                                delete x.storeId2;
                            }

                            return x;
                        })

                        collection.insertMany(newInfo, function(err, result) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                console.log("Inserted ... documents into the document collection");
                            }
                        });

                        // ##############################

                        info = JSON.parse(data);
                        newInfo = info.map(x => {

                            x.name = x.name + '##';     // Need this here to avoid Item, size quantity error
                            
                            // Update a single item
                            collection.updateOne({
                                _id: x._id
                            }, {
                                $set: { 
                                    owner: masterId,
                                    name: x.name
                                }
                            }, function(err, res) {
                                if (err) {
                                    console.error(err);
                                }
                                else {
                                    console.log('updated item ' + x._id);
                                }
                            });
                        });
                        db.close();
                    }
                });

                return {status: true};
            }
        }
    },


    /**
     * 
     * Reset item name by removing "::"
     * 
     * @param data 
     */
    'items.update.name.many'(data: string) {
        if (Meteor.userId()) {
            if (Roles.userIsInRole(Meteor.userId(), 'superadmin')) {

                let MongoClient = Npm.require('mongodb').MongoClient;

                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('items');
 
                        let info = JSON.parse(data);
                        let newInfo = info.map(x => {

                            x.name = x.name.replace("::", "");

                            // Update a single item
                            collection.updateOne({
                                _id: x._id
                            }, {
                                $set: { 
                                    name: x.name
                                }
                            }, function(err, res) {
                                if (err) {
                                    console.error(err);
                                }
                                else {
                                    console.log('updated item name ' + x._id);
                                }
                            });

                        });
                        db.close();
                    }
                });

                return {status: true};
            }
        }
    },



    /**
     * Ensure only superadmin can delete an item
     * 
     * @param itemId 
     * @param image 
     */
    'deleteItem'(itemId: string, image: string) {
        if (Meteor.userId()) {
            if (Roles.userIsInRole(Meteor.userId(), 'superadmin')) {

                cmd.get('aws s3 rm s3://images-ff-original/' + image ,
                function(err, data, stderr) { console.log('Deleted  s3://images-ff-original/' + image) });
                cmd.get('aws s3 rm s3://images-ff-resized/125x/' + image ,
                function(err, data, stderr) { console.log('Deleted  s3://images-ff-resized/125x/' + image) });
                cmd.get('aws s3 rm s3://images-ff-resized/50x50/' + image ,
                function(err, data, stderr) { console.log('Deleted  s3://images-ff-resized/50x50/' + image) });
                cmd.get('aws s3 rm s3://images-ff-resized/600x/' + image ,
                function(err, data, stderr) { console.log('Deleted  s3://images-ff-resized/600x/' + image) });
                cmd.get('aws s3 rm s3://images-ff-resized/x125/' + image ,
                function(err, data, stderr) { console.log('Deleted  s3://images-ff-resized/x125/' + image) });

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
                        // UpdateOne - deletedAt -- Update a single item
                        let currentDate = new Date().getTime();

                        let collection = db.collection('items');
                        collection.updateOne({
                            _id: itemId
                        }, 
                        {
                            $set: {deletedAt: currentDate }
                        }, 
                        function(err, res) {
                            if (err) {
                                console.error(err);
                                futureDel.return({
                                    status: false,
                                    error: err
                                });
                            }
                            else {
                                console.log("Set deletedAt for item: " + itemId);
                                futureDel.return({
                                    status: true,
                                    id: itemId
                                }); 
                            }
                            db.close();
                        });
                    }
                });
    
                return futureDel.wait();
            }
        }
    },


    /**
     * For not just replace itemId in prices collection
     *
     * TODO - work in progress
     * TODO - swap Id in Issues ww low priority
     * 
     * @param masterId 
     * @param duplicateId 
     */
    'items.duplicate'(masterId, duplicateId) {  
        if (Meteor.userId()) {
            let MongoClient = Npm.require('mongodb').MongoClient;
            let promise = new Promise((resolve) => {

                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('prices');
                        collection.find({
                            itemId: duplicateId
                        }).toArray(function (err, results) {
                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                            resolve(results);
                        });
                    }
                });
            });

            return promise.then(x => {
                x.forEach(function (entry) {
                    console.log(entry._id + ' -- ' + entry.price);
                });

                return x;
            });
        }
    },

});


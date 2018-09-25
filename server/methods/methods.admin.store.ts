import { Meteor } from 'meteor/meteor';
import { Store } from '../../both/models/store.model';

import { storesInsert, storesUpdate } from '../functions/functions.admin.stores';

import { GeoClass } from '../imports/services/geoClass';

Meteor.methods({

    /**
     * Insert new store
     * Function resides in Admin server
     *
     * @param store 
     */
    'stores.insert'(store: Store) {
        // Verify user is logged in
        if (Meteor.userId()) {
            return storesInsert(store); 
        }
    },

    /**
     * 
     * @param store 
     */
    'stores.update'(store: Store) {
        // Verify user is logged in
        if (Meteor.userId()) {
            return storesUpdate(store);  
        }
    },


    /**
     * get geo coordinates from Google API call
     * 
     * @param address 
     * @param city 
     * @param state 
     */
    'getCoordinates'(address: string, city: string, state: string) {
        if (this.userId) {

            let geoCoords = new GeoClass();
            let GeoValid = geoCoords.processGeoCoordinates(address, city, state);

            if (GeoValid) {

                let coords = {
                    result: true,
                    lat: geoCoords.getGeoCoordinates('lat'),
                    lng: geoCoords.getGeoCoordinates('lng')
                };

                return coords;

            }
            else {
                let coords = {
                    result: true,
                };
                console.log("ERROR: could not generate Geo Coords for: " + address);

                return coords;
            }
        }
    },

    /**
     * 
     * @param gid 
     */
    'checkStoreGID'(gid: string) {
        if (this.userId) {
            let MongoClient = Npm.require('mongodb').MongoClient;

            let promise = new Promise((resolve) => {
                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('stores');

                        collection.find(
                            {gid: gid},
                            {name: 1}
                        ).toArray(function (err, results) {
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
     * 
     * @param storeId 
     */
    'getStore'(storeId: string) {
        if (this.userId) {
            let MongoClient = Npm.require('mongodb').MongoClient;
            let promise = new Promise((resolve) => {

                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('stores');

                        collection.find({
                            _id: storeId
                        }).toArray(function (err, results) {
                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                            resolve(results);
                        });
                    }
                });
            });

            return promise.then(x => {

                console.log('-- this is my store entity...');
                console.log(x);

                return x;
            });
        }
    },


    /**
     *
     * @param options 
     * @param storeName 
     * @param latStr 
     * @param lngStr 
     */
    'getStoresNew'(options: Object, storeName: string, latStr: string, lngStr: string) {
        if (this.userId) {
            let searchRegEx = {name: {'$regex': '.*' + (storeName || '') + '.*', '$options': 'i'}};

            if (storeName.length < 2) {
                searchRegEx = {};
            }

            let lat = parseFloat(latStr);
            let lon = parseFloat(lngStr);
            let METERS_PER_MILE = 1609.34;
            let geoSearch = {
                location: {
                    $nearSphere: {
                        $geometry: {type: "Point", coordinates: [lon, lat]},
                        $maxDistance: 30 * METERS_PER_MILE
                    }
                }
            };

            let MongoClient = Npm.require('mongodb').MongoClient;
            let allResults = Promise.all([

                new Promise((resolve) => {

                    setTimeout(() => {

                        MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('stores');

                                let count = collection.find({$and: [searchRegEx, geoSearch]}).count();

                                // tt - weird count is not available here but is available after it resolves in then(..)
                                console.log('&&&&&&&&&&&& COUNT &&&&&&&&&&& ');

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
                            let collection = db.collection('stores');
                            collection.find(
                                {$and: [searchRegEx, geoSearch]},
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
                    storesList: x[1],
                    total: x[0],
                };
                return res;
            });
        }
    },



});
import { Meteor } from 'meteor/meteor';

Meteor.methods({

    /**
     * Get list of matching stores
     * 
     * @param storeName 
     * @param latStr 
     * @param lngStr 
     */
    'getStores'(storeName: string, latStr: string, lngStr: string) {

        if (this.userId) {
            // http://stackoverflow.com/questions/26346089/mongodb-server-sockets-closed-no-fix-found
            if (storeName == null) {
                return [];
            }

            if (storeName.length < 2) {
                return [];
            }

            let promise = new Promise((resolve) => {

                let MongoClient = Npm.require('mongodb').MongoClient;

                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('stores');

                        let searchRegEx = {'$regex': '.*' + (storeName || '') + '.*', '$options': 'i'};

                        let lat = parseFloat(latStr);
                        let lon = parseFloat(lngStr);
                        let METERS_PER_MILE = 1609.34;

                        let geoSearch = {
                            location: {
                                $nearSphere: {
                                    $geometry: {type: "Point", coordinates: [lon, lat]},
                                    $maxDistance: 20 * METERS_PER_MILE
                                }
                            }
                        };

                        collection.find(
                            {$and: [{name: searchRegEx}, geoSearch]},
                            {name: 1, address: 1, location: 1},
                            {limit: 5}
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


});
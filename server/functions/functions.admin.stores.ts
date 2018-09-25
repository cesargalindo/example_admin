import { Store } from '../../both/models/store.model';
import { Random } from 'meteor/random';

let Future = Npm.require( 'fibers/future' );

/**
 * 
 * @param gid 
 */
export function getStorebyGID(gid: string) {
    // Create our future instance.
    var futureS = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {

            futureS.return({
                status: false,
                error: err
            });

        } else {
            let collection = db.collection('stores');
            collection.find({
                gid: gid
            }).toArray(function (err, results) {
                // Let's close the db -- don't close until you receive the results...
                db.close();
                futureS.return({
                    status: true,
                    data: results[0]
                });
            });
        }
    });

    return futureS.wait();
}

/**
 * 
 * @param storechain 
 */
export function getStorebyStorechain(storechain: string) {
    // Create our future instance.
    var futureS = new Future();

    if (storechain == 'Trader Joes') {
        storechain = "Trader Joe's";
    }

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {

            futureS.return({
                status: false,
                error: err
            });

        } else {
            let collection = db.collection('stores');
            collection.find({
                chainName: storechain
            }).toArray(function (err, results) {
                // Let's close the db -- don't close until you receive the results...
                db.close();
                futureS.return({
                    status: true,
                    data: results
                });
            });
        }
    });

    return futureS.wait();
}


/**
 * Insert new store, only called by DDP
 * 
 * @param ns 
 */
export function storesInsert(ns: Store) {

    console.error('-- go store here 111 ---- ');
    console.error(ns);

    // Create our future instance.
    var future = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;

    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            throw err;
        } else {
            let collection = db.collection('stores');

            //ww Insert store - include _id string, otherwise _id is installed as uint8
            //https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string
            collection.insertOne({
                // _id: 'msZtwwqP6KzE8ZTPf',  // use this to force an error
                _id: Random.id(),
                gid: ns.gid,
                name: ns.name,
                address: ns.address,
                phoneNumber: ns.phoneNumber,
                website: ns.website,
                hours: ns.hours,
                location: ns.location,
                public: ns.public,
                chainName: ns.chainName,
                chainLocationId: ns.chainLocationId
            }, function(err, res) {

                if (res.insertedCount) {
                    console.log('############## SORE INSERT storeId= ' + res.insertedId);

                    future.return({
                        status: true,
                        id: res.insertedId
                    });
                }
                else {
                    future.return({
                        status: false,
                        error: 'store insert failed'
                    });
                }

                db.close();

            });
        }
    });

    return future.wait();
}



/**
 * Update existing store, only called by DDP - make sync using Fibers
 *
 * @param store 
 */
export function storesUpdate(store: Store) {

    // Create our future instance.
    var future = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            throw err;
        }
        else {
            let collection = db.collection('stores');

            console.error(store);

            let updateInfo = { }

            if (store.note == 'update-coordinates') {
                updateInfo = {
                    name: store.name,
                    address: store.address,
                    phoneNumber: store.phoneNumber,
                    website: store.website,
                    hours: store.hours,
                    location: store.location,
                    public: store.public,
                    chainName: store.chainName,
                    chainLocationId: store.chainLocationId,
                    image: store.image
                }
            }
            else {
                updateInfo = {
                    name: store.name,
                    phoneNumber: store.phoneNumber,
                    website: store.website,
                    hours: store.hours,
                    public: store.public,
                    chainName: store.chainName,
                    chainLocationId: store.chainLocationId,
                    image: store.image
                }
            }

            // Update a single document
            collection.updateOne({
                _id: store._id
            }, {
                $set: updateInfo
            }, function(err, res) {
                db.close();
                if (err) {
                    future.return({
                        status: false,
                        error: 'store update failed - ' + err
                    });
                }
                else {
                    console.log('############## Store updated id= ' + store._id);
                    future.return({
                        status: true
                    });
                }
            });
        }
    });

    return future.wait();

}


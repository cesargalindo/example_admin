import { Meteor } from 'meteor/meteor';

let Future = Npm.require( 'fibers/future' );
let MONGO_URL = Meteor.settings.MONGO_URL;


/**
 *  Update Duplicate - sitem
 *
 * @param id 
 * @param updateInfo 
 */
export function duplicatesUpdate(id, updateInfo) {
    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            console.log(err);
        } 
        else {
            let collection = db.collection('duplicates');
            // Update a single item
            collection.updateOne({
                    _id: id
                }, 
                {
                    $set: updateInfo
                }, 
                function(err, res) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log("Set status = 1 for duplicate entry " + id);
                    }
                    db.close();
                    
                });
        }
    });

}


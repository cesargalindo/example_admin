import { Item } from '../../both/models/item.model';
import { Random } from 'meteor/random';

let Future = Npm.require( 'fibers/future' );



/**
 * Check if item exist - a new size/quantity was requested
 * 
 * 
 * @param itemName 
 * @param quantity 
 * @param size 
 * @param unit 
 */
export function getItemMatch(itemName: string, quantity: number, size: number, unit: string) {
    // Create our future instance.
    let future = new Future();

    let query = {
        name: itemName,
        quantity: quantity,
        size: size,
        unit: unit
    };

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            future.return({
                status: false,
                error: err
            });
        } else {
            let collection = db.collection('items');
            collection.find(query).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR getItemMatch .... ');
                    console.error(err);
                    future.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    future.return({
                        status: true,
                        data: results
                    });
                }
                db.close();
            });
        }
    });

    return future.wait();
}
    

/**
 * Retrieve item matches...
 * 
 */
export function getItemMatches() {
    
    // Create our future instance.
    let futureA = new Future();

    // let query = { note: 'please fix' };

    // https://images-ff-original.s3.us-west-2.amazonaws.com/5ba29812c125164705e5f3d0.png
    let query = {'image': {'$regex': '.*images-ff-original.s3.us-west-2.amazonaws.com.*', '$options': 'i'}};

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
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
            let collection = db.collection('items');
            collection.find(query).toArray(function (err, results) {
                if (err) {
                    console.error('ERROR 1: pull getItemMatches ');
                    console.error(err);
                    futureA.return({
                        status: false,
                        error: err
                    });
                } 
                else {
                    console.log(' -------- got my getItemMatches ------- ' + results.length);
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
 * Replicated CLIENT APP 'ddp.items.insert.byAdmin' code here in Admin app
 * 
 * @param ii 
 * @param copy 
 */
export function ddpItemsInsertByAdmin(ii: Item, copy: boolean) {

    if (copy) {
        // Omit itemId and append "- NEW" to name
        // ii = _.omit(ii,'_id');
        ii._id =  Random.id();
        ii.name = ii.name + ' - NEW';
    }
    else {
        ii.quantity = 1;     // this item is shared by all prices with different quantities
        ii.public = 1;       // make public by default - allow community to flag item as inappropriate
    }

    let checkDup = itemDuplicateCheck(ii);
    if (!checkDup.status) {
        return checkDup;
    }
    else {
        ii.created = new Date().getTime();

        let itemRes = itemsInsert(ii);                                           

        // Create our future instance.
        let futureInsert = new Future();

        if (!itemRes.status) {
            futureInsert.return(itemRes);
        }
        else {
            // Add new item to Elasticsearch
            let ni = <Item>{};
            ni._id = itemRes.id;
            ni.name = ii.name;
            ni.size = ii.size;
            ni.unit = ii.unit;
            ni.searchTitle = ii.name;

            let resES = itemsInsertElasticsearch(ni);                               
            if (!resES.status) {
                futureInsert.return(resES);
            }
            else {
                futureInsert.return({
                    status: true,
                    id: itemRes.id
                });
            }
        }

        return futureInsert.wait();
    }

}

/**
 * Replicated CLIENT APP ItemUpdate code here in Admin app
 * 
 * @param iu 
 */
export function ddpItemsUpdate(iu: Item) {

    let currentDate = new Date().getTime();

    // if note is undefined set = '' to all  .includes(...) check
    if (iu.note == undefined) {
        iu.note = '';
    }

    let updateQuery = {};

    if (iu.note == 'please fix') {
        updateQuery = { 
            image: iu.image,
            updated: currentDate
        };
    }    
    else if (iu.note == 'update-searchTitle') {
        updateQuery = { 
            searchTitle: iu.searchTitle,
            updated: currentDate
        };
    }    
    else if (iu.note == 'tag-only') {
        updateQuery = { 
            tags: iu.tags,
            updated: currentDate
        };
    }    
    else if (iu.note == 'cancel-new') {
        updateQuery = { note: iu.note };
    }
    else if (iu.note == 'ddp-approve') {
        updateQuery = { public: iu.public };
    }
    else if ( (iu.note == 'contractor') || iu.note.includes(':contractor') ) {
        // called by Contractor in Admin app
        let rollBackTime =  new Date().getTime();
        // Roll created date back one month
        rollBackTime = rollBackTime - 2592000;

        updateQuery = { 
            name: iu.name,
            size: iu.size,
            unit: iu.unit,
            image: iu.image,
            public: iu.public,
            category: iu.category,
            created: rollBackTime,
            note: iu.note,
            tags: iu.tags,
            updated: currentDate
        };
    }
    else  {
        // called by client App -- client can not alter public field
        // Item quantity will always be = 1
        updateQuery = { 
            name: iu.name,
            size: iu.size,
            unit: iu.unit,
            image: iu.image,
            public: iu.public,
            category: iu.category,
            tags: iu.tags,
            updated: currentDate        
        };
    }

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
            // Update a single item
            let collection = db.collection('items');
            collection.updateOne({
                    _id: iu._id
                }, 
                {
                    $set: updateQuery
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
                        console.log("Successfully updated item " + iu._id);
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
 * Insert new approved item into Elasticsearch
 * 
 * @param ni 
 */
export function itemsInsertElasticsearch(ni: Item) {
    
    // Skip Elasticsearch ... insert
    return{ status: true }

    // loading the npm module
    let elasticsearch = require('elasticsearch');

    // create the client
    let EsClientSource = new elasticsearch.Client({
        host: Meteor.settings.ELASTICSEARCH_URL
    });

    // Create our future instance.
    let future = new Future();

    // add a new Item entry into Elasticsearch
    EsClientSource.index({
        index:  Meteor.settings.ES_INDEX_ITEMS,
        type: "items",
        body: {
            name: ni.name + ', ' + ni.size,
            id: ni._id,
        }
    }, function (error, response) {

        if (error) {
            future.return( {
                status: false,
                error: 'items.insert.elasticsearch -  Could not insert item - ' + error
            } );
        }
        else {
            console.log(response);
            future.return( { status: true } );

        }

    });

    return future.wait();
}


/**
 * Update existing item in Elasticsearch
 * 
 * @param iu 
 */
export function itemsUpdateElasticsearch(iu: Item) {

    // Skip Elasticsearch ...
    return{ status: true }

    // loading the npm module
    let elasticsearch = require('elasticsearch');

    // create the client
    let EsClientSource = new elasticsearch.Client({
        host: Meteor.settings.ELASTICSEARCH_URL
    });

    // Create our future instance.
    let future = new Future();

    // the update-by-query API is new and should still be considered experimental. Use .update(...)
    // consequently I need to execute a query API and then update API
    let query = {
        "bool": {
            "filter": [
                {
                    "term" : { "id" : iu._id }
                }
            ]
        }
    };

    // Retrieve Elasticsearch id of a document so we can update it
    EsClientSource.search({
        index:  Meteor.settings.ES_INDEX_ITEMS,
        type: "items",
        body: {
            query: query
        }
    }).then(function (results) {

        // update is item exist in Elastisearch
        if (results.hits.total) {
            // update a document in Elastic Search
            EsClientSource.update({
                index:  Meteor.settings.ES_INDEX_ITEMS,
                type: "items",
                id: results.hits.hits[0]._id,
                body: {
                    // put the partial document under the `doc` key
                    doc: {
                        name: iu.name + ', ' + iu.size
                    }
                }
            }, function (err, res) {
                if (err) {
                    future.return( {
                        status: false,
                        error: 'items.update.elasticsearch 2 -  Could not update item - ' + err
                    } );
                }
                else {
                    console.log('===== success updated ======= ' + iu._id);
                    console.log(res);
                    future.return( { status: true } );
                }
            });
        }
        else {
            future.return( {
                status: false,
                error: 'items.update.elasticsearch 3 -  item does not exist in elasticsearch'
            } );
        }

    }, function (error) {
        future.return( {
            status: false,
            error: 'items.update.elasticsearch 1 -  Could not update item - ' + error
        } );
    });

    return future.wait();
}

// tt ############ local funtions ###########

/**
 * Check if item already exist
 * 
 * @param ni 
 */
function itemDuplicateCheck(ni: Item) {

    // Create our future instance.
    let future = new Future();

    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            future.return({
                status: false,
                error: err
            });
        } else {
            let collection = db.collection('items');
            collection.find({
                name: ni.name,
                size: ni.size,
                unit: ni.unit
            }).toArray(function (err, results) {
                // Let's close the db -- don't close until you receive the results...
                db.close();

                if (results.length) {
                    future.return({
                        status: false,
                        error: 'Duplicate item. This item name and size combination already exist.'
                    });
                }
                else {
                    future.return({
                        status: true
                    });
                }
            });
        }
    });

    return future.wait();
}



/**
 * Price info is inserted into Elasticsearch through another process
 *
 * @param ni 
 */
export function itemsInsert(ni: Item) {
    // Create our future instance.
    let future = new Future();
    
    let MongoClient = Npm.require('mongodb').MongoClient;
    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
        if (err) {
            future.return({
                status: false,
                error: err
            });
        }
        else {
            let collection = db.collection('items');
            collection.insertOne(ni, function(err, res) {
                db.close();
                
                if (res == undefined) {
                    future.return({
                        status: false,
                        error: 'item insert failed'
                    });  
                }
                else if (res.insertedCount) {
                    console.log('############## SUCCESS NEW ITEM INSERTED= ' + res.insertedId);
                    future.return({ 
                        status: true,
                        id: res.insertedId
                    });

                }
                else {
                    future.return({
                        status: false,
                        error: 'item insert failed'
                    });
                }
            });
        }
    });

    return future.wait();
}
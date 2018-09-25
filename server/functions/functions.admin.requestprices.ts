import { Meteor } from 'meteor/meteor';

import { Price } from '../../both/models/price.model';

import { Item } from '../../both/models/item.model';

import { Store } from '../../both/models/store.model';

import { RequestPrice } from '../../both/models/requestprice.model';

import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

let Future = Npm.require( 'fibers/future' );

/**
 *  create a document index Elastic Search
 *  NOTE: actual price is not saved in ElasticSearch, only Quantity, Item and Store info
 *
 *  Confirm searches in Postman using Task 2 search  by name    --  http://104.131.152.221:9200/prices/prices/_search?size=20&pretty=true
 *  Confirm searches in Postman using Task 5 search  by itemId  --  http://104.131.152.221:9200/prices/prices/_search?size=20&pretty=true
 *
 * @param pa 
 * @param ia 
 * @param sa 
 * @param ra 
 */
export function requestpricesElasticsearchInsert(pa: Price, ia: Item, sa: Store, ra: RequestPrice) {
    // Create our future instance.
    let future = new Future();

    let elasticsearch = require('elasticsearch');

    // create the client
    let EsClientSource = new elasticsearch.Client({
        host: Meteor.settings.ELASTICSEARCH_URL,
    });

    // Force error by inserting a duplicate entry into elasticsearch
    // rpExist.priceId = 'ATAWhCEFrbKdJCgmo';
    // rpExist.storeId = 'bW7JGA8SQarEWwfQ7';
    // rpExist.itemId = 'jiivCJWpmvR4bgzAJ';

    // Verify associated Item, and Store exist in Elasticsearch
    let gotHits = ss3Search_duplicateCheck( { priceId: ra.priceId, itemId: ia._id, storeId: sa._id});

    console.warn('--------- back from ss3Search_duplicateCheck ...  ----------- ' + gotHits);

    if (gotHits) {
        let xprice = <Issue>{};
        xprice.severity = 'HIGH';
        xprice.rpId = ra._id;
        xprice.priceId = ra.priceId;
        xprice.storeId = sa._id;
        xprice.itemId = ia._id;
        xprice.price = pa.price;
        xprice.created = ra.updated;
        xprice.note = 'DDP - duplicate entry exist in Elasticsearch priceId = ' + ra.priceId;
        Issues.insert(xprice);
        future.return({
            status: false,
            error: 'ss3Search_duplicateCheck duplicate entry exist in Elasticsearch priceId = ' + ra.priceId
        });

    }
    else {

        // Set payout status for Elasticsearch
        let payout = 0;
        if (ra.payRequest) {
            payout = 1;
        }

        // create a document index Elastic Search with payoutRequest = 1
        // Since admin approved uRequestprice- means we have a payout
        EsClientSource.index({
            index:  Meteor.settings.ES_INDEX_PRICES,
            type: "prices",
            body: {
                name: ia.name + ', ' + ia.size,
                id: ra.priceId,
                itemId: ia._id,
                storeId: sa._id,
                price: pa.price,
                quantity: pa.quantity,
                payoutRequest: payout,
                location: {
                    lat: sa.location.coordinates[0],
                    lon: sa.location.coordinates[1]
                }
            }
        }, function (error, response) {
            if (error) {
                console.log("    <<<<<<<<<<<<<<<<<<<<< Could not insert due to " + error + " >>>>>>>>>>>>>>>>>>");
                let xprice = <Issue>{};
                xprice.severity = 'HIGH';
                xprice.rpId = ra._id;
                xprice.priceId = ra.priceId;
                xprice.storeId = sa._id;
                xprice.itemId = ia._id;
                xprice.price = pa.price;
                xprice.created = ra.updated;
                xprice.note = 'DDP - unable to insert new price into elasticSearch - ' + error;
                Issues.insert(xprice);
                future.return({
                    status: false,
                    error: 'ss3Search_duplicateCheck unable to insert new price into elasticSearch - ' + error
                });
            }
            else {
                future.return({
                    status: true
                });

            }
        });
    }

    return future.wait();
}


// ################################ local functions ###############################

/**
 *
 * @param searchInfo
 * @returns {Promise<R>|PromiseLike<number|any>}
 */
function ss3Search_duplicateCheck(searchInfo) {

    let elasticsearch = require('elasticsearch');

    console.log(searchInfo.priceId + ' == ' + searchInfo.itemId + " - " + searchInfo.storeId);

    // create the client
    let EsClientSource = new elasticsearch.Client({
        host: Meteor.settings.ELASTICSEARCH_URL,
    });

    let  query = {
            "bool": {
                "filter": [
                    {
                        "term" : { "id" : searchInfo.priceId }
                    },
                    {
                        "term" : { "itemId" : searchInfo.itemId }
                    },
                    {
                        "term" : { "storeId": searchInfo.storeId }
                    }
                ]
            }
        };
    let body = {
        query: query
    };

    let get_ss3Search_info = function(body, callback) {

        //qq NPM has been updated to work with promises :)  - https://www.npmjs.com/package/elasticsearch
        EsClientSource.search({
            index:  Meteor.settings.ES_INDEX_PRICES,
            type: "prices",
            size: 5,
            body: body
        }).then(function (results) {
            console.log("=-=-=-=-=-=-=- BEGAN  ss3Search_duplicateCheck 1 =-=-=-=-=-=-=-=- " + results.hits.total);
            // return results.hits.total;
            callback(null, results.hits.total);

        }, function (error) {
            console.trace(error.message);
        });

    };

    let get_ss3SearchSynchronously =  Meteor.wrapAsync(get_ss3Search_info);
    let hits = get_ss3SearchSynchronously(body);  // <-- no wait() here!
    console.log('Number of hits = ' + hits);
    return hits;
}
import { Meteor } from 'meteor/meteor';
import { RequestPrices } from '../../both/collections/requestprices.collection';
import { RequestPrice } from '../../both/models/requestprice.model';

import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

import { getUser } from '../functions/functions.admin.users';

let MongoClient = Npm.require('mongodb').MongoClient;

let Future = Npm.require( 'fibers/future' );

Meteor.methods({

    /**
     * Edit existing request price which is saved in admin mongo DB
     * Cron job will pushed to Client server "app" once scheduled time is met
     *
     * @param rp 
     */
    'requestprices.edit.schedule'(rp: RequestPrice) {
        check(rp, {
            _id: String,
            payRequest: Number,
            updated: Number,
            expiresAt: Number,
            note: String,
            quantity: Number,
            scheduled: Number,
            storeId: String,
            itemId: String
        });

        // Verify user is logged into Admin server
        if (this.userId) {

            // Create our future instance.
            let future = new Future();

            // Remove id from update query
            let rpId = rp._id;
            rp = _.omit(rp,'_id');

            RequestPrices.update(rpId, {
                $set: rp
            }).subscribe(count => {

                if(!count) {
                    let xprice = <Issue>{};
                    xprice.severity = 'CRITICAL';
                    xprice.rpId = rp._id;
                    xprice.storeId = rp.storeId;
                    xprice.created = rp.updated;
                    xprice.note = 'requestprices.UPDATE.schedule - ' + rp.note;
                    xprice.status = rp.status;
                    xprice.requestPayout = rp.payRequest;
                    xprice.expiresAt = rp.expiresAt;
                    xprice.priceFactor = rp.scheduled;
                    xprice.pqId = Meteor.userId() + ' - ' + Meteor.user().emails[0].address;
                    Issues.insert(xprice);

                    future.return({
                        status: false,
                        error: 'requestprices.insert: unable to insert price'
                    });
                }
                else {
                    future.return({
                        status: true,
                        storeId: rp.storeId
                    });
                }

            });

            return future.wait();

        }

    },


    /**
     * Add request price which is saved in admin mongo DB
     * Cron job will pushed to Client server "app" once scheduled time is met
     *
     * @param rp 
     */
    'requestprices.insert.schedule'(rp: RequestPrice) {
        check(rp, {
            payRequest: Number,
            updated: Number,
            expiresAt: Number,
            note: String,
            quantity: Number,
            scheduled: Number,
            storeId: String,
            itemId: String
        });

        // Verify user is logged into Admin server
        if (this.userId) {

            // Create our future instance.
            let future = new Future();

            // force status = 0; require admin approvel
            rp.status = 0;

            let userInfo = getUser(Meteor.user().emails[0].address);
            rp.owner = userInfo.id;

            // Insert new Price Request
            RequestPrices.insert(rp)
                .subscribe(
                    x => {
                        console.log('true rpId here = ' + x);
                        future.return({
                            status: true,
                            storeId: rp.storeId
                        });
                    },
                    err => {
                        console.log(err);

                        let xprice = <Issue>{};
                        xprice.severity = 'CRITICAL';
                        xprice.rpId = rp._id;
                        xprice.storeId = rp.storeId;
                        xprice.created = rp.updated;
                        xprice.note = 'requestprices.insert.schedule - ' + rp.note;
                        xprice.status = rp.status;
                        xprice.requestPayout = rp.payRequest;
                        xprice.expiresAt = rp.expiresAt;
                        xprice.priceFactor = rp.scheduled;
                        xprice.pqId = Meteor.userId() + ' - ' + rp.owner;
                        Issues.insert(xprice);

                        future.return({
                            status: false,
                            error: 'requestprices.insert: unable to insert price'
                        });


                    }
                );

            return future.wait();
        }
    },


    /**
     * 
     * @param reqPriceId 
     */
    'getRequestPrice'(reqPriceId: string) {
        // Verify user is logged into Admin server
        if (this.userId) {

            let MongoClient = Npm.require('mongodb').MongoClient;

            let promise = new Promise((resolve) => {
                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {
                        let collection = db.collection('requestprices');

                        collection.find({
                            _id: reqPriceId
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
     * @param ownerId 
     */
    'getRequestPrices'(options: Object, ownerId: string) {
        // Verify user is logged into Admin server
        if (this.userId) {
            console.log("==> getItemsNew <===> " + ownerId + '  <=====> length: ' + ownerId.length);
            console.log(options);

            let requestPricesResults = [];

            let searchOwner = {owner: ownerId};

            if (ownerId.length < 2) {
                searchOwner = {};
            }

            let allResults = Promise.all([

                new Promise((resolve) => {

                    setTimeout(() => {

                        MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('requestprices');

                                let count = collection.count(searchOwner);

                                // tt - weird count is not available here but is available after it resolves in then(..)
                                console.log('&&&&&&&&&&&& COUNT &&&&&&&&&&& ');

                                db.close();

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
                            let collection = db.collection('requestprices');

                            console.log('------------------- le options ---------------');
                            console.log(options);
                            console.log(searchOwner);

                            collection.find(
                                searchOwner,
                                options
                            ).toArray(function (err, results) {
                                // Let's close the db -- don't close until you receive the results...

                                db.close();

                                requestPricesResults = results;
                                console.log('&&&&&&&&&&&&&&&&&&&&&&&& requestprices &&&&&&&&&&&&&&&&&&&&&&&& ==> ' + _.size(results));
                                let requestPriceIds = results
                                    .map(x => {
                                        console.log(x._id + ' -- ' + x.payRequest + ' --Status: ' + x.status);
                                        return x._id;
                                    });
                                console.log(requestPriceIds);


                                let priceIds = results
                                    .map(x => {
                                        return x.priceId;
                                    });
                                priceIds = _.uniq(priceIds);


                                let itemIds = results
                                    .map(x => {
                                        return x.itemId;
                                    });
                                itemIds = _.uniq(itemIds);


                                let storeIds = results
                                    .map(x => {
                                        return x.storeId;
                                    });


                                mulitCollectionPromiseLoad(requestPriceIds, priceIds, itemIds, storeIds, options, requestPricesResults, resolve);
                            });
                        }
                    });
                }),
            ]);

            return allResults.then(x => {

                let res = {
                    myRequestPrices: x[1].myRequestPrices,
                    paidToStatus: x[1].paidToStatus,
                    total: x[0]
                };

                console.log("@@@@@@@@@@@@@@@@@ getRequestPrices ################### ==> " + x[0]);

                return res;
            });

        }
    },


});

/**
 * 
 * @param requestPriceIds 
 * @param priceIds 
 * @param itemIds 
 * @param storeIds 
 * @param options 
 * @param requestPricesResults 
 * @param resolveMain 
 */
function mulitCollectionPromiseLoad(requestPriceIds, priceIds, itemIds, storeIds, options, requestPricesResults, resolveMain) {

    Promise.all([

        new Promise((resolve) => {

            setTimeout(() => {

                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {


                        let collection = db.collection('submitprices');

                        collection.find({
                            rpids: {$in: requestPriceIds}
                        })
                            .toArray(function (err, results) {
                                // Let's close the db -- don't close until you receive the results...

                                // console.log(x.rpids);
                                // x.rpids.map(y => {
                                //     submitPricesArray[y] = [];
                                // });

                                let submitPricesArray = [];

                                console.log('######################## =========== ################## ' +  results.length);

                                for(let i=0, l = results.length; i < l; i++){
                                    console.log(results[i]);

                                    results[i].rpids.map(y => {
                                        submitPricesArray[y] = [];
                                        console.log(y);
                                    });

                                    console.log('######################## 0000000000 ##################');
                                }


                                console.log('########### ___________________________ #########');

                                for(let i=0, l = results.length; i < l; i++) {
                                    console.log(results[i]);

                                    results[i].rpids.map(y => {
                                        console.log('submitPricesId = ' + results[i]._id + '  rpid = ' + y + ' - price = ' + results[i].price + ' owner=' + results[i].owner);

                                                submitPricesArray[y].push({
                                                    spId: results[i]._id,
                                                    owner: results[i].owner,
                                                    price: results[i].price,
                                                    spIdrpId: results[i]._id + y
                                                });
                                    });

                                    console.log('############## -----c---c-----c---c------ ##########');
                                }


                                console.log(submitPricesArray);

                                db.close();

                                let sp = {
                                  sp:   submitPricesArray
                                };
                                resolve(sp);
                            });

                    }
                });


            }, 1);
        }),


        new Promise((resolve) => {

            setTimeout(() => {


                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {


                        let collection = db.collection('prices');

                        collection.find({
                            _id: {$in: priceIds}
                        })

                            .toArray(function (err, results) {
                                // Let's close the db -- don't close until you receive the results...

                                console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPppppppppppppppPPPPPPPPPPPpppppppPPPPPPP' );

                                let prices = {
                                    prices: _.indexBy(results, '_id')
                                };
                                console.log(prices);

                                db.close();
                                resolve(prices);
                            });


                        // db.close();
                        // resolve(prices);

                    }
                });


            }, 1);

        }),



        new Promise((resolve) => {

            setTimeout(() => {

                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {


                        let collection = db.collection('stores');

                        collection.find({
                            _id: {$in: storeIds}
                        })

                            .toArray(function (err, results) {
                                // Let's close the db -- don't close until you receive the results...

                                console.log('sSSSSSSSSSSSSS SSSSSSSSSSSS SSSSSSSSSSS SSSSSSSSSS SSSSSSSSSSSSSSSS' );


                                // console.log(results);
                                //
                                // stores = _.indexBy(results, '_id');
                                // console.log(stores);

                                let stores = {
                                  stores:   _.indexBy(results, '_id')
                                };

                                db.close();
                                resolve(stores);
                            });

                    }
                });

            }, 1);

        }),




        new Promise((resolve) => {

            setTimeout(() => {

                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {


                        let collection = db.collection('items');

                        collection.find({
                            _id: {$in: itemIds}
                        })

                            .toArray(function (err, results) {
                                // Let's close the db -- don't close until you receive the results...

                                console.log('iiii IIIIIIIIIIIII iiiiiiii IIIIIIII iiiiiii IIIIIIIIIIIIIIIIIII' );

                                let items = {
                                    items: _.indexBy(results, '_id')
                                };

                                console.log(items);


                                db.close();
                                resolve(items);
                            });

                    }
                });



            }, 1);

        }),



    ])
        .then(results => {
            console.log('######################## ***^***^****^*****^*****^*****^**** ################## ' + results.length );

            // console.log(results);
            // callback function to load and construct final request prices collection

            // for(let i=0, l = results.length; i < l; i++){
            //     console.log("================== " + i);
            //     console.log(results[i]);
            //
            //
            //
            // }

            console.log('######################## ***************************** ##################');
            // console.log(results[0].prices);
            // console.log(results['prices']);
            // console.log(results[0]['prices']);


            return loadRequestPrices(results, options, requestPricesResults, resolveMain);


        });

}

/**
 * 
 * @param results 
 * @param options 
 * @param requestPricesResults 
 * @param resolveMain 
 */
function loadRequestPrices(results, options, requestPricesResults, resolveMain) {
    console.log("--------- options 2 -------------- " + options.skip + ' -- ' + this.totalServed);

    let prices = [];
    let stores = [];
    let items = [];
    let submitPricesArray = [];
    let paidToStatus = [];

    results.map(x => {
        if (x.prices != undefined) {
            console.log('ppppppppppp');
            console.log(x);
            prices = x.prices;
        }
        else if (x.stores != undefined) {
            console.log('sssssssss');
            console.log(x);
            stores = x.stores;
        }
        else if (x.items != undefined) {
            console.log('iiiiiiii');
            console.log(x);
            items = x.items;
        }
        else if (x.sp != undefined) {
            console.log('spspspspsps');
            console.log(x);
            submitPricesArray = x.sp;
        }

    });


    let myRequestPrices = requestPricesResults.map(x => {
        // console.log(x);

        console.log("STATUS: " + x.status + ' -- ' + x.priceId + ' -- ' +  x.itemId + ' -- ' + x.storeId  + ' -- ' + items[x.itemId].name + ' -- ' +  items[x.itemId].quantity + '--' + prices[x.priceId].quantity);

        x.name = items[x.itemId].name;
        x.size = items[x.itemId].size;


        // Items with quantity = 1 is the only item stored in database
        // x.quantity = items[x.itemId].quantity;
        x.quantity = prices[x.priceId].quantity;

        x.image = items[x.itemId].image;

        x.storeName = stores[x.storeId].name;
        x.storeAddress = stores[x.storeId].address;

        console.log( x.paidTos );

        let paidAmount = 0;
        let paidAt = 0;

        if ( x.paidTos != undefined ) {
            x.paidTos.map( y => {
                paidToStatus[y.spId + x._id] = y.status;

                console.log("spidId=" + y.spId + '  ===== status= '+ y.status);
                if (y.paidAt > paidAt) {
                    paidAt = y.paidAt;
                }
                paidAmount = paidAmount + y.payout;
            });
        };

        x.payout = paidAmount;
        x.paidAt = paidAt;
        x.price = submitPricesArray[x._id];


        return x;
    });


    console.log('HHHHHHHHHHHHHHHH HHHHHHHHHHH HHHHHHHHHHH HHHHHHHHHHHH');
    console.log(myRequestPrices);

    let res = {
        myRequestPrices: myRequestPrices,
        paidToStatus: paidToStatus
    };

    resolveMain(res);

}
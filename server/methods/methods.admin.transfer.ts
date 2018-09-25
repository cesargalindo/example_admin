import { Meteor } from 'meteor/meteor';

import { Users } from '../../both/collections/users.collection';
import { infoModel } from '../functions/functions.admin.misc';
import { getUser } from '../functions/functions.admin.users';

import { Transfer } from '../../both/models/transfer.model';
import { Item } from '../../both/models/item.model';

let Future = Npm.require( 'fibers/future' );

Meteor.methods({
    

    /**
     * Transfer items to other users
     * 
     * @param tr 
     * @param limitItems 
     */
    'transferItemsNoRecord'(tr: Transfer, limitItems: Boolean) {
        check(tr, {
            ownerFrom: String,
            ownerTo: String,
            status: Number,
            payment: Number,
        });
        check(limitItems, Boolean);

        if (this.userId) {
            if (Roles.userIsInRole(Meteor.userId(), 'superadmin')) {

                let MongoClient = Npm.require('mongodb').MongoClient;
                MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                    if (err) {
                        throw err;
                    } else {

                        let collection = db.collection('items');

                        let limit =  { limit: 5000 };
                        if (limitItems) {
                            limit = { limit: 170 };
                        }

                        collection.find( { owner: tr.ownerFrom }, limit
                        ).toArray(function (err, results) {

                            results.map(x => {
                                // Update a single item
                                collection.updateOne({
                                    _id: x._id
                                }, {
                                    $set: { 
                                        owner: tr.ownerTo 
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

                            // Let's close the db -- don't close until you receive the results...
                            db.close();
                        });
                    }
                });

                return {status: true};
            }
        }
    },

    /**
     * Insert new transfer record through client server
     * 
     * @param tr 
     */
    'ddp.transfer.insert'(tr: Item) {
        // Verify user is logged in
        if (Meteor.userId()) {
            let clientConn = DDP.connect(Meteor.settings.DDP_URL);

            // Get Meteor userId
            let userInfo = getUser(Meteor.user().emails[0].address);

            // Make DDP call
            if (userInfo.status) {
                let ddpInfo = new infoModel(userInfo.id, Meteor.settings.ADMIN_KEY , '');
                let moo = clientConn.call('ddp.transfer.insert', tr, ddpInfo);
                return moo;
            }
            else {
                return { status: false }
            }
        }
        else {
            return { status: false }
        }
    },


    /**
     * If superadmin set owner = "superbad", return all user info
     * 
     * @param owner 
     */
    'ddp.transfers.get'(owner: string) {
        // Verify user is logged in
        if (Meteor.userId()) {
            let clientConn = DDP.connect(Meteor.settings.DDP_URL);

            // Get Meteor userId
            let userInfo = getUser(Meteor.user().emails[0].address);

            // If owner is different require 'superadmin' role
            if (userInfo.id != owner) {
                if (!Roles.userIsInRole(Meteor.userId(), 'superadmin')) {
                    return { status: false, error: 'User does not have access.' }
                }
            }
            else {
                if (Roles.userIsInRole(Meteor.userId(), 'superadmin')) {
                    owner = 'superbad';
                } 
            }

            // Make DDP call
            if (userInfo.status) {
                let ddpInfo = new infoModel(userInfo.id, Meteor.settings.ADMIN_KEY , '');
                let moo = clientConn.call('ddp.transfers.get', owner, ddpInfo);
                return moo;
            }
            else {
                return { status: false }
            }
        }
        else {
            return { status: false }
        }
    },


    /**
     * NOTE: userIds saved in tPrices are those used in the local meteor Admin database
     * 
     * @param fromUserEmail 
     * @param toUserEmail 
     */
    'myPricesUserTransfer'(fromUserEmail: string, toUserEmail: string) {

        let fromInfo = Users.find({ 'emails.0.address': fromUserEmail }).fetch();
        let toInfo = Users.find({ 'emails.0.address': toUserEmail }).fetch();

        // Create our future instance.
        let futurePull = new Future();

        let MongoClient = Npm.require('mongodb').MongoClient;
        MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
            if (err) {
                console.error(err);
                futurePull.return({
                    status: false,
                    error: err
                });
            } else {
                let collection = db.collection('tprices');

                // Update a multiple items
                collection.update({ 
                    submitterId: fromInfo[0]._id
                },
                { $set: {
                    submitterId: toInfo[0]._id
                    }
                },
                {
                    multi: true
                },
                function(err, res) {
                    console.log(res.result);
                    if (err) {
                        console.error('ERROR unable to tPrices for user: ' + fromUserEmail);
                        console.error(err);
                        futurePull.return({
                            status: false,
                            error: err
                        });
                    } 
                    else if (res.result.nModified) {
                        console.log('updated items');
                        futurePull.return({
                            status: true,
                            msg: 'updated tprices == ' + fromUserEmail + ' == ' + fromUserEmail
                        }); 
                    }
                    else {
                        console.error('ERROR2 unable to tPrices for user: ' + toUserEmail);
                        futurePull.return({
                            status: false,
                            error: 'faile to update tPrices for user: ' + toUserEmail
                        });
                    }
                });
            }
        });

        return futurePull.wait();


    }



});
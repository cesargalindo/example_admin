import { Meteor } from 'meteor/meteor';
import { Users } from '../../both/collections/users.collection';
import { Accounts } from 'meteor/accounts-base';

import { SliderSettings } from '../../both/models/helper.models';

let Future = Npm.require( 'fibers/future' );

// import ApolloClient, { createNetworkInterface } from 'apollo-client';
// apollo imports
import { ApolloClient } from 'apollo-client';
// import Cache from 'apollo-cache-inmemory';
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from 'apollo-link-http';

import gql from 'graphql-tag';

let fetch = require('node-fetch');
global.fetch = fetch;

// Create Apollo Client
// const networkInterface = createNetworkInterface({
//     uri: Meteor.settings.public.GRAPHQL_URL,
//     headers: {
//         'Content-type': "application/json"
//     }
// });

// let client = new ApolloClient({
//     networkInterface
// });

const client = new ApolloClient({
    link: new HttpLink({ uri: Meteor.settings.public.GRAPHQL_URL }),
    cache: new InMemoryCache()
    // cache: new Cache()
    // cache: new InMemoryCache().restore(window.__APOLLO_STATE__),
});

// Construct Apollo GrapQL Queries
const initialUserData = gql`
    query UserInfoQuery($email: String) {
        apUserbyEmail(email: $email) {
            _id
        }
    }
`;


Meteor.methods({

    /**
     * Update user profile settings info
     *
     * @param ss 
     */
    'updateUserProfileSettings.admin'(ss: SliderSettings) {
        console.log(ss);
        if ( this.userId ) {
            check(ss, {
                payRequestDefault:Number,
                payRequestMax: Number,
                minHoursDefault: Number,
                minHoursMax: Number,
                quantityDefault: Number,
                quantityMax: Number,
                scheduledTimestamp: Number,
                scheduledDate: Date,
                scheduledHour: Number,
                scheduledMinute: Number,
                storeId: String,
                storeName: String,
                storeAddress: String
            });

            // Update user settings
            Meteor.users.update(  this.userId, {
                $set: {
                    settings: ss,
                }
            });

            return { status: true };
        }

        return { status: false };
    },

    /**
     * Get users that match email string
     * 
     * @param email 
     */
    'getUserEmails'(email: string) {
        check(email, String);
        if (this.userId) {

            if (email) {
                email = email.replace(/\+/, '\\+');
                // email = email.replace(/\@/, '\\@');
                console.log("==> getUsers <==2=> " + email + '  <==2===> ');
                if (email.length < 2) {
                    return {};
                }

                let searchRegEx = {'emails.0.address': {'$regex': '.*' + (email || '') + '.*', '$options': 'i'}};
                let options = {emails: 1};

                let MongoClient = Npm.require('mongodb').MongoClient;
                let allResults = Promise.all([

                    new Promise((resolve) => {

                        MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('users');

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
                    return x[0];
                });

            }
            else {
                return {};
            }
        }
    },

    /**
     * Return user that matches email
     * 
     * @param email 
     */
    'getUserbyEmailMethod'(email: string) {
        check(email, String);
        if (this.userId) {

            let MongoClient = Npm.require('mongodb').MongoClient;
            let allResults = Promise.all([

                new Promise((resolve) => {

                    MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                        if (err) {
                            throw err;
                        } else {
                            let collection = db.collection('users');

                            collection.find({'emails.0.address': email}).toArray(function (err, results) {
                                // Let's close the db -- don't close until you receive the results...
                                db.close();
                                resolve(results);
                            });
                        }
                    });
                }),
            ]);

            return allResults.then(x => {
                return x[0][0];
            });
        }
    },


    /**
     * Get users that match email string
     * 
     * @param options 
     * @param email 
     */
    'getUsers'(options: Object, email: string) {
        check(email, String);
        if (this.userId) {

            let searchRegEx = {};

            if (email) {
                if (email.length > 1) {
                    searchRegEx = {'emails.0.address': {'$regex': '.*' + (email || '') + '.*', '$options': 'i'}};
                }
            }

            let MongoClient = Npm.require('mongodb').MongoClient;
            let allResults = Promise.all([

                new Promise((resolve) => {

                    setTimeout(() => {

                        MongoClient.connect(Meteor.settings.MONGO_URL, function (err, db) {
                            if (err) {
                                throw err;
                            } else {
                                let collection = db.collection('users');
                                let count = collection.find(searchRegEx).count();
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
                            let collection = db.collection('users');
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
                    usersList: x[1],
                    total: x[0]
                };

                return res;
            });
        }
    },



    /**
     *  Check if User is admin from Admin site
     * 
     * @param userID 
     */
    'checkAdminSiteUser'(userID: string) {
        check(userID, String);
        if (userID == Meteor.settings.ADMIN_KEY) {
            console.log("*** USER IS A SITE ADMIN USER ****");
            return true;
        }
        else {
            return false;
        }
    },


    /**
     *  Check Roles on server - alanning:roles is not reliable when calling from client
     * 
     * @param userID 
     */
    'checkRoles'(userID: string) {
        check(userID, String);
        return {
            admin: Roles.userIsInRole(userID, 'superadmin'),
            contractor: Roles.userIsInRole(userID, 'contractor'),
            leadContractor: Roles.userIsInRole(userID, 'leadContractor'),
        };
    },

    /**
     * Use by Admin and cron server to get local user info
     * 
     * @param userID 
     */
    'getLocaUserInfo'(userID: string) {
        check(userID, String);
        if ( this.userId ) {
            let userInfo = Users.find({ _id: userID}).fetch();
            if (userInfo.length) {
                return  userInfo[0];
            }
            else {
                return { }
            }
        }
    },

    /**
     * Use by Admin and cron server to get local user info
     * 
     * @param email 
     */
    'getLocaUserInfoByEmail'(email: string) {
        check(email, String);
        if ( this.userId ) {
            let userInfo = Users.find({ 'emails.0.address': email }).fetch();
            if (userInfo.length) {
                return  userInfo[0];
            }
            else {
                return { }
            }
        }
    },


    /**
     * Update local user Roles and email array
     * 
     * @param localUserId 
     * @param contractor 
     * @param leadContractor 
     * @param superadmin 
     * @param emails 
     * @param skip 
     * @param total 
     * @param store 
     */
    'updateLocalUserInfo'(localUserId: string, contractor: boolean, leadContractor: boolean, superadmin: boolean, emails: string, skip: number, total: number, store: string) {
        check(contractor, Boolean);
        check(leadContractor, Boolean);
        check(superadmin, Boolean);
        check(skip, Number);
        check(total, Number);
        check(emails, Match.Maybe(String));
        check(store, Match.Maybe(String));

        if ( this.userId ) {
            let userInfo = Users.find({ _id: localUserId}).fetch();

            if (contractor) {
                Roles.addUsersToRoles( userInfo, 'contractor' );                
            }
            else {
                Roles.removeUsersFromRoles( localUserId, 'contractor' );
            }

            if (leadContractor) {
                Roles.addUsersToRoles( userInfo, 'leadContractor' );                
            }
            else {
                Roles.removeUsersFromRoles( localUserId, 'leadContractor' );
            }

            if (superadmin) {
                Roles.addUsersToRoles( userInfo, 'superadmin' );                
            }
            else {
                Roles.removeUsersFromRoles( localUserId, 'superadmin' );
            }

            // make grapql call for each email and retrieve Client App userId
            let tmp = emails.replace(/ /g, "");
            let arr = tmp.split(",");

            let cnt = 0;
            let userIds = [];

            arr.map( x => {
                cnt++;
                let y = getLocalUserId(x);
                if (y.status) {
                    userIds.push(y.id);
                }

                if (cnt == arr.length) {
                    Meteor.users.update(localUserId, {
                        $set: {
                            contractorEmails:  emails,
                            contractorIds: userIds,
                            skip: skip,
                            total: total,
                            storeChain: store
                        }
                    });
                }
                
            });

            return {status: true}
        }
    },

    /**
     *  Change user password
     *
     * @param password 
     */
    'setUserPassword'(password) {
        if ( this.userId) {
            check(password, String);

            let options = {logout: false};
            Accounts.setPassword(this.userId, password,  options);
            return true;
        }

        return false;
    },

    /**
     * Add new local user to Admin site
     * Default password is:  MrZoJab1122
     * 
     * 
     * @param email 
     * @param cell 
     * @param firstname 
     * @param lastname 
     */
    'addNewLocalUser'(email: string, cell: string, firstname: string, lastname: string) {
        check(email, String);
        check(cell, String);
        check(firstname, String);
        check(lastname, String);
        if ( this.userId ) {

            // add new user
            let userInfo = Accounts.createUser({
                username: cell,
                email: email,
                password: 'MrZoJab1122'
            });

            Meteor.users.update(userInfo, {
                $set: {
                    emails: [{
                        address: email,
                        verified: true
                    }],
                    cellVerified: true,                        
                    userProfile: {
                        firstname: firstname,
                        lastname: lastname,
                        paypalId: 'v00'
                    },
                }
            });

            return { status: true, password: 'MrZoJab1122' }
        }
    },


});


/**
 * 
 * @param email 
 */
function getLocalUserId(email) {
    // // Create our future instance.
    let UserFuture = new Future();
    
    client.query({
        query: initialUserData,
        fetchPolicy: 'network-only',
        variables: {
            email: email
        }
    })
    .then((results) => {
        console.warn(results.data.apUserbyEmail);
        if (results.data.apUserbyEmail) {
            UserFuture.return({
                status: true,
                id: results.data.apUserbyEmail._id
            });
        }
        else {
            UserFuture.return({
                status: false,
                error: 'Invalid user 0040.'
            });
        }
    }).catch((error) => {
        UserFuture.return({
            status: false,
            error: 'Invalid user 0044.'
        });
    });
    
    return UserFuture.wait();    
}
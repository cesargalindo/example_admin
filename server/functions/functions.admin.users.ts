import { Meteor } from 'meteor/meteor';
import { Users } from '../../both/collections/users.collection';

// import ApolloClient, { createNetworkInterface } from 'apollo-client';
// apollo imports
import { ApolloLink } from 'apollo-link';
import { ApolloClient } from 'apollo-client';
// import Cache from 'apollo-cache-inmemory';
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from 'apollo-link-http';

import gql from 'graphql-tag';

let fetch = require('node-fetch');
global.fetch = fetch;

let Future = Npm.require( 'fibers/future' );

// const networkInterface = createNetworkInterface({
//     uri: Meteor.settings.public.GRAPHQL_URL,
//     headers: {
//         'Content-type': "application/json"
//     }
// });


let client = new ApolloClient({
    link: new HttpLink({ uri: Meteor.settings.public.GRAPHQL_URL }),
    cache: new InMemoryCache()
    // cache: new Cache()
    // cache: new InMemoryCache().restore(window.__APOLLO_STATE__),
});



// Apollo GrapQL Queries
const GetUser = gql`
    query UserInfo($email: String) {
        apUserbyEmail(email: $email) {
            _id
            createdAt
        }
    }
`;


/**
 * Function is sync
 *
 * @param email
 */
export function getUser(email: string) {

    // Create our future instance.
    let future = new Future();

    console.log('===== getUser ======= ' + email);

    client.query({
        query: GetUser,
        variables: {
            email: email
        }
    }).then((results) => {
            console.log('---- getUser ---- ' + results.data.apUserbyEmail._id);
            future.return({
                status: true,
                id: results.data.apUserbyEmail._id
            });

        }).catch((error) => {
            console.log('there was an error sending GetUser query', error);
            future.return({
                status: false,
                error: error
            });
    });

    return future.wait();
}


/**
 * Get local user by email
 */
export function getLocaUser(email: string) {
    check(email, String);
    let userInfo = Users.find({ 'emails.0.address': email }).fetch();
    if (userInfo.length) {
        return  userInfo[0];
    }
    else {
        return { }
    }
}
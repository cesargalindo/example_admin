import { Meteor } from 'meteor/meteor';
import ApolloClient from 'apollo-client';
import { ApolloLink, split } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { InMemoryCache } from "apollo-cache-inmemory";
import { getMainDefinition } from 'apollo-utilities';


const httpLink = createHttpLink({ uri: Meteor.settings.public.GRAPHQL_URL });
// const middlewareLink = new ApolloLink((operation, forward) => {
//     operation.setContext({
//         headers: {
//             authorization: localStorage.getItem('token') || null
//         }
//     });
//     return forward(operation)
// });
// const link = middlewareLink.concat(httpLink);

// Create a WebSocket link:
const wsLink = new WebSocketLink({
    uri: Meteor.settings.public.GRAPHQL_SUBSCRIPTION_URL,
    options: {
        reconnect: true,
    }
});

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
    // split based on operation type
    ({ query }) => {
        const { kind, operation } = getMainDefinition(query);
        return kind === 'OperationDefinition' && operation === 'subscription';
    },
    wsLink,
    httpLink,
);


let client = null;
export function provideClient() {
    if(client) return client;
    
    client = new ApolloClient({
        link: link,
        cache: new InMemoryCache(),
        // dataIdFromObject: r => r['id'],
    });
    return client;
}

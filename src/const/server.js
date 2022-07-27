//Apollo Configurations
import { ApolloClient, InMemoryCache, split, HttpLink } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { WebSocketLink } from "@apollo/link-ws";


// dev mode
const bedhost_api_address = "http://0.0.0.0";
const bedhost_api_port = "8000";
const bedhost_api_url = bedhost_api_address + ":" + bedhost_api_port;

// const bedhost_api_url = 'http://dev1.bedbase.org'

// production mode
// const bedhost_api_url = `${window.location.protocol}//${window.location.host}`

const graphql = "/graphql"

const httpLink = new HttpLink({
    uri: bedhost_api_url
});

const wsLink = new WebSocketLink({
    uri: bedhost_api_url.replace("http", "ws") + graphql,
    options: {
        reconnect: true
    }
});

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
        );
    },
    wsLink,
    httpLink
);

export const client = new ApolloClient({
    cache: new InMemoryCache({ addTypename: false }),
    link: splitLink
});

export default bedhost_api_url;
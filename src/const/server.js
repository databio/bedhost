//Apollo Configurations
import { ApolloClient, InMemoryCache } from '@apollo/client'

// dev mode
// const bedhost_api_address = "http://0.0.0.0";
// const bedhost_api_port = "8000";
// const bedhost_api_url = `${bedhost_api_address}:${bedhost_api_port}`;

// const bedhost_api_url = 'http://dev1.bedbase.org'

// production mode
const bedhost_api_url = `${window.location.protocol}//${window.location.host}`

// Instantiate client for GraphQL
const graphql = "/graphql"

export const client = new ApolloClient({
    uri: bedhost_api_url + graphql,
    cache: new InMemoryCache({ addTypename: false })
})

export default bedhost_api_url;
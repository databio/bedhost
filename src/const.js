// dev mode
const bedhost_api_address = "http://0.0.0.0";
const bedhost_api_port = "8000";
// const graphql = "/graphql"
let bedhost_api_url = bedhost_api_address + ":" + bedhost_api_port;
// production mode
// let bedhost_api_url = `${ window.location.protocol }//${ window.location.host }`

// let bedhost_api_url = 'http://dev1.bedbase.org'


// bedhost_api_url = bedhost_api_url + graphql
export default bedhost_api_url;

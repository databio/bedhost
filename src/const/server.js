
// check env var to switch from production to dev
// dev mode
var bedhost_api_address;
var bedhost_api_port;
var bedhost_api_url;

if (import.meta.env.VITE_BEDHOST_ENV == "local") {
    bedhost_api_address = "http://127.0.0.1";
    bedhost_api_port = "8000";
} else if (import.meta.env.VITE_BEDHOST_ENV == "dev") {
    bedhost_api_address = "https://bedbase.org";
    bedhost_api_port = "80";
} else {  // production mode
    bedhost_api_url = "https://api.bedbase.org";  // v2
    // bedhost_api_address = "https://api.bedbase.org";
    // bedhost_api_port = "80";
}

if (bedhost_api_url === null) {
    bedhost_api_url = `${bedhost_api_address}:${bedhost_api_port}`;
}

export default bedhost_api_url;

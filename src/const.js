import { ModeComment } from "@material-ui/icons";

// dev mode
// const bedhost_api_address = "http://0.0.0.0";
// const bedhost_api_port = "8000";
// const bedhost_api_url = bedhost_api_address + ":" + bedhost_api_port + "/api";
// production mode
const bedhost_api_url = `${ window.location.protocol }//${ window.location.host }`
export default bedhost_api_url;

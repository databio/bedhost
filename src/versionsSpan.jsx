import React from "react";
import axios from "axios";
import bedhost_api_url from "./const";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style/home.css"

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class VersionsSpan extends React.Component {
  

  constructor() {
    super();
    this.state = {
      openapi_version: "",
      python_version: "",
      apiserver_version: "",
      bbconf_version: "",
    };
  }

  async componentDidMount(){
    let data = await api
    .get("versions")
    .then(({ data }) => data)
    .catch(function (error) {
      alert(error + "; is bedhost running at " + bedhost_api_url + "?");
    });
    console.log("versions retrieved from the server: ", data);
    this.setState({
      openapi_version: data["openapi_version"],
      python_version: data["python_version"],
      apiserver_version: data["apiserver_version"],
      bbconf_version: data["bbconf_version"],
    });
  }

  render() {
    return (
      <footer className="footer mt-auto py-3 bg-light text-black small p-4">
        {this.state["python_version"] !== "" ? (
          <span>
            | openAPI: <code>{this.state.openapi_version}</code> | Python:{" "}
            <code>{this.state.python_version}</code> | bedhost:{" "}
            <code>{this.state.apiserver_version}</code> | bbconf:{" "}
            <code>{this.state.bbconf_version}</code> |
          </span>
        ) : (
          <span>Couldn't fetch version info</span>
        )}
      </footer>
    );
  }
}

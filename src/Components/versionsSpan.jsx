import React from "react";
import axios from "axios";
import bedhost_api_url from "../const/server";
import { version } from "../../package.json";

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

  async componentDidMount() {
    let data = await api
      .get("/service-info")
      .then(({ data }) => data["component_versions"])
    // .catch(function (error) {
    //   alert(`${error}; is bedhost running at ${bedhost_api_url}?`);
    // });

    this.setState({
      openapi_version: data["openapi_version"],
      python_version: data["python_version"],
      apiserver_version: data["bedhost_version"],
      bbconf_version: data["bbconf_version"],
    });
  }

  render() {
    return (
      <footer
        className="flex-wrap py-3 my-4 align-top d-flex justify-content-between align-items-center border-top"
        style={{ minWidth: "900px", marginRight: "90px", marginLeft: "90px" }}
      >
        {this.state["python_version"] !== "" ? (
          <div className="float-left" >
            <span className="badge rounded-pill bg-secondary me-1">
              openAPI :{this.state.openapi_version}
            </span>

            <span className="badge rounded-pill bg-secondary me-1">
              Python: {this.state.python_version}
            </span>

            <span className="badge rounded-pill bg-secondary me-1">
              bedhost: {this.state.apiserver_version}
            </span>

            <span className="badge rounded-pill bg-secondary me-1">
              bedhost-ui: {version}
            </span>

            <span className="badge rounded-pill bg-secondary me-1">
              bbconf: {this.state.bbconf_version}
            </span>
          </div>
        ) : (
          <span style={{ marginLeft: "60px" }}>
            Couldn't fetch version info
          </span>
        )}
        <a
          className="float-right home-link"
          href="http://databio.org/"
        >
          <img
            src="/databio_logo.svg"
            // src="/ui/databio_logo.svg"
            height="60px"
            alt="databio logo"
          />
        </a>
      </footer>
    );
  }
}

import React from "react";
import axios from "axios";
import bedhost_api_url from "./const/server";
import { version } from "../package.json";

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
      .get("/api/versions")
      .then(({ data }) => data)
      .catch(function (error) {
        alert(error + "; is bedhost running at " + bedhost_api_url + "?");
      });

    this.setState({
      openapi_version: data["openapi_version"],
      python_version: data["python_version"],
      apiserver_version: data["apiserver_version"],
      bbconf_version: data["bbconf_version"],
    });
  }

  render() {
    return (
      <footer
        className="footer mt-auto py-3 bg-light text-black small p-4"
        style={{ minWidth: "900px" }}
      >
        {this.state["python_version"] !== "" ? (
          <span style={{ marginLeft: "30px" }}>
            | openAPI:{" "}
            <code style={{ color: "#e76f51" }}>
              {this.state.openapi_version}
            </code>{" "}
            | Python:{" "}
            <code style={{ color: "#e76f51" }}>
              {this.state.python_version}
            </code>{" "}
            | bedhost:{" "}
            <code style={{ color: "#e76f51" }}>
              {this.state.apiserver_version}
            </code>{" "}
            | bedhost-ui: <code style={{ color: "#e76f51" }}>{version}</code> |
            bbconf:{" "}
            <code style={{ color: "#e76f51" }}>
              {this.state.bbconf_version}
            </code>{" "}
            |
          </span>
        ) : (
          <span style={{ marginLeft: "30px" }}>
            Couldn't fetch version info
          </span>
        )}
        <a
          className="float-right home-link"
          style={{ marginRight: "30px" }}
          href="http://databio.org/"
        >
          Sheffield Computational Biology Lab
        </a>
      </footer>
    );
  }
}

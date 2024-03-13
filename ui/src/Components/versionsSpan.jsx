import React, { useState, useEffect } from "react";
import axios from "axios";
import bedhost_api_url from "../const/server";
import { version } from "../../package.json";

const api = axios.create({
  baseURL: bedhost_api_url,
});


export default function VersionsSpan() {
  const [versions, setVersions] = useState({
    openapi_version: "",
    python_version: "",
    apiserver_version: "",
    bbconf_version: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        let { data } = await api.get("/service-info");
        let componentVersions = data["component_versions"];

        setVersions({
          openapi_version: componentVersions["openapi_version"],
          python_version: componentVersions["python_version"],
          apiserver_version: componentVersions["bedhost_version"],
          bbconf_version: componentVersions["bbconf_version"],
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  return (
    <footer
      className="flex-wrap py-3 my-4 align-top d-flex justify-content-between align-items-center border-top"
      style={{ minWidth: "900px", marginRight: "90px", marginLeft: "90px" }}
    >
      {versions["python_version"] !== "" ? (
        <div className="float-left">
          <span className="badge rounded-pill bg-secondary me-1">
            openAPI: {versions.openapi_version}
          </span>

          <span className="badge rounded-pill bg-secondary me-1">
            Python: {versions.python_version}
          </span>

          <span className="badge rounded-pill bg-secondary me-1">
            bedhost: {versions.apiserver_version}
          </span>

          <span className="badge rounded-pill bg-secondary me-1">
            bedhost-ui: {version}
          </span>

          <span className="badge rounded-pill bg-secondary me-1">
            bbconf: {versions.bbconf_version}
          </span>
        </div>
      ) : (
        <span style={{ marginLeft: "60px" }}>Couldn't fetch version info</span>
      )}
      <a className="float-right home-link" href="http://databio.org/">
        <img
          src="/databio_logo.svg"
          height="60px"
          alt="databio logo"
        />
      </a>
    </footer>
  );
}


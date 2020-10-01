import React from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import bedhost_api_url from "./const";

console.log("bedhost_api_url:", bedhost_api_url);
const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedCountsSpan extends React.Component {
  state = {
    bed: -1,
    bedSet: -1,
  };

  constructor() {
    super();
    this.getBedCount();
    this.getBedSetCount();
  }

  getBedCount = async () => {
    let data = await api
      .get("bed/count")
      .then(({ data }) => data)
      .catch(function (error) {
        alert(error + "; is bedhost running at " + bedhost_api_url + "?");
      });
    console.log("BED file count retrieved from the server: ", data);
    this.setState({ bed: data });
  };

  getBedSetCount = async () => {
    let data = await api
      .get("bedset/count")
      .then(({ data }) => data)
      .catch(function (error) {
        alert(error + "; is bedhost running at " + bedhost_api_url + "?");
      });
    console.log("BED set count retrieved from the server: ", data);
    this.setState({ bedSet: data });
  };

  render() {
    return this.state["bed"] + this.state["bedSet"] !== -2 ? (
      <div>
        <h1>Welcome to BEDBASE</h1>
        <span>
          {" "}
          We currently have <b>{this.state.bed}</b> BED files and{" "}
          <b>{this.state.bedSet}</b> BED sets in the database
        </span>
      </div>
    ) : (
      <span>
        Could not fetch data from the server, is bedhost running at{" "}
        {bedhost_api_url}?
      </span>
    );
  }
}

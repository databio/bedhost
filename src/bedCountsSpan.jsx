import React from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import bedhost_api_url from "./const";
import "bootstrap/dist/css/bootstrap.min.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedCountsSpan extends React.Component {

  constructor() {
    super();
    this.state = {
      bed: -1,
      bedSet: -1,
      sampleBed: "",
      sampleBedSet: ""
    };
  }

  async componentDidMount(){
    let bfcount = await api
    .get("/api/bed/all/data/count")
    .catch(function (error) {
      alert(error + "; is bedhost running at " + bedhost_api_url + "?");
    });
    console.log("BED file count retrieved from the server: ", bfcount.data);
    this.setState({ bed: bfcount.data });

    let bscount = await api
      .get("/api/bedset/all/data/count")
      .catch(function (error) {
        alert(error + "; is bedhost running at " + bedhost_api_url + "?");
      });
    console.log("BED set count retrieved from the server: ", bscount.data);
    this.setState({ bedSet: bscount.data });

    let bed = await api.get("/api/bed/all/data?ids=md5sum").then(({ data }) => data);
    let bedurl = '/bedsplash/' + bed.data[0][0]
    this.setState({ sampleBed: bedurl });

    let bedset = await api.get("/api/bedset/all/data?ids=md5sum").then(({ data }) => data)
    let bedseturl = '/bedsetsplash/' + bedset.data[0][0]
    this.setState({ sampleBedSet: bedseturl });
    
  }

  
  render() {
    return this.state["bed"] + this.state["bedSet"] !== -2 ? (
      <div>
        <h1>Welcome to BEDBASE</h1>
        <span style={{fontSize : "12pt"}}>
          Here we provide a web interface and a RESTful API to access the statistics and plots of BED files and BED sets 
          that produced by the bedstat and bedbuncher pipeline. {" "}
          We currently have <b>{this.state.bed}</b> BED files and {" "}
          <b>{this.state.bedSet}</b> BED sets in the database.{" "}
          Please check out the {" "}
          <Link className="home-link" to={{
                    pathname: this.state.sampleBed
                }}>BED splash page
          </Link>          
          {" "} to see all the statistics, plots, and avalible downloans for single BED file. {" "}
           In addition to the statistics, plots, and downloads for the BED set, the{" "}
          <Link className="home-link" to={{
                    pathname: this.state.sampleBedSet
                }}>BED set splash page
          </Link>
          {" "} also allows you to compare among BED files within the set. {" "}
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

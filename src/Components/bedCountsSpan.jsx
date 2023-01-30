import React from "react";
import { Link } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import { FaFileAlt } from "react-icons/fa";
import axios from "axios";
import bedhost_api_url from "../const/server";
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
      sampleBedSet: "",
      bedAPI: "",
      bedSetAPI: "",
      genomeList: [],
    };
  }

  async componentDidMount() {
    let genomes = await api.get("/api/bed/genomes").then(({ data }) => data);
    this.setState({ genomeList: genomes });

    let bfcount = await api
      .get("/api/bed/count")
      .catch(function (error) {
        alert(`${error}; is bedhost running at ${bedhost_api_url}?`);
      });
    // console.log("BED file count retrieved from the server: ", bfcount.data);
    this.setState({ bed: bfcount.data });

    let bscount = await api
      .get("/api/bedset/count")
      .catch(function (error) {
        alert(`${error}; is bedhost running at ${bedhost_api_url}?`);
      });
    // console.log("BED set count retrieved from the server: ", bscount.data);
    this.setState({ bedSet: bscount.data });

    let bed = await api.get("/api/bed/all/metadata?ids=md5sum&limit=1").then(({ data }) => data);
    let bedurl = `/bedsplash/${bed.data[0][0]}`
    this.setState({ sampleBed: bedurl });

    let bedset = await api.get("/api/bedset/all/metadata?ids=md5sum&limit=1").then(({ data }) => data)
    let bedseturl = `/bedsetsplash/${bedset.data[0][0]}`
    this.setState({ sampleBedSet: bedseturl });
    this.getAPIcount()
  }

  async getAPIcount() {
    let api_json = await fetch(`${bedhost_api_url}/openapi.json`)
      .then((response) => response.json())
      .then((responseJson) => {
        return responseJson.paths;
      });

    let bed_api = 0;
    let bedset_api = 0;

    Object.entries(api_json).map(([key, value]) => {
      if (key.includes("/api/bed/")) {
        bed_api++;
      } else if (key.includes("/api/bedset/")) {
        bedset_api++;
      }
      return [bed_api, bedset_api];
    });

    this.setState({
      bedAPI: bed_api,
      bedSetAPI: bedset_api,
    });
  }

  render() {
    return (
      <div>
        {this.state.bedSet !== -1 ? (
          <>
            <p style={{ marginBottom: "3px" }}>
              Total BED files: {this.state.bed}  {" "}
              <Link
                data-toggle="tooltip"
                title="sample BED file"
                to={{
                  pathname: this.state.sampleBed,
                }}>
                < FaFileAlt
                  style={{
                    marginBottom: "3px",
                    marginLeft: "10px",
                    fontSize: "15px",
                  }}
                  color="black"
                />
              </Link>
            </p>
            <p>
              Total BED sets: {this.state.bedSet} {" "}
              <Link
                data-toggle="tooltip"
                title="sample BED set"
                to={{
                  pathname: this.state.sampleBedSet,
                }}>
                < FaFileAlt
                  style={{
                    marginBottom: "3px",
                    marginLeft: "10px",
                    fontSize: "15px",
                  }}
                  color="black"
                />
              </Link>
            </p>
          </>
        ) : null}
      </div>
      // <div style={{ paddingBottom: "20px", borderBottom: '1.5px solid lightgrey' }}>
      //   <h2>
      //     BEDbase Status
      //   </h2>
      //   {this.state.bedSet !== -1 ? (
      //     <table>
      //       <tbody>
      //         <tr>
      //           <th style={{ padding: "3px 15px" }}>
      //             Table Name
      //           </th>
      //           <th style={{ padding: "3px 15px" }}>Size</th>
      //           {/* <th style={{ padding: "3px 15px", fontSize: "10pt" }}>
      //               Reference Assemblies
      //             </th> */}
      //           <th style={{ padding: "3px 15px" }}>
      //             Endpoints Served
      //           </th>
      //           <th style={{ padding: "3px 15px" }}>
      //             Example
      //           </th>
      //         </tr>
      //         <tr style={{ verticalAlign: "top" }}>
      //           <td
      //             style={{
      //               padding: "3px 15px",
      //               fontWeight: "bold",
      //             }}
      //           >
      //             BED files
      //           </td>
      //           <td style={{ padding: "3px 15px" }}>
      //             {this.state.bed}
      //           </td>
      //           {/* <td style={{ padding: "3px 15px", fontSize: "10pt" }}> */}
      //           {/* {this.state.genomeList.map((value, index) => {
      //                 return (
      //                   value.genome.digest ? (
      //                     <p key={index} >
      //                       {value.genome.alias}{" "}
      //                       <a
      //                         href={"http://refgenomes.databio.org/#" + value.genome.alias}
      //                         className="home-link"
      //                         style={{ fontSize: "10pt" }}
      //                       >
      //                         [Refgenie]
      //                       </a>
      //                     </p>
      //                   ) : (
      //                     <p key={index} >
      //                       {value.genome.alias}{" "}
      //                     </p>
      //                   )
      //                 );
      //               })} */}
      //           {/* {Array.from(new Set(this.state.genomeList.map(obj => obj.genome.alias))).map((value, index) => {
      //                 return (
      //                   <span key={index} >
      //                     {value}{", "}
      //                   </span>
      //                 );
      //               })} */}
      //           {/* </td> */}
      //           <td style={{ padding: "3px 15px" }}>
      //             {this.state.bedAPI}
      //           </td>
      //           <td style={{ padding: "3px 15px" }}>
      //             <Link
      //               className="home-link"
      //               to={{
      //                 pathname: this.state.sampleBed,
      //               }}
      //             >
      //               BED splash page
      //             </Link>
      //           </td>
      //         </tr>
      //         <tr style={{ verticalAlign: "top" }}>
      //           <td
      //             style={{
      //               padding: "3px 15px",
      //               fontWeight: "bold",
      //             }}
      //           >
      //             BED sets
      //           </td>
      //           <td style={{ padding: "3px 15px" }}>
      //             {this.state.bedSet}
      //           </td>
      //           {/* <td style={{ padding: "3px 15px", fontSize: "10pt" }}> */}
      //           {/* {this.state.genomeList.map((value, index) => {
      //                 return (
      //                   value.genome.digest ? (
      //                     <p key={index} >
      //                       {value.genome.alias}{" "}
      //                       <a
      //                         href={"http://refgenomes.databio.org/#" + value.genome.alias}
      //                         className="home-link"
      //                         style={{ fontSize: "10pt" }}
      //                       >
      //                         [Refgenie]
      //                       </a>
      //                     </p>
      //                   ) : (
      //                     <p key={index} >
      //                       {value.genome.alias}{" "}
      //                     </p>
      //                   )
      //                 );
      //               })} */}
      //           {/* {Array.from(new Set(this.state.genomeList.map(obj => obj.genome.alias))).map((value, index) => {
      //                 return (
      //                   <span key={index} >
      //                     {value}{", "}
      //                   </span>
      //                 );
      //               })} */}
      //           {/* </td> */}
      //           <td style={{ padding: "3px 15px" }}>
      //             {this.state.bedSetAPI}
      //           </td>
      //           <td style={{ padding: "3px 15px" }}>
      //             <Link
      //               className="home-link"
      //               to={{
      //                 pathname: this.state.sampleBedSet,
      //               }}
      //             >
      //               BED set splash page
      //             </Link>
      //           </td>
      //         </tr>
      //       </tbody>
      //     </table>
      //   ) : (
      //     <>
      //       <Spinner
      //         animation="border"
      //         size="sm"
      //         style={{ marginBottom: "5px", marginRight: "5px", color: "lightgray" }}
      //       />
      //       <span style={{ color: "lightgray" }}>Loading data </span>
      //     </>
      //   )}
      // </div>
    )

  }
}

import React from "react";
import { withRouter } from '../Components/withRouter';
import { HashLink as Link } from "react-router-hash-link";
import { Container, Row, Col, Card } from "react-bootstrap";
import { FaExternalLinkAlt } from "react-icons/fa"
import { BsQuestionCircle } from "react-icons/bs";
import { BedSetTable, BedSetPlots, BarChart, NoRecord } from "../Components";
import bedhost_api_url from "../const/server";
import axios from "axios";
import {
  bedset_splash_cols,
  bedset_bedfiles_cols,
  bedset_stats_cols,
  bedset_distribution_cols
} from "../fastapi/bedSetQueries";
import "../style/splash.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});

class BedSetSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedSetName: "",
      bedsCount: "",
      creatTime: "",
      modifiedTime: "",
      genome: {},
      bedSetStat: [],
      avgRegionD: {},
      // bedSetDownload: [],
      // bedSetFileCols: "",
      bedSetFig: false,
      // bedSetFigCols: "",
      hubFilePath: "",
      bedSetTableData: {},
      bedSchema: {},
      code: -1
    };
  }

  async componentDidMount() {
    // get table schema via fastAPI
    const bed_schema = await api
      .get("/bed/schema")
      .then(({ data }) => data["properties"]["samples"]["properties"]);
    // console.log("bed schema: ", bed_schema)
    const bedset_schema = await api
      .get("/bedset/schema")
      .then(({ data }) => data["properties"]["samples"]["properties"]);
    // console.log("bed_set schema: ", bedset_schema)

    // // get bedsplash data via fastapi endpoints
    // let bedset_cols = ""
    // bedset_splash_cols.forEach((col, idx) => {
    //   if (idx === 0) {
    //     bedset_cols = `ids=${col}`
    //   } else {
    //     bedset_cols = `${bedset_cols}&ids=${col}`
    //   }
    // });

    const res = await api
      .get(`/bedset/${this.props.router.params.bedset_md5sum}/metadata`)
      .then(({ data }) => {
        this.setState({
          code: 200
        });
        return data;
      })
      .catch(error => {
        this.setState({
          code: error.response.status
        })
      });
    console.log("bedset data: ", res)
    if (this.state.code === 200) {
      this.setState({
        bedSetName: res.name,
        genome: res.genome,
        creatTime: res.pipestat_created_time.replace(/(.*?:.*?):.*/, '$1'),
        modifiedTime: res.pipestat_modified_time.replace(/(.*?:.*?):.*/, '$1'),
        bedSchema: bed_schema,
        hubFilePath:
          `http://genome.ucsc.edu/cgi-bin/hgTracks?db=${res.genome.alias}&hubUrl=${bedhost_api_url}/bedset/${this.props.router.params.bedset_md5sum}/track_hub`,
      });

      const avg = res.bedset_means;
      const sd = res.bedset_standard_deviation;

      let bedSetStat = []
      bedset_stats_cols.forEach((col, idx) => {
        if (avg[col] !== null) {
          bedSetStat.push({
            label: bed_schema[col].description,
            data: [avg[col].toFixed(3), sd[col].toFixed(3)]
          })
        } else {
          bedSetStat.push({
            label: bed_schema[col].description,
            data: []
          });
        }
      })
      this.setState({
        bedSetStat: bedSetStat,
      })

      let avgRegionD = {}
      bedset_distribution_cols.forEach((col, idx) => {
        let key = col + "_percentage"
        avgRegionD[col] = [avg[key].toFixed(3), sd[key].toFixed(3)]
      })
      this.setState({
        avgRegionD: avgRegionD,
      })

      // let bedSetFile = []
      // Object.entries(res).forEach(([key, value], index) => {
      //   if (typeof bedset_schema[key].object_type !== "undefined" &&
      //     bedset_schema[key].object_type === "file" &&
      //     key !== "bedset_igd_database_path") {
      //     bedSetFile.push({
      //       id: key,
      //       label: bedset_schema[key].label.replaceAll("_", " "),
      //       size: res[key].size,
      //       url:
      //         this.getFileUrl(bedset_schema[key].label),
      //       http:
      //         `${bedhost_api_url}/objects/bedset.${this.props.router.params.bedset_md5sum}.${bedset_schema[key].label}/access/http`,
      //       s3:
      //         `${bedhost_api_url}/objects/bedset.${this.props.router.params.bedset_md5sum}.${bedset_schema[key].label}/access/s3`
      //     })
      //   }
      // });

      let bedSetFig = []
      Object.entries(bedset_schema).forEach(([key, value], index) => {
        if (typeof value.object_type !== "undefined" && value.object_type === "image") {
          bedSetFig.push({
            id: key,
            src_pdf:
              `${bedhost_api_url}/objects/bedset.${this.props.router.params.bedset_md5sum}.${key}/access/http/bytes`,
            src_png:
              `${bedhost_api_url}/objects/bedset.${this.props.router.params.bedset_md5sum}.${key}/access/http/thumbnail`,
          })
        }
      });

      this.setState({
        bedSetFig: bedSetFig,
      });


      // let bed_cols = ""
      // bedset_bedfiles_cols.forEach((col, idx) => {
      //   if (idx === 0) {
      //     bed_cols = `ids=${col}`
      //   } else {
      //     bed_cols = `${bed_cols}&ids=${col}`
      //   }
      // });

      // let bedsetfig_cols = ""
      // let bedsetfile_cols = ""
      // Object.entries(bedset_schema).forEach(([key, value], index) => {
      //   if (value.object_type === "image") {
      //     if (bedsetfig_cols) {
      //       bedsetfig_cols = `${bedsetfig_cols}&ids=${key}`
      //     } else {
      //       bedsetfig_cols = `ids=${key}`
      //     }
      //   } else if (value.object_type === "file") {
      //     if (bedsetfile_cols) {
      //       bedsetfile_cols = `${bedsetfile_cols}&ids=${key}`
      //     } else {
      //       bedsetfile_cols = `ids=${key}`
      //     }
      //   }

      //   this.setState({
      //     bedSetFigCols: bedsetfig_cols,
      //     bedSetFileCols: bedsetfile_cols,
      //   });
      // });

      const res_bed = await api
        .get(`/bedset/${this.props.router.params.bedset_md5sum}/bedfiles?metadata=true`)
        .then(({ data }) => data.bedfile_metadata);
      // console.log("bedset data: ", res_bed)

      this.setState({
        bedsCount: res_bed.length,
        bedSetTableData: res_bed,
      });
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.router.params.bedset_md5sum !== this.props.router.params.bedset_md5sum) {
      window.location.reload(true);
    }
  }

  // async getFileUrl(file) {
  //   let url = await api.get(`${bedhost_api_url}/objects/bedset.${this.props.router.params.bedset_md5sum}.${file}/access/http`).then(({ data }) => data)
  //   return url
  // }

  render() {
    return (
      <React.StrictMode>
        {this.state.code === 404 ? (
          <NoRecord
            type="bedset"
            md5sum={this.props.router.params.bedset_md5sum}
          />
        ) : (
          <div className="conten-body">
            <Container
              style={{ width: "75%", minWidth: "900px" }}
              fluid
              className="p-4"
            >
              <Row className="justify-content-between">
                <Col md="10">
                  <h3>
                    BED Set: {this.state.bedSetName}
                    <a href={
                      `${bedhost_api_url}/bedset/${this.props.router.params.bedset_md5sum}/metadata`
                    }>
                      <FaExternalLinkAlt
                        style={{
                          marginBottom: "3px",
                          marginLeft: "10px",
                          fontSize: "15px",
                        }}
                        color="teal"
                      />
                    </a>
                  </h3>
                  <span> ID: {this.props.router.params.bedset_md5sum} </span>
                </Col>
                <Col md="auto">
                  <a href={this.state.hubFilePath}>
                    <button
                      className="float-right btn btn-primary"
                      style={{
                        backgroundColor: "teal",
                        borderColor: "teal"
                      }}
                    >
                      Genome Browser
                    </button>
                  </a>
                </Col>
              </Row>
            </Container>
            <Container
              style={{ width: "75%", minWidth: "900px" }}
              fluid
              className="p-4"
            >
              <Row>
                <Col sm={5} md={5}>
                  <Card style={{ marginBottom: '10px' }}>
                    <Card.Header>
                      Summary
                    </Card.Header>
                    <Card.Body
                      style={{
                        padding: "10px",
                        minHeight: "125px"
                      }}
                    >
                      <Col>
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                          <label
                            style={{
                              fontWeight: "bold",
                              width: '208px',
                              display: "block",
                              textAlign: "right"
                            }}
                          >
                            Total BED:
                          </label>
                          <div style={{
                            marginLeft: "10px"
                          }}>
                            {this.state.bedsCount}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                          <label
                            style={{
                              fontWeight: "bold",
                              width: '208px',
                              display: "block",
                              textAlign: "right"
                            }}
                          >
                            Genome:
                          </label>
                          <div style={{
                            marginLeft: "10px"
                          }}>
                            {this.state.genome.alias}
                            {this.state.genome.digest !== "" ? (
                              <a
                                href={
                                  `http://refgenomes.databio.org/v3/genomes/splash/${this.state.genome.digest}`
                                }
                                className="home-link"
                                style={{
                                  marginLeft: "15px",
                                  fontWeight: "bold",
                                }}
                              >
                                [Refgenie]
                              </a>
                            ) : null
                            }
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                          <label
                            style={{
                              fontWeight: "bold",
                              width: '208px',
                              display: "block",
                              textAlign: "right"
                            }}
                          >
                            Created time:
                          </label>
                          <div style={{
                            marginLeft: "10px"
                          }}>
                            {this.state.creatTime}
                          </div>
                        </div> <div style={{ display: 'flex', flexDirection: 'row' }}>
                          <label
                            style={{
                              fontWeight: "bold",
                              width: '208px',
                              display: "block",
                              textAlign: "right"
                            }}
                          >
                            Last modified:
                          </label>
                          <div style={{
                            marginLeft: "10px"
                          }}>
                            {this.state.modifiedTime}
                          </div>
                        </div>
                      </Col>
                    </Card.Body>
                  </Card>
                  <Card style={{ marginBottom: '10px' }}>
                    <Card.Header>
                      Statistics (mean|sd)
                      <Link to="/about#bedset-stats">
                        <BsQuestionCircle
                          style={{
                            marginBottom: "3px",
                            marginLeft: "10px",
                            fontSize: "15px",
                          }}
                          color="black"
                        />
                      </Link>
                    </Card.Header>
                    <Card.Body
                      style={{
                        padding: "10px",
                        minHeight: "125px"
                      }}
                    >
                      <Col component={'span'}>
                        {this.state.bedSetStat.map((value, index) => {
                          return value.data.length !== 0 ? (
                            <div key={index} style={{ display: 'flex', flexDirection: 'row' }}>
                              <label
                                style={{
                                  fontWeight: "bold",
                                  width: '208px',
                                  display: "block",
                                  textAlign: "right"
                                }}
                              >
                                {value.label ===
                                  "Median absolute distance from transcription start sites" ? (
                                  <>Median TSS distance: </>
                                ) : (
                                  <>{value.label}: </>
                                )}

                              </label>
                              <div style={{
                                marginLeft: "10px"
                              }}>
                                {value.data[0]} {"|"} {value.data[1]}
                              </div>

                            </div>) : null
                        })}
                      </Col>
                    </Card.Body>
                  </Card>
                  {/* <Card>
                  <Card.Header>
                    Downloads
                  </Card.Header>
                  <Card.Body
                    style={{
                      padding: "10px",
                    }}
                  >
                    <Col component={'span'}>
                      {this.state.bedSetDownload.map((file, index) => {
                        return (
                          <p style={{ marginBottom: "5px" }} key={index}>
                            <a
                              href={file.url}
                              className="home-link"
                              style={{
                                marginLeft: "15px",
                                fontWeight: "bold",
                              }}
                            >
                              {" "} http {" "}
                            </a> |
                            <a href={file.s3} className="home-link" style={{ fontWeight: "bold" }}>
                              {" "} s3  {" "}
                            </a>
                            : {" "}{file.label} {" "} ({file.size})
                          </p>
                        );
                      })}
                    </Col>
                  </Card.Body>
                </Card> */}
                </Col>
                <Col sm={7} md={7}>
                  <Card style={{ height: '345px' }}>
                    <Card.Header>
                      BED Set Plots
                    </Card.Header>
                    <Card.Body
                      style={{
                        padding: "10px",
                      }}
                    >
                      <Col component={'span'}>
                        <Row>
                          <Col>
                            {Object.keys(this.state.avgRegionD).length !== 0 ? (
                              <BarChart stats={this.state.avgRegionD} />
                            ) : null}
                          </Col>
                          <Col>
                            {this.state.bedSetFig ? (
                              <BedSetPlots bedset_figs={this.state.bedSetFig} />
                            ) : null}
                          </Col>
                        </Row>
                      </Col>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
            <Container
              style={{ width: "75%", minWidth: "900px" }}
              fluid
              className="p-4"
            >
              <h4 style={{ marginBottom: "10px" }}>
                BED File Comparison
              </h4>
              <div style={{ marginLeft: "15px" }}>
                <span className={"new-line"}>
                  The table below shows the statistics of each BED file in this
                  BED set. {"\n"}
                  The statistics of the reginal distributions are shown in
                  frequency by default. You can click on the
                  toggle button to switch between statistics showing in frequency
                  and percentage. {"\n"}
                  You can compare the GenomicDistribution plots of multiple BED
                  files by: {"\n"}
                  <p style={{ marginLeft: "40px" }}>
                    1) select the BED files you want to compare using the select box
                    in the left-most column, and {"\n"}
                    2) select one plot type you want to compare using the dropdown button
                    on the top right corner of the table. {"\n"}
                  </p>
                </span>
              </div>
              {Object.keys(this.state.bedSetTableData).length > 0 ? (
                <BedSetTable
                  bedset_md5sum={this.props.router.params.bedset_md5sum}
                  bedSetTableData={this.state.bedSetTableData}
                  schema={this.state.bedSchema}
                />) : null}
            </Container>
          </div>
        )}
      </React.StrictMode>
    );
  }
}

export default withRouter(BedSetSplash);
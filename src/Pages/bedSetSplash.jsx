import React from "react";
import { HashLink as Link } from "react-router-hash-link";
import { Container, Row, Col, Card } from "react-bootstrap";
import { FaExternalLinkAlt } from "react-icons/fa"
import { BsQuestionCircle } from "react-icons/bs";
import { BedSetTable, BedSetPlots, BarChart } from "../Components";
import bedhost_api_url from "../const/server";
import axios from "axios";
import { bedset_splash_cols, bedset_bedfiles_cols } from "../fastapi/bedSetQueries";
import "../style/splash.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedSetSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedSetName: "",
      bedsCount: "",
      genome: {},
      bedSetStat: [],
      avgRegionD: {},
      bedSetDownload: [],
      bedSetFileCols: "",
      bedSetFig: false,
      bedSetFigCols: "",
      hubFilePath: "",
      description: "",
      bedSetTableData: {},
      bedSchema: {}
    };
  }

  async componentDidMount() {
    // get table schema via fastAPI
    const bed_schema = await api
      .get("/api/bed/schema")
      .then(({ data }) => data);
    const bedset_schema = await api
      .get("/api/bedset/schema")
      .then(({ data }) => data);

    // get bedsplash data via fastapi endpoints
    let bedset_cols = ""
    bedset_splash_cols.forEach((col, idx) => {
      if (idx === 0) {
        bedset_cols = `ids=${col}`
      } else {
        bedset_cols = `${bedset_cols}&ids=${col}`
      }
    });

    const result = await api
      .get(`/api/bedset/${this.props.match.params.bedset_md5sum}/metadata?${bedset_cols}`)
      .then(({ data }) => data);

    let res = {}
    result.columns.forEach((key, i) => res[key] = result.data[0][i]);

    const avg = res.bedset_means;
    const sd = res.bedset_standard_deviation;

    let bedSetFile = []
    Object.entries(res).forEach(([key, value], index) => {
      if (bedset_schema[key] &&
        bedset_schema[key].type === "file" &&
        key !== "bedset_igd_database_path") {
        bedSetFile.push({
          id: key,
          label: bedset_schema[key].label.replaceAll("_", " "),
          size: res[key].size,
          url:
            `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/file/${bedset_schema[key].label}`,
          http:
            `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/file_path/${bedset_schema[key].label}?remoteClass=http`,
          s3:
            `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/file_path/${bedset_schema[key].label}?remoteClass=s3`
        })
      }
    });

    let bedSetFig = []
    Object.entries(res).forEach(([key, value], index) => {
      if (bedset_schema[key] &&
        bedset_schema[key].type === "image") {
        bedSetFig.push({
          id: key,
          src_pdf:
            `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/img/${bedset_schema[key].label}?format=pdf`,
          src_png:
            `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/img/${bedset_schema[key].label}?format=png`,
        })
      }
    });


    let bed_cols = ""
    bedset_bedfiles_cols.forEach((col, idx) => {
      if (idx === 0) {
        bed_cols = `ids=${col}`
      } else {
        bed_cols = `${bed_cols}&ids=${col}`
      }
    });

    let bedsetfig_cols = ""
    let bedsetfile_cols = ""
    Object.entries(bedset_schema).forEach(([key, value], index) => {
      if (value.type === "image") {
        if (bedsetfig_cols) {
          bedsetfig_cols = `${bedsetfig_cols}&ids=${key}`
        } else {
          bedsetfig_cols = `ids=${key}`
        }
      } else if (value.type === "file") {
        if (bedsetfile_cols) {
          bedsetfile_cols = `${bedsetfile_cols}&ids=${key}`
        } else {
          bedsetfile_cols = `ids=${key}`
        }
      }

      this.setState({
        bedSetFigCols: bedsetfig_cols,
        bedSetFileCols: bedsetfile_cols,
      });
    });

    const result_bed = await api
      .get(`/api/bedset/${this.props.match.params.bedset_md5sum}/bedfiles?${bed_cols}`)
      .then(({ data }) => data);

    let res_bed = []
    result_bed.data.forEach((bed, i) => {
      let data = {}
      result_bed.columns.forEach((key, i) => data[key] = bed[i])
      res_bed.push(data)
    });

    this.setState({
      bedSetName: res.name,
      genome: res.genome,
      bedSetDownload: bedSetFile,
      bedSetFig: bedSetFig,
      bedsCount: res_bed.length,
      bedSetTableData: res_bed,
      bedSchema: bed_schema,
      hubFilePath:
        `http://genome.ucsc.edu/cgi-bin/hgTracks?db=${res.genome.alias}&hubUrl=${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/track_hub`,
      bedSetStat: [
        {
          label: bed_schema["gc_content"].description,
          data: [avg.gc_content.toFixed(3), sd.gc_content.toFixed(3)],
        },
        {
          label: bed_schema["median_tss_dist"].description,
          data: [
            avg.median_tss_dist.toFixed(3),
            sd.median_tss_dist.toFixed(3),
          ],
        },
        {
          label: bed_schema["mean_region_width"].description,
          data: [
            avg.mean_region_width.toFixed(3),
            sd.mean_region_width.toFixed(3),
          ],
        },
      ],
      avgRegionD: {
        exon: [avg.exon_percentage.toFixed(3), sd.exon_percentage.toFixed(3)],
        fiveutr: [
          avg.fiveutr_percentage.toFixed(3),
          sd.fiveutr_percentage.toFixed(3),
        ],
        intergenic: [
          avg.intergenic_percentage.toFixed(3),
          sd.intergenic_percentage.toFixed(3),
        ],
        intron: [
          avg.intron_percentage.toFixed(3),
          sd.intron_percentage.toFixed(3),
        ],
        threeutr: [
          avg.threeutr_percentage.toFixed(3),
          sd.threeutr_percentage.toFixed(3),
        ],
      },
    });
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.match.params.bedset_md5sum !== this.props.match.params.bedset_md5sum) {
      window.location.reload(true);
    }
  }

  render() {
    return (
      <React.StrictMode>
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
                    `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/metadata`
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
                <span> md5sum: {this.props.match.params.bedset_md5sum} </span>
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
                          genome:
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
                          total BED:
                        </label>
                        <div style={{
                          marginLeft: "10px"
                        }}>
                          {this.state.bedsCount}
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
                    <a href={
                      `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/metadata?ids=bedset_standard_deviation&ids=bedset_means`
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
                  </Card.Header>
                  <Card.Body
                    style={{
                      padding: "10px",
                    }}
                  >
                    <Col component={'span'}>
                      {this.state.bedSetStat.map((value, index) => {
                        return value.data !== null ? (
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
                <Card>
                  <Card.Header>
                    Downloads
                    <a href={
                      `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/metadata?${this.state.bedSetFileCols}`
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
                </Card>
              </Col>
              <Col sm={7} md={7}>
                <Card style={{ minHeight: '445px' }}>
                  <Card.Header>
                    BED Set Plots
                    <a href={
                      `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/metadata?${this.state.bedSetFigCols}`
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
                bedset_md5sum={this.props.match.params.bedset_md5sum}
                bedSetTableData={this.state.bedSetTableData}
                schema={this.state.bedSchema}
              />) : null}
          </Container>
        </div>
      </React.StrictMode>
    );
  }
}

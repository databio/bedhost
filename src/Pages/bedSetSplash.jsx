import React from "react";
import { HashLink as Link } from "react-router-hash-link";
import { Container, Row, Col } from "react-bootstrap";
import { FaQuestionCircle } from "react-icons/fa";
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
      bedSetFig: false,
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
            <Row>
              <Col md="10">
                <h3> BED Set: {this.state.bedSetName}</h3>
                <span> md5sum: {this.props.match.params.bedset_md5sum} </span>
              </Col>
              <Col>
                <a href={this.state.hubFilePath}>
                  <button
                    className="float-right btn btn-primary"
                    style={{ backgroundColor: "teal" }}
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
                <h4> Summary </h4>
                <table style={{ marginBottom: "10px" }}>
                  <tbody>
                    <tr style={{ verticalAlign: "top" }}>
                      {/* <td
                        style={{
                          padding: "3px 10pt",
                          fontWeight: "bold",
                          width: '150px'
                        }}
                      >
                        md5sum
                      </td>
                      <td style={{ padding: "3px 10pt" }}>
                        {this.props.match.params.bedset_md5sum}
                      </td> */}
                    </tr>
                    <tr style={{ verticalAlign: "top" }}>
                      <td
                        style={{
                          padding: "3px 10pt",
                          fontWeight: "bold",
                          width: '200px'
                        }}
                      >
                        genome
                      </td>
                      <td style={{ padding: "3px 10pt" }}>
                        <>
                          <span>{this.state.genome.alias}</span>
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
                        </>
                      </td>
                    </tr>
                    <tr style={{ verticalAlign: "top" }}>
                      <td
                        style={{
                          padding: "3px 10pt",
                          fontWeight: "bold",
                          width: '200px'
                        }}
                      >
                        total BED
                      </td>
                      <td style={{ padding: "3px 10pt" }}>
                        {this.state.bedsCount}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h4>
                  Statistics
                  <Link to="/about#bedset-stats">
                    <FaQuestionCircle
                      style={{
                        marginBottom: "3px",
                        marginLeft: "10px",
                        fontSize: "15px",
                      }}
                      color="black"
                    />
                  </Link>
                </h4>
                <table style={{ marginBottom: "10px" }}>
                  <tbody>
                    <tr>
                      <th> </th>
                      <th style={{ padding: "3px 10pt" }}>
                        AVG
                      </th>
                      <th style={{ padding: "3px 10pt" }}>
                        SD
                      </th>
                    </tr>
                    {this.state.bedSetStat.map((value, index) => (
                      <tr style={{ verticalAlign: "top" }} key={index}>
                        <td
                          style={{
                            padding: "3px 10pt",
                            fontWeight: "bold",
                            width: '200px'
                          }}
                        >
                          {value.label ===
                            "Median absolute distance from transcription start sites" ? (
                            <>Median TSS distance</>
                          ) : (
                            <>{value.label}</>
                          )}
                        </td>
                        <td style={{ padding: "3px 10pt" }}>
                          {value.data[0]}
                        </td>
                        <td style={{ padding: "3px 10pt" }}>
                          {value.data[1]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4> Downloads </h4>
                {this.state.bedSetDownload.map((file, index) => {
                  return (
                    <p style={{ marginBottom: "5px" }} key={file.id}>
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

                {/* <h4 style={{ marginTop: "10px" }}>  API Endpoints </h4>
                <p style={{ marginBottom: "5px" }}>
                  <a
                    href={
                      `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/metadata`
                    }
                    className="home-link"
                    style={{
                      marginLeft: "15px",
                      fontWeight: "bold",
                    }}
                  >
                    All data
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a
                    href={
                      `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/bedfiles`
                    }
                    className="home-link"
                    style={{
                      marginLeft: "15px",
                      fontWeight: "bold",
                    }}
                  >
                    BED files data
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a
                    href={
                      `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/metadata?ids=bedset_means&ids=bedset_standard_deviation`
                    }
                    className="home-link"
                    style={{
                      marginLeft: "15px",
                      fontWeight: "bold",
                    }}
                  >
                    BED set stats
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a
                    href={
                      `${bedhost_api_url}/api/bedset/${this.props.match.params.bedset_md5sum}/metadata?ids=region_commonality`
                    }
                    className="home-link"
                    style={{
                      marginLeft: "15px",
                      fontWeight: "bold",
                    }}
                  >
                    BED set plot
                  </a>
                </p> */}
              </Col>
              <Col md={7}>
                <h4 style={{ marginBottom: "10px" }}>
                  BED Set Plots
                </h4>
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
                frequency by default. You can click on the{" "}
                <b> SHOW PERCENTAGE</b> button to show reginal distributions in
                percentage. {"\n"}
                You can compare the GenomicDistribution plots of multiple BED
                files by: {"\n"}
                <p style={{ marginLeft: "40px" }}>
                  1) select the BED files you want to compare using the select box
                  in the left-most column, and {"\n"}
                  2) select one plot type you want to compare using the buttons
                  below the table. {"\n"}
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

import React from "react";
import Header from "./header";
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import BedSetTable from "./bedSetTable";
import BedSetPlots from "./bedSetPlots";
import BarChart from "./barChart";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import axios from "axios";
import { Label } from "semantic-ui-react";
import { HashLink as Link } from "react-router-hash-link";
import { FaQuestionCircle } from "react-icons/fa";
import bedhost_api_url, { client } from "./const/server";
import {
  GET_BEDSET_NAME,
  GET_BEDSET_GENOME,
  GET_BEDSET_STATS,
  GET_BEDSET_DOWNLOADS,
  GET_BEDSET_FIGS,
} from "./graphql/bedSetQueries";
import "./style/splash.css";

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
    };
  }

  async componentDidMount() {
    // get table schema via fastAPI
    const bed_schema = await api
      .get("/api/bed/all/schema")
      .then(({ data }) => data);
    const bedset_schema = await api
      .get("/api/bedset/all/schema")
      .then(({ data }) => data);

    // get bed name via Graphql
    const bedset_name = await client
      .query({
        query: GET_BEDSET_NAME,
        variables: { md5sum: this.props.match.params.bedset_md5sum },
      })
      .then(({ data }) => data.bedsets.edges[0].node.name);

    // get bedset genome via Graphql
    const genome = await client
      .query({
        query: GET_BEDSET_GENOME,
        variables: { md5sum: this.props.match.params.bedset_md5sum },
      })
      .then(({ data }) => data.bedsets.edges[0].node.genome);

    // get bedset stats via Graphql
    const stats = await client
      .query({
        query: GET_BEDSET_STATS,
        variables: { md5sum: this.props.match.params.bedset_md5sum },
      })
      .then(({ data }) => data.bedsets.edges[0].node);

    const avg = JSON.parse(stats.bedsetMeans);
    const sd = JSON.parse(stats.bedsetStandardDeviation);
    
    this.setState({
      bedSetName: bedset_name,
      genome: JSON.parse(genome),
      hubFilePath:
        "http://genome.ucsc.edu/cgi-bin/hgTracks?db=" +
        JSON.parse(genome).alias +
        "&hubUrl=http://data.bedbase.org/outputs/bedbuncher_output/" +
        this.props.match.params.bedset_md5sum +
        "/bedsetHub/hub.txt",
      bedSetStat: [
        {
          label: bed_schema["gc_content"].description,
          data: [avg.gc_content.toFixed(3), sd.gc_content.toFixed(3)],
        },
        {
          label: bed_schema["mean_absolute_tss_dist"].description,
          data: [
            avg.mean_absolute_tss_dist.toFixed(3),
            sd.mean_absolute_tss_dist.toFixed(3),
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

    // get bedset files via Graphql
    const files = await client
      .query({
        query: GET_BEDSET_DOWNLOADS,
        variables: { md5sum: this.props.match.params.bedset_md5sum },
      })
      .then(({ data }) => data.bedsets.edges[0].node);

    

    let bedSetFile = Object.entries(files).map(([key, value], index) => {
      return {
        id: key,
        label: bedset_schema[
          key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
        ].label.replaceAll("_", " "),
        url:
          bedhost_api_url +
          "/api/bedset/" +
          this.props.match.params.bedset_md5sum +
          "/file/" +
          bedset_schema[
            key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
          ].label,
      };
    });
    this.setState({ bedSetDownload: bedSetFile });

    // get bedset figures via Graphql
    const figs = await client
      .query({
        query: GET_BEDSET_FIGS,
        variables: { md5sum: this.props.match.params.bedset_md5sum },
      })
      .then(({ data }) => data.bedsets.edges[0].node);

    let bedSetFig = Object.entries(figs).map(([key, value], index) => {
      return {
        id: key,
        src_pdf:
          bedhost_api_url +
          "/api/bedset/" +
          this.props.match.params.bedset_md5sum +
          "/img/" +
          bedset_schema[
            key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
          ].label +
          "?format=pdf",
        src_png:
          bedhost_api_url +
          "/api/bedset/" +
          this.props.match.params.bedset_md5sum +
          "/img/" +
          bedset_schema[
            key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
          ].label +
          "?format=png",
      };
    });
    this.setState({ bedSetFig: bedSetFig });

    // const data = await api
    //   .get("/api/bedset/" + this.props.match.params.bedset_md5sum + "/bedfiles")
    //   .then(({ data }) => data);
    // this.setState({
    //   bedsCount: Object.keys(data.data).length,
    // });
  }

  render() {
    return (
      <React.StrictMode>
        <Header />
        <div className="conten-body">
          <Container
            style={{ width: "75%", minWidth: "900px" }}
            fluid
            className="p-4"
          >
            <Row>
              <Col md="10">
                <h1>BED Set: {this.state.bedSetName}</h1>
              </Col>
              <Col>
                <a href={this.state.hubFilePath}>
                  <button className="float-right btn primary-btn">
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
                <Label
                  style={{
                    marginLeft: "15px",
                    fontSize: "15px",
                    padding: "6px 20px 6px 30px",
                  }}
                  color="teal"
                  ribbon
                >
                  BED Set Info
                </Label>
                <table>
                  <tbody>
                    <tr style={{ verticalAlign: "top" }}>
                      <td
                        style={{
                          padding: "3px 15px",
                          fontSize: "10pt",
                          fontWeight: "bold",
                          color: "teal",
                        }}
                      >
                        md5sum
                      </td>
                      <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                        {this.props.match.params.bedset_md5sum}
                      </td>
                    </tr>
                    <tr style={{ verticalAlign: "top" }}>
                      <td
                        style={{
                          padding: "3px 15px",
                          fontSize: "10pt",
                          fontWeight: "bold",
                          color: "teal",
                        }}
                      >
                        genome
                      </td>
                      <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                        <>
                          <span>{this.state.genome.alias}</span>
                          <a
                            href={"http://rg.databio.org/v3/genomes/splash/" + this.state.genome.digest}
                            className="home-link"
                            style={{
                              marginLeft: "15px",
                              fontSize: "10pt",
                              fontWeight: "bold",
                            }}
                          >
                            [Refgenie]
                          </a>
                        </>
                      </td>
                    </tr>
                    <tr style={{ verticalAlign: "top" }}>
                      <td
                        style={{
                          padding: "3px 15px",
                          fontSize: "10pt",
                          fontWeight: "bold",
                          color: "teal",
                        }}
                      >
                        total BED
                      </td>
                      <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                        {this.state.bedsCount}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <Label
                  style={{
                    marginTop: "15px",
                    marginLeft: "15px",
                    fontSize: "15px",
                    padding: "6px 20px 6px 30px",
                  }}
                  color="teal"
                  ribbon
                >
                  BED Set Stats
                  <Link to="/about#bedset-stats">
                    <FaQuestionCircle
                      style={{
                        marginBottom: "3px",
                        marginLeft: "10px",
                        fontSize: "12px",
                      }}
                      color="white"
                    />
                  </Link>
                </Label>
                <table>
                  <tbody>
                    <tr>
                      <th> </th>
                      <th style={{ padding: "3px 15px", fontSize: "10pt" }}>
                        AVG
                      </th>
                      <th style={{ padding: "3px 15px", fontSize: "10pt" }}>
                        SD
                      </th>
                    </tr>
                    {this.state.bedSetStat.map((value, index) => (
                      <tr style={{ verticalAlign: "top" }} key={index}>
                        <td
                          style={{
                            padding: "3px 15px",
                            fontSize: "10pt",
                            fontWeight: "bold",
                            color: "teal",
                          }}
                        >
                          {value.label ===
                          "Mean absolute distance from transcription start sites" ? (
                            <>Mean absolute distance from TSS</>
                          ) : (
                            <>{value.label}</>
                          )}
                        </td>
                        <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                          {value.data[0]}
                        </td>
                        <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                          {value.data[1]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Label
                  style={{
                    marginTop: "15px",
                    marginBottom: "5px",
                    marginLeft: "15px",
                    fontSize: "15px",
                    padding: "6px 20px 6px 30px",
                  }}
                  color="teal"
                  ribbon
                >
                  BED Set Downloads
                </Label>
                {this.state.bedSetDownload.map((file, index) => {
                  return (
                    <p style={{ marginBottom: "5px" }} key={file.id}>
                      <a
                        href={file.url}
                        className="home-link"
                        style={{
                          marginLeft: "15px",
                          fontSize: "10pt",
                          fontWeight: "bold",
                        }}
                      >
                        {file.label}
                      </a>
                    </p>
                  );
                })}

                <Label
                  style={{
                    marginTop: "15px",
                    marginBottom: "5px",
                    marginLeft: "15px",
                    fontSize: "15px",
                    padding: "6px 20px 6px 30px",
                  }}
                  color="teal"
                  ribbon
                >
                  API Endpoint Examples
                </Label>
                <p style={{ marginBottom: "5px" }}>
                  <a
                    href={
                      bedhost_api_url +
                      "/api/bedset/" +
                      this.props.match.params.bedset_md5sum +
                      "/data"
                    }
                    className="home-link"
                    style={{
                      marginLeft: "15px",
                      fontSize: "10pt",
                      fontWeight: "bold",
                    }}
                  >
                    All data
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a
                    href={
                      bedhost_api_url +
                      "/api/bedset/" +
                      this.props.match.params.bedset_md5sum +
                      "/bedfiles"
                    }
                    className="home-link"
                    style={{
                      marginLeft: "15px",
                      fontSize: "10pt",
                      fontWeight: "bold",
                    }}
                  >
                    BED files data
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a
                    href={
                      bedhost_api_url +
                      "/api/bedset/" +
                      this.props.match.params.bedset_md5sum +
                      "/data?ids=bedset_means&ids=bedset_standard_deviation"
                    }
                    className="home-link"
                    style={{
                      marginLeft: "15px",
                      fontSize: "10pt",
                      fontWeight: "bold",
                    }}
                  >
                    BED set stats
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a
                    href={
                      bedhost_api_url +
                      "/api/bedset/" +
                      this.props.match.params.bedset_md5sum +
                      "/data?ids=region_commonality"
                    }
                    className="home-link"
                    style={{
                      marginLeft: "15px",
                      fontSize: "10pt",
                      fontWeight: "bold",
                    }}
                  >
                    BED set plot
                  </a>
                </p>
              </Col>
              <Col sm={7} md={7}>
                <Row>
                  <Col>
                    <Label
                      style={{
                        marginLeft: "15px",
                        fontSize: "15px",
                        padding: "6px 20px 6px 30px",
                      }}
                      color="teal"
                      ribbon
                    >
                      BED Set Plots
                    </Label>
                    {this.state.bedSetFig ? (
                      <BedSetPlots bedset_figs={this.state.bedSetFig} />
                    ) : null}
                  </Col>
                  <Col>
                    {Object.keys(this.state.avgRegionD).length !== 0 ? (
                      <BarChart stats={this.state.avgRegionD} />
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
            <Label
              style={{
                marginLeft: "15px",
                fontSize: "15px",
                padding: "6px 20px 6px 30px",
              }}
              color="teal"
              ribbon
            >
              BED File Comparison
            </Label>
            <div style={{ marginLeft: "15px" }}>
              <span className={"new-line"}>
                {"\n"}
                The table below shows the statistics of each BED file in this
                BED set. {"\n"}
                The statistics of the reginal distributions are shown in
                frequency by default. You can click on the{" "}
                <b> SHOW PERCENTAGE</b> button to show reginal distributions in
                percentage. {"\n"}
                You can compare the GenomicDistribution plots of multiple BED
                files by: {"\n"}
                1) select the BED files you want to compare using the select box
                in the left-most column, and {"\n"}
                2) select one plot type you want to compare using the buttons
                below the table. {"\n"}
              </span>
            </div>
            <BedSetTable
              bedset_md5sum={this.props.match.params.bedset_md5sum}
            />
          </Container>
        </div>
        <VersionsSpan />
      </React.StrictMode>
    );
  }
}

import React from "react";
import Header from "./header";
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import axios from "axios";
import ImgGrid from "./imgGrid";
import BedInfo from "./bedInfo";
import { Label } from "semantic-ui-react";
import "./style/splash.css";
import bedhost_api_url, { client } from "./const/server";
import {
  GET_BED_NAME,
  GET_BED_GENOME,
  GET_BED_FIGS,
  GET_BED_FILES,
} from "./graphql/bedQueries";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedName: "",
      bedFig: [],
      bedFiles: [],
      bedDownload: {},
      trackPath: "",
      bigbed: false,
    };
  }

  async componentDidMount() {
    let schema = await api.get("/api/bed/all/schema").then(({ data }) => data);
    console.log("schema: ", schema);

    await api
      .get("/api/bed/" + this.props.match.params.bed_md5sum + "/file/bigBed")
      .then(this.setState({ bigbed: true }))
      .catch((err) => {
        if (err.response.status === 404) {
          this.setState({ bigbed: false });
        }
      });

    // get bed name via Graphql
    const bed_name = await client
      .query({
        query: GET_BED_NAME,
        variables: { md5sum: this.props.match.params.bed_md5sum },
      })
      .then(({ data }) => data.bedfiles.edges[0].node.name);

    const genome = await client
      .query({
        query: GET_BED_GENOME,
        variables: { md5sum: this.props.match.params.bed_md5sum },
      })
      .then(({ data }) => data.bedfiles.edges[0].node.genome);

    this.setState({
      bedName: bed_name,
      trackPath:
        "http://genome.ucsc.edu/cgi-bin/hgTracks?db=" +
        genome +
        "&mappability=full&hgct_customText=http://data.bedbase.org/bigbed_files/" +
        bed_name +
        ".bigBed",
    });

    // get bed figures via Graphql
    const bed_figs = await client
      .query({
        query: GET_BED_FIGS,
        variables: { md5sum: this.props.match.params.bed_md5sum },
      })
      .then(({ data }) => data.bedfiles.edges[0].node);

    let newbedFig = Object.entries(bed_figs).map(([key, value], index) => {
      return {
        id: key,
        title: JSON.parse(value).title,
        src_pdf:
          bedhost_api_url +
          "/api/bed/" +
          this.props.match.params.bed_md5sum +
          "/img/" +
          schema[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)]
            .label +
          "?format=pdf",
        src_png:
          bedhost_api_url +
          "/api/bed/" +
          this.props.match.params.bed_md5sum +
          "/img/" +
          schema[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)]
            .label +
          "?format=png",
      };
    });

    this.setState({ bedFig: newbedFig });

    // get bed files via Graphql
    const files = await client
      .query({
        query: GET_BED_FILES,
        variables: { md5sum: this.props.match.params.bed_md5sum },
      })
      .then(({ data }) => data.bedfiles.edges[0].node);

    let newbedFiles = {}
    Object.entries(files).map(([key, value], index) => {
      newbedFiles[key] = JSON.parse(value).size;
      return
    });

    this.setState({ bedFiles: newbedFiles });

    if (this.state.bigbed) {
      this.setState({
        bedDownload: {
          BED_File: {
            id: "bedfile",
            label: "BED file",
            url: bedhost_api_url +
              "/api/bed/" +
              this.props.match.params.bed_md5sum +
              "/file/bed",
            http: bedhost_api_url +
              "/api/bed/" +
              this.props.match.params.bed_md5sum +
              "/file_path/bigBed?remoteClass=http",
            s3: bedhost_api_url +
              "/api/bed/" +
              this.props.match.params.bed_md5sum +
              "/file_path/bigBed?remoteClass=s3"
          },
          bigBED_File: {
            id: "bigbedfile",
            label: "bigBed file",
            url:
              bedhost_api_url +
              "/api/bed/" +
              this.props.match.params.bed_md5sum +
              "/file/bigBed",
            http: bedhost_api_url +
              "/api/bed/" +
              this.props.match.params.bed_md5sum +
              "/file_path/bigBed?remoteClass=http",
            s3: bedhost_api_url +
              "/api/bed/" +
              this.props.match.params.bed_md5sum +
              "/file_path/bigBed?remoteClass=s3"
          },
        },
      });
    } else {
      this.setState({
        bedDownload: {
          BED_File: {
            id: "bedfile",
            label: "BED file",
            url:
              bedhost_api_url +
              "/api/bed/" +
              this.props.match.params.bed_md5sum +
              "/file/bed",
            http: bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/file_path/bed?remoteClass=http",
            s3: bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/file_path/bed?remoteClass=s3"
          },
        },
      });
    }
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
              <Col>
                <h1>BED File: {this.state.bedName}</h1>
              </Col>
              <Col>
                {this.state.bigbed ? (
                  <a href={this.state.trackPath}>
                    <button className="float-right btn primary-btn">
                      Genome Browser
                    </button>
                  </a>
                ) : null}
              </Col>
            </Row>
          </Container>
          <Container
            style={{ width: "75%", minWidth: "900px" }}
            fluid
            className="p-4"
          >
            <Row>
              <Col sm={4} md={4}>
                <BedInfo bed_md5sum={this.props.match.params.bed_md5sum} />
                <Label
                  style={{
                    marginTop: "15px",
                    marginBottom: "5px",
                    marginLeft: "15px",
                    fontSize: "15px",
                    padding: "6px 20px 6px 30px",
                  }}
                  as="a"
                  color="teal"
                  ribbon
                >
                  BED File Download
                </Label>
                {Object.entries(this.state.bedDownload).map(
                  ([key, value], index) => (
                    <p style={{ marginBottom: "5px" }} key={index}>
                      <a
                        href={value.url}
                        className="home-link"
                        style={{
                          marginLeft: "15px",
                          fontSize: "10pt",
                          fontWeight: "bold",
                        }}
                      >
                        http
                      </a> | <a href={value.s3} className="home-link" style={{ fontSize: "10pt", fontWeight: "bold" }}>
                        s3
                      </a>
                      : {value.label} ({this.state.bedFiles[value.id]})
                    </p>
                  )
                )}

              </Col>
              <Col sm={8} md={8}>
                <Label
                  style={{
                    marginBottom: "15px",
                    marginLeft: "15px",
                    fontSize: "15px",
                    padding: "6px 20px 6px 30px",
                  }}
                  as="a"
                  color="teal"
                  ribbon
                >
                  GenomicDistribution Plots
                </Label>
                {this.state.bedFig ? (
                  <ImgGrid imgList={this.state.bedFig} page="bed" />
                ) : null}
              </Col>
            </Row>
          </Container>
        </div>
        <VersionsSpan />
      </React.StrictMode>
    );
  }
}

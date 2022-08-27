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
import bedhost_api_url from "./const/server";
import { bed_splash_cols } from "./fastapi/bedQueries";

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
      bedMeta: {},
      bedGenome: {},
      bedSchema: {},
      bedStats: {}
    };
  }

  async componentDidMount() {
    let schema = await api.get("/api/bed/schema").then(({ data }) => data);
    this.setState({ bedSchema: schema });

    await api
      .get(`/api/bed/${this.props.match.params.bed_md5sum}/file/bigBed`)
      .then(this.setState({ bigbed: true }))
      .catch((err) => {
        // if (err.response.status === 500) {
        this.setState({ bigbed: false });
        // }
      });

    // get bedsplash data via fastapi endpoints
    let bed_cols = ""
    bed_splash_cols.forEach((col, idx) => {
      if (idx === 0) {
        bed_cols = `ids=${col}`
      } else {
        bed_cols = `${bed_cols}&ids=${col}`
      }
    });

    const result = await api
      .get(`/api/bed/${this.props.match.params.bed_md5sum}/metadata?${bed_cols}`)
      .then(({ data }) => data);

    let res = {}
    result.columns.forEach((key, i) => res[key] = result.data[0][i]);

    let bedStats = []
    Object.entries(res).forEach(([key, value], index) => {
      if (schema[key].type === "number") {
        bedStats.push(
          {
            label: schema[key].description,
            data: res[key]
          }
        )
      }
    });

    let newbedFig = []
    Object.entries(schema).forEach(([key, value], index) => {
      if (value.type === "image") {
        newbedFig.push(
          {
            id: key,
            title: value.description,
            src_pdf:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/img/${schema[key].label}?format=pdf`,
            src_png:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/img/${schema[key].label}?format=png`,
          }
        )
      }
    });

    let newbedFiles = {}
    Object.entries(schema).forEach(([key, value], index) => {
      if (value.type === "file") {
        if (res[key]) {
          newbedFiles[key] = res[key].size;
        }
      }
    });

    this.setState({
      bedName: res.name,
      bedGenome: res.genome,
      bedMeta: res.other,
      bedStats: bedStats,
      bedFig: newbedFig,
      bedFiles: newbedFiles,
      trackPath:
        `http://genome.ucsc.edu/cgi-bin/hgTracks?db=${res.genome}&mappability=full&hgct_customText=http://data.bedbase.org/bigbed_files/${res.name}.bigBed`,
    });

    if (this.state.bigbed) {
      this.setState({
        bedDownload: {
          BED_File: {
            id: "bedfile",
            label: "BED file",
            url:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file/bed`,
            http:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file_path/bigBed?remoteClass=http`,
            s3:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file_path/bigBed?remoteClass=s3`
          },
          bigBED_File: {
            id: "bigbedfile",
            label: "bigBed file",
            url:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file/bigBed`,
            http:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file_path/bigBed?remoteClass=http`,
            s3:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file_path/bigBed?remoteClass=s3`
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
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file/bed`,
            http:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file_path/bed?remoteClass=http`,
            s3:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file_path/bed?remoteClass=s3`
          },
        },
      });
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.match.params.bed_md5sum !== this.props.match.params.bed_md5sum) {
      window.location.reload(true);
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
                {Object.keys(this.state.bedStats).length > 0 ? (
                  <BedInfo
                    bed_md5sum={this.props.match.params.bed_md5sum}
                    bed_genome={this.state.bedGenome}
                    bed_info={this.state.bedMeta}
                    bed_stats={this.state.bedStats}
                  />
                ) : null}
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
                  <ImgGrid style={{ marginLeft: "15px", }} imgList={this.state.bedFig} page="bed" />
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

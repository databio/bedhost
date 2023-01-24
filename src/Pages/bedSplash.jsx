import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { ImgGrid, BedInfo } from "../Components"
import { bed_splash_cols } from "../fastapi/bedQueries";
import bedhost_api_url from "../const/server";
import axios from "axios";
import "../style/splash.css";

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
        <div className="conten-body">
          <Container
            style={{ width: "75%", minWidth: "900px" }}
            fluid
            className="p-4"
          >
            <Row>
              <Col md={10}>
                <h3> BED File: {this.state.bedName}</h3>
                <span> md5sum: {this.props.match.params.bed_md5sum} </span>
              </Col>
              <Col md={2}>
                {this.state.bigbed ? (
                  <a href={this.state.trackPath}>
                    <button className="float-right btn btn-primary">
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
              <Col sm={5} md={5}>
                {Object.keys(this.state.bedStats).length > 0 ? (
                  <BedInfo
                    bed_md5sum={this.props.match.params.bed_md5sum}
                    bed_genome={this.state.bedGenome}
                    bed_info={this.state.bedMeta}
                    bed_stats={this.state.bedStats}
                  />
                ) : null}
                <h4> Downloads </h4>
                {Object.entries(this.state.bedDownload).map(
                  ([key, value], index) => (
                    <p style={{ marginBottom: "5px" }} key={index}>
                      <a
                        href={value.url}
                        className="home-link"
                        style={{
                          marginLeft: "15px",
                          fontWeight: "bold",
                        }}
                      >
                        http
                      </a> | <a href={value.s3} className="home-link" style={{ fontWeight: "bold" }}>
                        s3
                      </a>
                      : {value.label} ({this.state.bedFiles[value.id]})
                    </p>
                  )
                )}

              </Col>
              <Col sm={7} md={7}>
                <h4 style={{ marginBottom: "10px" }}>
                  GenomicDistribution Plots
                </h4>
                {this.state.bedFig ? (
                  <ImgGrid style={{ marginLeft: "15px", }} imgList={this.state.bedFig} page="bed" />
                ) : null}
              </Col>
            </Row>
          </Container>
        </div>

      </React.StrictMode >
    );
  }
}

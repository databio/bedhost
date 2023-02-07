import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { ImgGrid, BedInfo } from "../Components"
import { bed_splash_cols } from "../fastapi/bedQueries";
import { FaExternalLinkAlt } from "react-icons/fa"
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
      bedFigCols: "",
      bedFiles: [],
      bedFileCols: "",
      bedDownload: {},
      trackPath: "",
      bigbed: false,
      bedMeta: {},
      bedGenome: {},
      bedSchema: {},
      bedStats: {},
      bedStatsCols: "",
    };
  }

  async componentDidMount() {
    let schema = await api.get("/api/bed/schema").then(({ data }) => data);
    this.setState({ bedSchema: schema });

    await api.get(`/api/bed/${this.props.match.params.bed_md5sum}/file_path/bigBed?remoteClass=http`)
      .then((res) => {
        if (res.status === 200) {
          this.setState({ bigbed: true });
        }
      })
      .catch((err) => {
        this.setState({ bigbed: false });
      });


    // get bedsplash data via fastapi endpoints
    let bed_cols = ""
    let bedfig_cols = ""
    let bedfile_cols = ""
    let bedstats_cols = ""

    bed_splash_cols.forEach((col, idx) => {
      if (idx === 0) {
        bed_cols = `ids=${col}`
      } else {
        bed_cols = `${bed_cols}&ids=${col}`
      }
      this.setState({ bedCols: bed_cols });

      if (schema[bed_splash_cols[idx]].type === "image") {
        if (bedfig_cols) {
          bedfig_cols = `${bedfig_cols}&ids=${col}`
        } else {
          bedfig_cols = `ids=${col}`
        }
      } else if (schema[bed_splash_cols[idx]].type === "file") {
        if (bedfile_cols) {
          bedfile_cols = `${bedfile_cols}&ids=${col}`
        } else {
          bedfile_cols = `ids=${col}`
        }
      } else if (schema[bed_splash_cols[idx]].type === "number" || schema[bed_splash_cols[idx]].type === "integer") {
        if (bedstats_cols) {
          bedstats_cols = `${bedstats_cols}&ids=${col}`
        } else {
          bedstats_cols = `ids=${col}`
        }
      }

      this.setState({
        bedFigCols: bedfig_cols,
        bedFileCols: bedfile_cols,
        bedStatsCols: bedstats_cols,
      });
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
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file_path/bed?remoteClass=http`,
            s3:
              `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/file_path/bed?remoteClass=s3`
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
            <Row className="justify-content-between">
              <Col md={10}>
                <h3> BED File: {this.state.bedName}
                  <a href={
                    `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/metadata`
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
                <span> md5sum: {this.props.match.params.bed_md5sum} </span>
              </Col>
              <Col md="auto">
                {this.state.bigbed ? (
                  <a href={this.state.trackPath}>
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
                    bedStats_cols={this.state.bedStatsCols}
                  />
                ) : null}
                <Card>
                  <Card.Header>
                    Downloads
                    <a href={
                      `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/metadata?${this.state.bedFileCols}`
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
                  <Card.Body>
                    <Col>
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
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={7} md={7}>
                <Card style={{ minHeight: '735px' }}>
                  <Card.Header>
                    GenomicDistribution Plots
                    <a href={
                      `${bedhost_api_url}/api/bed/${this.props.match.params.bed_md5sum}/metadata?${this.state.bedFigCols}`
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
                  <Card.Body >
                    <Col >
                      {this.state.bedFig ? (
                        <ImgGrid style={{ marginLeft: "15px", }} imgList={this.state.bedFig} page="bed" />
                      ) : null}
                    </Col>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </React.StrictMode >
    );
  }
}

import React from "react";
import { withRouter } from '../Components/withRouter';
import { Container, Row, Col, Card } from "react-bootstrap";
import { ImgGrid, BedInfo, NoRecord } from "../Components"
import { FaExternalLinkAlt } from "react-icons/fa"
import bedhost_api_url from "../const/server";
import axios from "axios";
import "../style/splash.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});

function moveToTheEnd(arr) {
  arr.map((elem, index) => {
    if (elem.label.includes("percentage")) {
      arr.splice(index, 1);
      arr.push(elem);
    }
  })
  return arr;
}

class BedSplash extends React.Component {
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
      code: -1
    };
  }

  async componentDidMount() {
    let schema = await api.get("/bed/schema").then(({ data }) => data["properties"]["samples"]["properties"])
    this.setState({ bedSchema: schema });
    // console.log("bed schema: ", schema)
    let res = await api.get(`/bed/${this.props.router.params.bed_md5sum}/metadata`)
      .then((res) => {
        this.setState({
          code: 200
        });
        return res.data;
      })
      .catch(error => {
        this.setState({
          code: error.response.status
        })
      });
    console.log("bed data: ", res)
    if (this.state.code === 200) {
      if (res.bigbedfile !== null) {
        this.setState({
          bigbed: true
        })
      }

      let bedStats = [{
        label: schema["regions_no"].description,
        data: res["regions_no"]
      }]
      Object.entries(res).forEach(([key, value], index) => {
        if (typeof schema[key] !== "undefined" && schema[key].type === "number") {
          bedStats.push(
            {
              label: schema[key].description,
              data: res[key]
            }
          )
        }
      });

      bedStats = moveToTheEnd(bedStats)

      let newbedFig = []
      Object.entries(schema).forEach(([key, value], index) => {
        if (typeof value.object_type !== "undefined" && value.object_type === "image") {
          newbedFig.push(
            {
              id: key,
              title: value.description,
              src_pdf:
                `${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.${key}/access/http/bytes`,
              src_png:
                `${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.${key}/access/http/thumbnail`,
            }
          )
        }
      });

      let newbedFiles = {}
      Object.entries(schema).forEach(([key, value], index) => {
        if (typeof value.object_type !== "undefined" && value.object_type === "file") {
          if (res[key]) {
            newbedFiles[key] = res[key].size;
          }
        }
      });

      let bedMeta = {
        created_time: res.pipestat_created_time.replace(/(.*?:.*?):.*/, '$1'),
        last_modified: res.pipestat_modified_time.replace(/(.*?:.*?):.*/, '$1')
      }

      bedMeta = { ...res.other, ...bedMeta };

      this.setState({
        bedName: res.name,
        bedGenome: res.genome,
        bedMeta: bedMeta,
        bedStats: bedStats,
        bedFig: newbedFig,
        bedFiles: newbedFiles,
        trackPath:
          `http://genome.ucsc.edu/cgi-bin/hgTracks?db=${res.genome}&mappability=full&hgct_customText=${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.bigbedfile/access/http`,
      });

      if (this.state.bigbed) {
        let bedurl = await api.get(`${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.bedfile/access/http`).then(({ data }) => data)
        let bigbedurl = await api.get(`${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.bigbedfile/access/http`).then(({ data }) => data)

        this.setState({
          bedDownload: {
            BED_File: {
              id: "bedfile",
              label: "BED file",
              url:
                bedurl,
              http:
                `${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.bedfile/access/http`,
              s3:
                `${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.bedfile/access/s3`
            },
            bigBED_File: {
              id: "bigbedfile",
              label: "bigBed file",
              url:
                bigbedurl,
              http:
                `${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.bigbedfile/access/http`,
              s3:
                `${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.bigbedfile/access/s3`
            },
          },
        });
      } else {
        let bedurl = await api.get(`${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.bedfile/access/http`).then(({ data }) => data)
        this.setState({
          bedDownload: {
            BED_File: {
              id: "bedfile",
              label: "BED file",
              url:
                bedurl,
              http:
                `${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.bedfile/access/http`,
              s3:
                `${bedhost_api_url}/objects/bed.${this.props.router.params.bed_md5sum}.bedfile/access/s3`
            },
          },
        });
      }
    }

  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.router.params.bed_md5sum !== this.props.router.params.bed_md5sum) {
      window.location.reload(true);
    }
  }

  render() {
    return (
      <React.StrictMode>
        {this.state.code === 422 ? (
          <NoRecord
            type="bed"
            md5sum={this.props.router.params.bed_md5sum}
          />
        ) :
          (
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
                        `${bedhost_api_url}/bed/${this.props.router.params.bed_md5sum}/metadata`
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
                    <span> ID: {this.props.router.params.bed_md5sum} </span>
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
                        bed_md5sum={this.props.router.params.bed_md5sum}
                        bed_genome={this.state.bedGenome}
                        bed_info={this.state.bedMeta}
                        bed_stats={this.state.bedStats}
                        bedStats_cols={this.state.bedStatsCols}
                      />
                    ) : null}
                    <Card>
                      <Card.Header>
                        Downloads
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
          )}

      </React.StrictMode >
    );
  }
}

export default withRouter(BedSplash);
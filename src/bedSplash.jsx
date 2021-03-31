import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import axios from "axios";
import bedhost_api_url from "./const";
import ImgGrid from "./imgGrid";
import BedInfo from "./bedInfo";
import { Label } from 'semantic-ui-react';
import "./style/splash.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});


export default class BedSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedName: "",
      bedFig: [],
      bedDownload: {},
      trackPath: "",
      bigbed: false
    };
  }

  async componentDidMount() {
    await api
      .get(bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/file/bigbedfile")
      .then(this.setState({ bigbed: true }))
      .catch(err => {
      if (err.response.status === 404) {
          this.setState({ bigbed: false })
        }
      });

    let data = await api.get("/api/bed/" + this.props.match.params.bed_md5sum + "/data").then(({ data }) => data);
    console.log("BED file data retrieved from the server: ", data);
    
    this.setState(
      {
        bedName: data.data[0][2],
        trackPath: 'http://genome.ucsc.edu/cgi-bin/hgTracks?db=' + data.data[0][13] + '&mappability=full&hgct_customText=http://data.bedbase.org/bigbed_files/' + data.data[0][2] + ".bigBed",
      }
    );

    if (this.state.bigbed) {
      this.setState(
        {
          bedDownload: {
            BED_File: { label: 'BED file', url: bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/file/bedfile" },
            bigBED_File: { label: 'bigBed file', url: bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/file/bigbedfile" },
          },
        }
      );
    } else {
      this.setState(
        {
          bedDownload: {
            BED_File: { label: 'BED file', url: bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/file/bedfile" },
          },
        }
      );
    }

    let newbedFig = data.data[0].map((img, index) => {
      return (
        (index >= 24 && index <= data.columns.length - 3) ? {
          ...img,
          id: data.columns[index],
          src_pdf: bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/img/" + data.columns[index] + "?format=pdf",
          src_png: bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/img/" + data.columns[index] + "?format=png"
        } : null
      )
    });
    newbedFig = newbedFig.slice(24, data.columns.length - 2)

    this.setState({ bedFig: newbedFig });


  }

  render() {
    return (
      <React.StrictMode >
        <Header />
        <div className="conten-body">
          <Container style={{ width: "75%", minWidth: '900px' }} fluid className="p-4">
            <Row>
              <Col>
                <h1>BED File: {this.state.bedName}</h1>
              </Col>
              <Col>
                {this.state.bigbed ?
                  (<a href={this.state.trackPath}>
                    <button className='float-right btn primary-btn' >Genome Browser</button>
                  </a>) : null}
              </Col>
            </Row>
          </Container>
          <Container style={{ width: "75%", minWidth: '900px' }} fluid className="p-4">
            <Row>
              <Col sm={4} md={4}>
                <BedInfo bed_md5sum={this.props.match.params.bed_md5sum} />
                <Label style={{ marginTop: "15px", marginBottom: "5px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  BED File Download
              </Label>
                {Object.entries(this.state.bedDownload)
                  .map(([key, value], index) =>
                    <p style={{ marginBottom: "5px" }} key={index}>
                      <a href={value.url} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                        {value.label}
                      </a>
                    </p>
                  )}

                <Label style={{ marginTop: "15px", marginBottom: "5px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  API Endpoint Examples
                </Label>

                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bed/' + this.props.match.params.bed_md5sum + '/data'}
                    className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    All data
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bed/' + this.props.match.params.bed_md5sum + '/data?ids=bedfile'}
                    className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED file path
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bed/' + this.props.match.params.bed_md5sum + '/data?ids=other'}
                    className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED file meta data
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bed/' + this.props.match.params.bed_md5sum + '/data?ids=gc_content&ids=regions_no&ids=mean_absolute_tss_dist&ids=mean_region_width&ids=exon_percentage&ids=intron_percentage&ids=promoterprox_percentage&ids=intergenic_percentage&ids=promotercore_percentage&ids=fiveutr_percentage&ids=threeutr_percentage'}
                    className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED file stats
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bed/' + this.props.match.params.bed_md5sum + '/data?ids=tssdist&ids=chrombins&ids=gccontent&ids=paritions&ids=expected_partitions&ids=cumulative_partitions&ids=widths_histogram&ids=neighbor_distances&ids=open_chromatin'}
                    className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED file plots
                  </a>
                </p>

              </Col>
              <Col sm={8} md={8}>
                <Label style={{ marginBottom: "15px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  GenomicDistribution Plots
                </Label>
                {this.state.bedFig ?
                  (<ImgGrid imgList={this.state.bedFig} page="bed" />) : null
                }
              </Col>
            </Row>
          </Container>
        </div>
        <VersionsSpan />
      </React.StrictMode >

    )
  }
}



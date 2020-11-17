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
    };
  }

  async componentDidMount() {
    let data = await api.get("/api/bed/" + this.props.match.params.bed_md5sum + "/data").then(({ data }) => data);
    console.log("BED set data retrieved from the server: ", data);
    this.setState(
      {
        bedName: data.data[0][3],
        bedDownload: {
          BED_File: bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/file/bedfile",
        },
      }
    );
    const newbedFig = data.data[0][22].map((file) => {
      return {
        ...file, src_pdf: bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/img/" + file.name + "?format=pdf",
        src_png: bedhost_api_url + "/api/bed/" + this.props.match.params.bed_md5sum + "/img/" + file.name + "?format=png"
      };
    });
    this.setState({ bedFig: newbedFig });
  }


  render() {
    return (
      <React.StrictMode >
        <Header />
        <div className="conten-body">
          <Container style={{ width: "75%", minWidth: '900px'}} fluid className="p-4">
            <h1>BED File: {this.state.bedName}</h1>
          </Container>
          <Container style={{ width: "75%" , minWidth: '900px'}} fluid className="p-4">
            <Row>
              <Col sm={4} md={4}>
                <BedInfo bed_md5sum={this.props.match.params.bed_md5sum} />
                <Label style={{ marginTop: "30px", marginBottom: "5px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  BED File Download
              </Label>
                {Object.entries(this.state.bedDownload)
                  .map(([key, value], index) =>
                    <p key={index}>
                      <a href={value} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                        {key}
                      </a>
                    </p>
                  )}

                <Label style={{ marginTop: "30px", marginBottom: "5px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  BED File APIs
                </Label>

                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bed/' + this.props.match.params.bed_md5sum + '/data'} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    All data
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bed/' + this.props.match.params.bed_md5sum + '/data?ids=bedfile_path'} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED file path
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bed/' + this.props.match.params.bed_md5sum + '/data?ids=other'} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED file info
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bed/' + this.props.match.params.bed_md5sum + '/data?ids=gc_content&ids=regions_no&ids=mean_absolute_tss_dist&ids=mean_region_width&ids=exon_percentage&ids=intron_percentage&ids=promoterprox_percentage&ids=intergenic_percentage&ids=promotercore_percentage&ids=fiveutr_percentage&ids=threeutr_percentage'}
                    className="home-link" style={{ marginLeft: '15px', fontSize: "12pt", fontWeight: "bold" }}>
                    BED file stats
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bed/' + this.props.match.params.bed_md5sum + '/data?ids=plots'} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED file plots
                  </a>
                </p>

              </Col>
              <Col sm={8} md={8}>
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



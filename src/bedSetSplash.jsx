import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import BedSetTable from "./bedSetTable";
// import StatsTable from "./statsTable";
import BedSetPlots from "./bedSetPlots";
import BarChart from "./barChart";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from 'react-bootstrap/Dropdown'
import axios from "axios";
import bedhost_api_url from "./const";
// import { Label } from 'semantic-ui-react';
import "./style/splash.css";


const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedSetSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedSetName: "",
      bedFilesCount: "",
      avgGC: {},
      avgRegionW: {},
      avgRegionD: {},
      bedSetDownload: {}, 
      bedSetFig:[]
    };
  }

  async componentDidMount() {
    let data = await api.get("/bedsets/splash/" + this.props.match.params.bedset_md5sum).then(({ data }) => data);
    this.setState(
      {
        bedSetName: data[0][2],
        bedFilesCount: Object.keys(data[0][11]).length,
        bedSetDownload: {
          BED_Set_Rxiv: bedhost_api_url + "/bedsets/download/" + this.props.match.params.bedset_md5sum + "?column=bedset_tar_archive_path",
          BED_Stats: bedhost_api_url + "/bedsets/download/" + this.props.match.params.bedset_md5sum + "?column=bedset_bedfiles_gd_stats",
          BED_Set_Summary: bedhost_api_url + "/bedsets/download/" + this.props.match.params.bedset_md5sum + "?column=bedset_gd_stats",
          BED_Set_IGD: bedhost_api_url + "/bedsets/download/" + this.props.match.params.bedset_md5sum + "?column=bedset_igd_database_path",
          BED_Set_PEP: bedhost_api_url + "/bedsets/download/" + this.props.match.params.bedset_md5sum + "?column=bedset_pep"
        },
        bedSetFig: data[0][8][0]
      }
    );
    console.log("BED set data retrieved from the server: ", data);
    data = await api.get("/bedset/stats/" + this.props.match.params.bedset_md5sum).then(({ data }) => data);
    this.setState(
      {
        avgGC: data.gc_content,
        avgRegionW: data.mean_region_width,
        avgRegionD: data.regionsDistribution
      }
    );
    console.log("BED set data retrieved from the server: ", this.state.avgRegionD);
  }

  render() {
    return (
      <React.StrictMode >
        <Header />
        <div className="conten-body">
          <Container style={{ width: "75%" }} fluid className="p-4">
            <Row>
              <Col md="10">
                <h1>BED Set: {this.state.bedSetName}</h1>
                <span style={{ fontSize: "12pt" }}>
                  {" "}
                There are <b>{this.state.bedFilesCount}</b> BED files in this BED set.
                <br />
                The mean GC content is  <b>{this.state.avgGC.mean}</b> (SD = {this.state.avgGC.sd} );
                mean region width is <b>{this.state.avgRegionW.mean}</b> (SD = {this.state.avgRegionW.sd} ).
                </span>
              </Col>
              <Col>
                <Dropdown>
                  <Dropdown.Toggle className='float-right btn primary-btn' id="dropdown-basic">
                    DOWNLOADS
              </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {Object.entries(this.state.bedSetDownload)
                      .map(([key, value], index) =>
                        <Dropdown.Item key={index} href={value}>
                          {key}
                        </Dropdown.Item>)}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </Container>
          <Container style={{ width: "75%" }} fluid className="p-4">
            <Row>
              <Col md={6}>
                {/* <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  BED Set Plots
              </Label> */}
                <BedSetPlots bedset_md5sum={this.props.match.params.bedset_md5sum} bedset_figs = {this.state.bedSetFig} />
              </Col>
              <Col md={6}>
              {this.state.avgRegionD.data ? (<BarChart stats={this.state.avgRegionD.data} />) : null}
              </Col>
              {/* <Col>
                <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
                  BED Set Stats
              </Label>
                <StatsTable bedset_md5sum={this.props.match.params.bedset_md5sum} />
              </Col> */}
            </Row>
            <Row>
              <Col>
                {/* <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
                  BED Files Stats
              </Label> */}
                <BedSetTable bedset_md5sum={this.props.match.params.bedset_md5sum} />
              </Col>
            </Row>
          </Container>
        </div>
        <VersionsSpan />
      </React.StrictMode>
    )
  }
}
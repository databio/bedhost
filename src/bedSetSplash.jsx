import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import BedSetTable from "./bedSetTable";
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
  baseURL: bedhost_api_url + "/api",
});

export default class BedSetSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedSetName: "",
      bedFilesCount: "",
      avgGC: [],
      avgRegionW: [],
      avgRegionD: {},
      bedSetDownload: {},
      bedSetFig: false
    };
  }

  async componentDidMount() {
    let data = await api.get("/bedset/" + this.props.match.params.bedset_md5sum + "/data").then(({ data }) => data);
    console.log("BED set data retrieved from the server: ", data);
    this.setState(
      {
        bedSetName: data.data[2],
        bedFilesCount: Object.keys(data.data[11]).length,
        bedSetDownload: {
          BED_Set_Rxiv: bedhost_api_url + "/api/bedsets/download/" + this.props.match.params.bedset_md5sum + "?column=bedset_tar_archive_path",
          BED_Stats: bedhost_api_url + "/api/bedsets/download/" + this.props.match.params.bedset_md5sum + "?column=bedset_bedfiles_gd_stats",
          BED_Set_Summary: bedhost_api_url + "/api/bedsets/download/" + this.props.match.params.bedset_md5sum + "?column=bedset_gd_stats",
          BED_Set_IGD: bedhost_api_url + "/api/bedsets/download/" + this.props.match.params.bedset_md5sum + "?column=bedset_igd_database_path",
          BED_Set_PEP: bedhost_api_url + "/api/bedsets/download/" + this.props.match.params.bedset_md5sum + "?column=bedset_pep"
        },
        bedSetFig: data.data[8][0],
        avgGC: [data.data[9].gc_content.toFixed(3), data.data[10].gc_content.toFixed(3)],
        avgRegionW: [data.data[9].mean_region_width.toFixed(3), data.data[9].mean_region_width.toFixed(3)],
        avgRegionD: {
          exon: [data.data[9].exon_percentage.toFixed(3), data.data[10].exon_percentage.toFixed(3)],
          fiveutr: [data.data[9].fiveutr_percentage.toFixed(3), data.data[10].fiveutr_percentage.toFixed(3)],
          intergenic: [data.data[9].intergenic_percentage.toFixed(3), data.data[10].intergenic_percentage.toFixed(3)],
          intron: [data.data[9].intron_percentage.toFixed(3), data.data[10].intron_percentage.toFixed(3)],
          threeutr: [data.data[9].threeutr_percentage.toFixed(3), data.data[10].threeutr_percentage.toFixed(3)]
        }
      }
    );
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
                The mean GC content is  <b>{this.state.avgGC[0]}</b> (SD = {this.state.avgGC[1]} );
                mean region width is <b>{this.state.avgRegionW[0]}</b> (SD = {this.state.avgRegionW[1]} ).
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
                {this.state.bedSetFig ? (<BedSetPlots bedset_md5sum={this.props.match.params.bedset_md5sum} bedset_figs={this.state.bedSetFig} />) : null}
              </Col>
              <Col md={6}>
                {Object.keys(this.state.avgRegionD).length !== 0 ? (<BarChart stats={this.state.avgRegionD} />) : null}
              </Col>
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
import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import BedSetTable from "./bedSetTable";
import StatsTable from "./statsTable";
import BedSetPlots from "./bedSetPlots";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from 'react-bootstrap/Dropdown'
import axios from "axios";
import bedhost_api_url from "./const";
import { Label } from 'semantic-ui-react';
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
      bedSetDownload: {}
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
      }
    );
    console.log("BED set data retrieved from the server: ", data);
  }

  render() {
    return (
      <div style={{ height: "96%", overflow: "scroll" }}>
        <Header />
        <Container fluid className="p-4">
          <Row>
            <Col>
              <h1>BED Set: {this.state.bedSetName}</h1>
              <span>
                {" "}
                There are <b>{this.state.bedFilesCount}</b> BED files in this BED set.
              </span>
            </Col>
            <Col>
              <Dropdown>
                <Dropdown.Toggle className='float-right btn primary-btn' id="dropdown-basic">
                  DOWNLOADS
              </Dropdown.Toggle>

                <Dropdown.Menu>
                  {Object.entries(this.state.bedSetDownload)
                    .map(([key, value]) =>
                      <Dropdown.Item href={value}>
                        {key}
                      </Dropdown.Item>)}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Container>
        <Container fluid className="p-4">
          <Row>
            <Col>
              <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                BED Set Plots
              </Label>
              <BedSetPlots  bedset_md5sum={this.props.match.params.bedset_md5sum} />
              <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
                BED Set Stats
              </Label>
              <StatsTable bedset_md5sum={this.props.match.params.bedset_md5sum} />
            </Col>
          </Row>
          <Row>
            <Col>
              <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
                BED Files Stats
              </Label>
              <BedSetTable bedset_md5sum={this.props.match.params.bedset_md5sum} />
            </Col>
          </Row>
        </Container>
        <VersionsSpan />
      </div>
    )
  }
}
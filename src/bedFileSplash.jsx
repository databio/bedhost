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
import Dropdown from 'react-bootstrap/Dropdown'
// import { Label } from 'semantic-ui-react';
import "./style/splash.css";

const api = axios.create({
  // baseURL: bedhost_api_url,
  baseURL: `${ window.location.protocol }//${ window.location.host }/api`,
});


export default class BedFileSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedName: "",
      bedData: [],
      bedFig: [],
      bedDownload: {},
    };
  }

  async componentDidMount() {
    let data = await api.get("/bedfiles/splash/" + this.props.match.params.bedfile_md5sum).then(({ data }) => data);
    this.setState(
      {
        bedName: data[0][3],
        bedDownload: {
          BED_File: bedhost_api_url + "/bedfiles/download/" + this.props.match.params.bedfile_md5sum + "?column=bedfile_path",
        },
      }
    );
    const newbedFig = data[0][22].map((file) => {
      return {
        ...file, src_pdf: bedhost_api_url + "/img/bedfiles/" + this.props.match.params.bedfile_md5sum + "/" + file.name + "/pdf",
        src_png: bedhost_api_url + "/img/bedfiles/" + this.props.match.params.bedfile_md5sum + "/" + file.name + "/png"
      };
    });
    this.setState({ bedFig: newbedFig });
    console.log("BED set data retrieved from the server: ", this.state.bedDownload);
  }


  render() {
    return (
      <React.StrictMode >
        <Header />
        <div className="conten-body">
          <Container style={{ width: "75%" }} fluid className="p-4">
            <Row>
              <Col md="10">
                <h1>BED File: {this.state.bedName}</h1>
              </Col>
              <Col>
                <Dropdown>
                  <Dropdown.Toggle className='float-right btn primary-btn' id="dropdown-basic">
                    DOWNLOADS
              </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {Object.entries(this.state.bedDownload)
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
              <Col md={4}>
                <BedInfo bedfile_md5sum={this.props.match.params.bedfile_md5sum} />
              </Col>
              <Col md={8}>
                {this.state.bedFig ?
                  (<ImgGrid imgList={this.state.bedFig} cols={3} />) : null
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



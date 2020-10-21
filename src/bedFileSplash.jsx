import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import axios from "axios";
import bedhost_api_url from "./const";
import ImgGrid from "./imgGrid";
import DownloadList from "./downloadList";
import { Label } from 'semantic-ui-react';
import "./style/splash.css";

const api = axios.create({
  baseURL: bedhost_api_url,
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
        ...file, src_pdf: bedhost_api_url + "/bedfiles/img/" + this.props.match.params.bedfile_md5sum + "?img_type=pdf&img_name=" + file.name,
        src_png: bedhost_api_url + "/bedfiles/img/" + this.props.match.params.bedfile_md5sum + "?img_type=png&img_name=" + file.name
      };
    });
    this.setState({ bedFig: newbedFig });
    console.log("BED set data retrieved from the server: ", this.state.bedDownload);
  }


  render() {
    return (
      <div style={{ height: "100%", overflow: "scroll" }}>
        <Header />
        <Container fluid className="p-4">
          <Row>
            <Col>
              <h1>BED File: {this.state.bedName}</h1>
            </Col>
          </Row>
        </Container>
        <Container fluid className="p-4">
          {this.state.bedFig ?
            (<ImgGrid imgList={this.state.bedFig} />) : null
          }
        </Container>
        <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
          BED File Download List
        </Label>
        <DownloadList list={this.state.bedDownload} />
        <VersionsSpan />
      </div>
    )
  }
}



import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import axios from "axios";
import bedhost_api_url from "./const";
import path from "path";
import ImgGrid from "./imgGrid";
// import DownloadList from "./downloadList";
import "./splash.css";

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
          BED_File: data[0][2], 
      },
      }
    );
    const newbedFig = data[0][22].map((file) => {
      return { ...file, src: "." + path.join("/outputs/bedstat_output", this.props.match.params.bedfile_md5sum, this.state.bedName + "_" + file.name) };
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
        <VersionsSpan />
      </div>
    )
  }
}



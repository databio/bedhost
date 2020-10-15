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
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import "./splash.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});


export default class BedFileSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedName: "",
      bedData: "",
      bedFig: []
    };
  }

  async componentDidMount() {
    let data = await api.get("/bedfiles/splash/" + this.props.match.params.bedfile_md5sum).then(({ data }) => data);
    this.setState(
      {
        bedName: data[0][3],
        // bedData: data[0][4],
      }
    );
    const newbedFig = data[0][22].map((file) => {
      return { ...file, src: "."+path.join("/outputs/bedstat_output", this.props.match.params.bedfile_md5sum, this.state.bedName + "_" + file.name) };
    });
    this.setState({ bedFig: newbedFig });
    console.log("BED set data retrieved from the server: ", this.state.bedFig);
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
          <Row>
            <Col >
              {this.state.bedFig ?
                (<ImgGrid imgList={this.state.bedFig} />) : null
              }
            </Col>
            <Col sm="4">
              <h2>Download list</h2>
            </Col>
          </Row>
        </Container>
        <VersionsSpan />
      </div>
    )
  }
}



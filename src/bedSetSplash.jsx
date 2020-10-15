import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import BedSetTable from "./bedSetTable";
import BedSetPlots from "./bedSetPlots";
import DownloadList from "./downloadList";
import StatsTable from "./statsTable";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import axios from "axios";
import bedhost_api_url from "./const";
import path from "path";
import "./bedSetSplash.css";
import { Label } from 'semantic-ui-react';

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedSetSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      Data: [],
      bedSetName: "",
      bedSetRxiv: "",
      bedSetData: "",
      bedSetSum: "",
      bedSetDownload: [],
      bedSetFig: []
    };
  }

  async componentDidMount() {
    let data = await api.get("/bedset/splash/" + this.props.match.params.bedset_md5sum).then(({ data }) => data);
    var regex =
      this.setState(
        {
          bedSetName: data[0][2],
          bedSetRxiv: data[0][3],
          bedSetData: data[0][4],
          bedSetSum: data[0][5],
          bedSetDownload: [data[0][3], data[0][4], data[0][5], data[0][6], data[0][7]],
          bedSetFig: data[0][8][0],
        }
      );

    const newbedSetFig = { ...this.state.bedSetFig, src: path.join("/outputs/bedbuncher_output", this.props.match.params.bedset_md5sum, this.state.bedSetName + "_" + this.state.bedSetFig.name) };
    this.setState({ bedSetFig: newbedSetFig });
    console.log("BED set data retrieved from the server: ", data);
  }

  render() {
    return (
      <div>
        <Header />
        <Container fluid className="p-4">
          <Row>
            <Col>
              <h1>Bedset: {this.state.bedSetName}</h1>
            </Col>
          </Row>
        </Container>
        <Container fluid className="p-4">
          <Row>
            <Col>
              {this.state.bedSetData ? (
                <BedSetTable dataSrc={this.state.bedSetData.match(/\/outputs\/.*/)} />
              ) : null}
              <h3>Fig Comparison Component</h3>
            </Col>
            <Col sm="4">
              <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
                {this.state.bedSetFig.caption}
                {console.log(this.state.bedSetFig.src)}
              </Label>
              {this.state.bedSetFig.src ? (
                <BedSetPlots data={this.state.bedSetFig} />
              ) : null}

              <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
                Bedset Stats Table
              </Label>
              <StatsTable dataSrc={this.state.bedSetSum.match(/\/outputs\/.*/)} />
              <Label style={{ marginLeft: '15px', fontSize: '15px' }} as='a' color='teal' ribbon>
                Bedset Download List
              </Label>
              <DownloadList list={this.state.bedSetDownload} />
            </Col>
          </Row>
        </Container>
        <VersionsSpan />
      </div>
    )
  }
}
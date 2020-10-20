import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import BedSetTable from "./bedSetTable";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import axios from "axios";
import bedhost_api_url from "./const";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedSetSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedSetName: ""
    };
  }

  async componentDidMount() {
    let data = await api.get("/bedsets/splash/" + this.props.match.params.bedset_md5sum).then(({ data }) => data);
    this.setState(
      {
        bedSetName: data[0][2]
      }
    );
    console.log("BED set data retrieved from the server: ", data);
  }

  render() {
    return (
      <div style={{ height: "100%", overflow: "scroll" }}>
        <Header />
        <Container fluid className="p-4">
          <Row>
            <Col>
              <h1>BED Set: {this.state.bedSetName}</h1>
            </Col>
          </Row>
        </Container>
        <Container fluid className="p-4">
          <BedSetTable bedset_md5sum={this.props.match.params.bedset_md5sum} />
        </Container>
        <VersionsSpan />
      </div>
    )
  }
}
import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export default class BedFileSplash extends React.Component {
  render() {
    return(
      <div>
        <Header />
        <Container fluid className="p-4">
          <Row>
              <Col>
                <h1>Bedfile: {this.props.match.params.bedfile}</h1>
              </Col>
          </Row>
        </Container>
        <Container fluid className="p-4">
          <Row>
            <Col>
              <h3>Fig Component</h3>
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
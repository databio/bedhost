import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export default class BedSetSplash extends React.Component {
  render() {
    return(
      <div>
        <Header />
        <Container fluid className="p-4">
          <Row>
            <Col>
              <h1>Bedset: {this.props.match.params.bedset}</h1>
            </Col>
          </Row>
        </Container>
        <Container fluid className="p-4">
          <Row>
            <Col>
              <h2> Data Table Component</h2>
              <h3>Fig Comparison Component</h3>
            </Col>
            <Col sm="4">
              <h2>Bedset plot(s)</h2>
              <h2>Bedset stats summary</h2>
              <h2>Download list</h2>
            </Col>
          </Row>
        </Container>
        <VersionsSpan />
      </div>
    )
  }
}
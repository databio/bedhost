import React from "react";
import ReactDOM from "react-dom";
import BedCountsSpan from "./bedCountsSpan";
import BedSetList from "./bedSetList";
import VersionsSpan from "./versionsSpan";
import * as serviceWorker from "./serviceWorker";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

ReactDOM.render(
  <React.StrictMode>
    <Navbar bg="dark" variant="dark">
      <Navbar.Brand href="#home">
        <img
          src="/bedbase_logo.svg"
          width="200"
          height="30"
          className="d-inline-block align-top"
          alt="BEDBASE logo"
        />
      </Navbar.Brand>
      <Nav className="mr-auto">
        <Nav.Link href="http://localhost:8000/docs">API documentation</Nav.Link>
      </Nav>
    </Navbar>

    <Container fluid className="p-4">
      <Row>
        <Col>
          <BedCountsSpan />
        </Col>
      </Row>
    </Container>
    <Container fluid className="p-4">
      <Row>
        <Col md={6}>
          <BedSetList />
        </Col>
      </Row>
    </Container>
    <VersionsSpan />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

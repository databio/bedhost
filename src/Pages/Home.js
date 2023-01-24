import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../style/home.css";

export default class Home extends React.Component {
  render() {
    return (
      <>
        <div style={{ height: "760px", backgroundColor: "#0073801e" }}>
          <Container >
            <Row className="align-items-center">
              <Col md={6}>
                <h1 style={{ marginTop: "150px" }}>
                  Welcome to BEDbase
                </h1>
                <p
                  style={{ marginTop: "50px", marginBottom: "50px" }}
                >
                  BEDbase is a unified platform for aggregating,
                  analyzing, and serving genomic region data.
                  BEDbase redefines the way to manage genomic
                  region data and allows users to search for BED files
                  of interest and create collections tailored to research
                  needs. BEDbase is composed of a web server and
                  an API. Users can explore comprehensive
                  descriptions of specific BED files via a user-oriented
                  web interface and programmatically interact with the
                  data via an OpenAPI-compatible API.
                </p>
                <Row>
                  <Col md={4}>
                    <Link to={{
                      pathname: `/about`,
                    }}>
                      <button className="btn btn-primary"
                        style={{ width: "100%" }}
                      >
                        Find Out More
                      </button>
                    </Link>
                  </Col>
                  <Col md={4}>
                    <Link to={{
                      pathname: `/search`,
                    }}>
                      <button className="btn btn-search"
                        style={{ width: "100%" }}
                      >
                        Search BEDbase
                      </button>
                    </Link>
                  </Col>
                </Row>
              </Col>
              <Col md={6}>
                <img
                  style={{ marginTop: "100px", marginLeft: "90px" }}
                  src="/workflow_landing.svg"
                  // src="/ui/workflow_landing.svg"
                  height="500px"
                  alt="workflow"
                />
              </Col>
            </Row>
          </Container>
        </div>
      </>
    );
  }
}

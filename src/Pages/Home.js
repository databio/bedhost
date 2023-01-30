import React from "react";
import {
  Container,
  Row,
  Col,
  Form,
  FormControl
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { BedCountsSpan } from "../Components";
import "../style/home.css";

export default class Home extends React.Component {
  state = {
    searchTerms: ""
  };

  handleSearchInput = (e) => {
    this.setState({
      searchTerms: e.target.value
    });
  };

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (this.state.searchTerms) {
        e.preventDefault();
        this.props.history.push({
          pathname: `/search`,
          search: "?" + new URLSearchParams(`terms=${this.state.searchTerms}`)
        });
      } else {
        alert("Please enter some search text!");
      }
    }
  };

  handleSearchSubmit = () => {
    if (this.state.searchTerms) {
      this.props.history.push({
        pathname: `/search`,
        search: "?" + new URLSearchParams(`terms=${this.state.searchTerms}`)
      });
    } else {
      alert("Please enter some search text!");
    }
  };

  render() {
    return (
      <>
        <div className="conten-body" >
          <div style={{ background: 'linear-gradient(#5dadad,white)', height: "350px" }}>
            <Container>
              <Row className="justify-content-center">
                <Col md="auto">
                  <h1
                    style={{ marginTop: "100px" }}>
                    Welcome to BEDbase
                  </h1>
                </Col>
              </Row>

              <Row
                className="justify-content-center"
                style={{
                  marginTop: "50px",
                }}>
                <Col md="auto" style={{ paddingLeft: "0px", paddingRight: "0px" }}>
                  <Form inline >
                    <FormControl
                      style={{
                        width: "750px",
                        height: "50px",
                        borderColor: "#ced4da",
                        borderStyle: "solid",
                        borderWidth: "1px",
                        borderRadius: "3px"
                      }}
                      onChange={this.handleSearchInput.bind(this)}
                      onKeyDown={this.handleKeyPress.bind(this)}
                      value={this.state.searchTerms}
                      type="text"
                      placeholder="Search BEDbase (ex. K562)"
                      className="mr-sm-2"
                    />
                  </Form>
                </Col>
                <Col md="auto" style={{ paddingLeft: "0px", paddingRight: "0px" }}>
                  <button
                    className="float-right btn btn-search"
                    style={{
                      width: "100px",
                      height: "48px",
                      marginLeft: "0px",
                      marginTop: "1px",
                      borderWidth: "0px"
                    }}
                    onClick={this.handleSearchSubmit.bind(this)}
                  >
                    Search
                  </button>
                </Col>
              </Row>
              <p style={{ marginLeft: "225px", fontSize: "8pt" }}>
                * The search function is still under development. This is a demo.
              </p>
            </Container>
          </div>
          <Container>
            <Row className="justify-content-center">
              <Col md={4}>
                <p
                  style={{ paddingBottom: "20px", borderBottom: '1.5px solid lightgrey' }}
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
                <BedCountsSpan />
              </Col>
              {/* <Row>
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
                </Row> */}

              <Col md={4}>
                <img
                  style={{ marginLeft: "50px", height: "330px" }}
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

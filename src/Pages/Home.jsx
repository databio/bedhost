import React from "react";
import { Link } from "react-router-dom";
import { withRouter } from '../Components/withRouter';
import {
  Container,
  Row,
  Col,
  Form,
  FormControl
} from "react-bootstrap";
import axios from "axios";
import bedhost_api_url from "../const/server";
import "../style/home.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});


class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      bed: -1,
      bedSet: -1,
      sampleBed: "",
      sampleBedSet: "",
      searchTerms: ""
    };
  }
  async componentDidMount() {

    let bfcount = await api
      .get("/api/bed/count")
      .catch(function (error) {
        alert(`${error}; is bedhost running at ${bedhost_api_url}?`);
      });
    // console.log("BED file count retrieved from the server: ", bfcount.data);
    this.setState({ bed: bfcount.data });

    let bscount = await api
      .get("/api/bedset/count")
      .catch(function (error) {
        alert(`${error}; is bedhost running at ${bedhost_api_url}?`);
      });
    // console.log("BED set count retrieved from the server: ", bscount.data);
    this.setState({ bedSet: bscount.data });

    let bed = await api.get("/api/bed/all/metadata?ids=md5sum&limit=1").then(({ data }) => data);
    let bedurl = `/bedsplash/${bed.data[0][0]}`
    this.setState({ sampleBed: bedurl });

    let bedset = await api.get("/api/bedset/all/metadata?ids=md5sum&limit=1").then(({ data }) => data)
    let bedseturl = `/bedsetsplash/${bedset.data[0][0]}`
    this.setState({ sampleBedSet: bedseturl });
  }


  handleSearchInput = (e) => {
    this.setState({
      searchTerms: e.target.value
    });
  };

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (this.state.searchTerms) {
        e.preventDefault();
        this.props.router.navigate(`/search?terms=${this.state.searchTerms}`);
      } else {
        alert("Please enter some search text!");
      }
    }
  };

  handleSearchSubmit = () => {
    if (this.state.searchTerms) {
      this.props.router.navigate(`/search?terms=${this.state.searchTerms}`);
    } else {
      alert("Please enter some search text!");
    }
  };

  render() {
    return (
      <>
        <div className="conten-body" >
          <div
            style={{ background: 'linear-gradient(#88bdbc,white)', height: "350px" }}
          >
            <Container style={{ width: "75%" }} >
              <Row>
                <Col md="auto">
                  <h1
                    style={{ marginTop: "100px" }}>
                    Welcome to BEDbase
                  </h1>
                </Col>
                {this.state.bedSet !== -1 ? (
                  <>
                    <p style={{ marginBottom: "3px" }}>
                      Hosting {this.state.bed} BED files and  {this.state.bedSet} BED sets.
                    </p>
                  </>
                ) : null}
              </Row>

              <Row
                className="justify-content-center"
                style={{
                  marginTop: "50px",
                }}>
                <Col md="auto" style={{ paddingLeft: "0px", paddingRight: "0px" }}>
                  <Form inline="true">
                    <FormControl
                      style={{
                        width: "1200px",
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
              <Row className="justify-content-between">
                <Col md={4}>
                  <p style={{ fontSize: "9pt" }}>
                    * The search function is still under development. This is a demo.
                  </p>
                </Col>
                <Col md={4} style={{ padding: "0px" }}>
                  <Link
                    className="home-link"
                    style={{ marginRight: "10px" }}
                    data-toggle="tooltip"
                    title="sample BED file"
                    to={{
                      pathname: this.state.sampleBed,
                    }}>
                    View example BED file
                  </Link>
                  <Link
                    className="home-link"
                    data-toggle="tooltip"
                    title="sample BED set"
                    to={{
                      pathname: this.state.sampleBedSet,
                    }}>
                    View example BED set
                  </Link>
                </Col>
              </Row>
            </Container>
          </div>
          <Container style={{ width: "75%" }} >
            <Row className="justify-content-center">
              <Col md={7}>
                <p
                  style={{ marginTop: "50px" }}
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
              </Col>
              <Col md={5}>
                <img
                  style={{ marginLeft: "150px", height: "300px" }}
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

export default withRouter(Home);
import React, { useState, useEffect } from "react";
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
import "../style/search.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});

function Home() {
  const [bed, setBed] = useState(-1);
  const [bedSet, setBedSet] = useState(-1);
  const [sampleBed, setSampleBed] = useState("");
  const [sampleBedSet, setSampleBedSet] = useState("");
  const [searchTerms, setSearchTerms] = useState("");

  const fetchData = async () => {
    try {
      const bfcount = await api.get("/bed/count");
      setBed(bfcount.data);

      const bscount = await api.get("/bedset/count");
      setBedSet(bscount.data);

      const bedData = await api.get("/bed/example").then(({ data }) => data);
      const bedurl = `/bed/${bedData.record_identifier}`;
      setSampleBed(bedurl);

      const bedsetData = await api.get("/bedset/example").then(({ data }) => data);
      const bedseturl = `/bedset/${bedsetData.record_identifier}`;
      setSampleBedSet(bedseturl);
    } catch (error) {
      alert(`${error}; is bedhost running at ${bedhost_api_url}?`);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchInput = (e) => {
    setSearchTerms(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (searchTerms) {
        e.preventDefault();
        props.router.navigate(`/search?terms=${searchTerms}`);
      } else {
        alert("Please enter some search text!");
      }
    }
  };

  const handleSearchSubmit = () => {
    if (searchTerms) {
      props.router.navigate(`/search?terms=${searchTerms}`);
    } else {
      alert("Please enter some search text!");
    }
  };

  return (
    <>
      <div className="conten-body" >
        <div style={{ background: 'linear-gradient(#88bdbc,white)', height: "350px" }}>
          <Container style={{ width: "75%" }}>
            <Row>
              <Col md="auto">
                <h1 style={{ marginTop: "100px" }}>
                  Welcome to BEDbase
                </h1>
              </Col>
              <p>
                {bedSet !== -1 ? (`Hosting ${bed} BED files and ${bedSet} BED sets.`) : ('\u00a0\n')}
              </p>
            </Row>
            <Row className="justify-content-center" style={{ marginTop: "50px" }}>
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
                    onChange={handleSearchInput}
                    onKeyDown={handleKeyPress}
                    value={searchTerms}
                    type="text"
                    placeholder="Search BEDbase (ex. K562)"
                    className="mr-sm-2"
                  />
                </Form>
              </Col>
              <Col md="auto" style={{ paddingLeft: "0px", paddingRight: "0px" }}>
                <button
                  className="float-right btn-search"
                  style={{
                    width: "100px",
                    height: "48px",
                    marginLeft: "0px",
                    marginTop: "1px",
                    borderWidth: "0px"
                  }}
                  onClick={handleSearchSubmit}
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
                  to={{ pathname: sampleBed }}
                >
                  View example BED file
                </Link>
                <Link
                  className="home-link"
                  data-toggle="tooltip"
                  title="sample BED set"
                  to={{ pathname: sampleBedSet }}
                >
                  View example BED set
                </Link>
              </Col>
            </Row>
          </Container>
        </div>
        <Container style={{ width: "75%" }}>
          <Row className="justify-content-center">
            <Col md={7}>
              <p style={{ marginTop: "50px" }}>
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

export default withRouter(Home);

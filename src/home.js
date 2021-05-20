import React from "react";
import QueryBuilderWrapper from "./queryBuilder.jsx";
import BedCountsSpan from "./bedCountsSpan";
import Header from "./header";
import VersionsSpan from "./versionsSpan";
import Search from "./stringSearch";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Label } from "semantic-ui-react";
import "./style/home.css";

import { client } from "./const/server";
import { ApolloProvider } from "@apollo/client";

export default class Home extends React.Component {
  constructor(props) {
    super();
    this.state = {
      search: "bedfiles",
      setbtn: false,
      filebtn: true,
      searchType: "string",
      searchTerm: "",
    };
  }

  handleClick(type) {
    this.setState({ search: type });
    if (type === "bedsets") {
      this.setState({ filebtn: false, setbtn: true });
    } else {
      this.setState({ filebtn: true, setbtn: false });
    }
  }

  setSearchType(type) {
    this.setState({ searchType: type });
  }

  render() {
    return (
      <ApolloProvider client={client}>
        <React.StrictMode>
          <Header />
          <div className="conten-body">
            <Container style={{ width: "75%" }} fluid className="p-4">
              <BedCountsSpan />
            </Container>
            <Container style={{ width: "75%" }} fluid className="p-4">
              <Label
                style={{
                  marginBottom: "15px",
                  marginLeft: "15px",
                  fontSize: "15px",
                  padding: "6px 20px 6px 30px",
                }}
                as="a"
                color="teal"
                ribbon
              >
                Find BED Files
              </Label>
              {this.state.searchType === "string" ? (
                <Container>
                  <button
                    style={{ marginBottom: "15px" }}
                    className="btn btn-block btn-sm my-btn"
                    onClick={() => this.setSearchType("advance")}
                  >
                    {" "}
                    Advanced Search{" "}
                  </button>
                  <Search />
                </Container>
              ) : (
                <Container>
                  <button
                    style={{ marginBottom: "15px" }}
                    className="btn btn-block btn-sm my-btn"
                    onClick={() => this.setSearchType("string")}
                  >
                    {" "}
                    String Search{" "}
                  </button>

                  <Row>
                    <Col>
                      <button
                        className="btn btn-block btn-sm my-btn"
                        disabled={this.state.filebtn}
                        onClick={() => this.handleClick("bedfiles")}
                      >
                        {" "}
                        Search BED Files{" "}
                      </button>
                    </Col>
                    <Col md={6}>
                      <button
                        className="btn btn-block btn-sm my-btn"
                        disabled={this.state.setbtn}
                        onClick={() => this.handleClick("bedsets")}
                      >
                        {" "}
                        Search BED Sets{" "}
                      </button>
                    </Col>
                  </Row>
                  <QueryBuilderWrapper table_name={this.state.search} />
                </Container>
              )}
            </Container>
          </div>
          <VersionsSpan />
        </React.StrictMode>
      </ApolloProvider>
    );
  }
}

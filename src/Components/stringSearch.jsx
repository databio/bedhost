import React from "react";
import ResultsBed from "./searchResult";
import { Form, FormControl, Row, Col } from "react-bootstrap";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";
import bedhost_api_url from "../const/server";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class StringSearch extends React.Component {
  constructor(props) {
    super();
    this.state = {
      showResults: false,
      searchTerms: "",
      genomeList: [],
      genome: "hg38",
      searching: false
    };
  }

  async componentDidMount() {
    let genomes = await api.get("/api/bed/genomes").then(({ data }) => data);
    this.setState({ genomeList: genomes });
  }

  setShowResults() {
    this.setState({
      showResults: true,
      searching: true
    });
  }

  setSearchingFalse(val) {
    this.setState({ searching: val });
  };

  setSearchTerms(event) {
    this.setState({
      showResults: false,
      searchTerms: event.target.value,
    });
    this.forceUpdate();
  }

  handleSelect(e) {
    this.setState({
      genome: e,
      showResults: false,
    });
  }

  handleKeyPress(e) {
    //it triggers by pressing the enter key
    if (e.key === 'Enter') {
      this.setShowResults();
    }
  }
  // setLimit(event) {
  //     if (this.state.table_name === 'bedfiles') {
  //         this.setState({ bedlimit: event.target.value });
  //     } else {
  //         this.setState({ setlimit: event.target.value });
  //     }

  // };

  render() {
    return (
      <>
        <Row>
          <Col md="auto" style={{ paddingRight: "0px" }}>
            <Form inline>
              <FormControl
                className="float-left"
                style={{
                  width: "1220px",
                  borderRadius: "3px",
                }}
                type="text"
                value={this.state.searchTerms}
                placeholder="Search BEDbase (ex. K562)"
                onChange={this.setSearchTerms.bind(this)}
                onKeyPress={this.handleKeyPress.bind(this)}
              />
            </Form>
          </Col>
          <Col md="auto" style={{ paddingLeft: "0px", paddingRight: "0px" }}>
            <DropdownButton
              alignRight
              className="dropdown-btn"
              title={this.state.genome ? this.state.genome : "Select Genome"}
              id="select-genome"
              onSelect={this.handleSelect.bind(this)}
              onKeyPress={this.handleKeyPress.bind(this)}
            >
              {Array.from(new Set(this.state.genomeList.map(obj => obj.genome.alias))).map((value, index) => {
                return (
                  <Dropdown.Item key={index} eventKey={value}>
                    {value}
                  </Dropdown.Item>
                );
              })}
            </DropdownButton>
          </Col>
          <Col md="auto" style={{ paddingLeft: "0px", paddingRight: "0px" }}>
            <button
              className="float-right btn btn-search"
              style={{ width: "100%" }}
              onClick={this.setShowResults.bind(this)}
            >
              {this.state.searching ? " Searching... " : " SEARCH "}
            </button>
          </Col>
        </Row>
        {this.state.showResults ? (
          <ResultsBed
            terms={this.state.searchTerms}
            genome={this.state.genome}
            setSearchingFalse={this.setSearchingFalse.bind(this)}
          />
        ) : null}

      </>
    );
  }
}

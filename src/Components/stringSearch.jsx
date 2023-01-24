import React from "react";
import ResultsBed from "./searchResult";
import { Row, Col } from "react-bootstrap";
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
    console.log("entered:", this.props.searchTerms)
    if (this.props.searchTerms) {
      this.setState({
        searchTerms: this.props.searchTerms,
        showResults: true,
      });
    }

    console.log("entered:", this.state.searchTerms)
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

  setSearchTerms(e) {
    this.setState({
      searchTerms: e.target.value,
      showResults: false,
    });
    this.forceUpdate();
  }

  handleSelect(e) {
    this.setState({
      genome: e,
      showResults: false,
    });
  }

  handleSearchSubmit(e) {
    //it triggers by pressing the enter key
    if (e.key === 'Enter') {
      if (this.state.searchTerms) {
        this.setShowResults();
      } else {
        alert("Please enter some search text!");
      }
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
            <input
              className="float-left search-input"
              type="text"
              value={this.state.searchTerms}
              placeholder="Search BEDbase (ex. K562)"
              onChange={this.setSearchTerms.bind(this)}
              onKeyDown={this.handleSearchSubmit.bind(this)}
            />
          </Col>
          <Col md="auto" style={{ paddingLeft: "0px", paddingRight: "0px" }}>
            <DropdownButton
              alignRight
              className="dropdown-btn"
              title={this.state.genome ? this.state.genome : "Select Genome"}
              id="select-genome"
              onSelect={this.handleSelect.bind(this)}
              onKeyPress={this.handleSearchSubmit.bind(this)}
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
              onClick={this.setShowResults.bind(this)}
              disabled={this.state.searching ? "true" : ""}
            >
              SEARCH
            </button>
          </Col>
        </Row>
        {
          this.state.showResults ? (
            <ResultsBed
              terms={this.state.searchTerms}
              genome={this.state.genome}
              setSearchingFalse={this.setSearchingFalse.bind(this)}
            />
          ) : null
        }

      </>
    );
  }
}

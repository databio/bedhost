import React from "react";
import ResultsBed from "./searchResult";
import { Container, Row } from "react-bootstrap";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";
import bedhost_api_url from "../const/server";
import "../style/queryBuilder.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class StringSearch extends React.Component {
  constructor(props) {
    super();
    this.state = {
      showResults: false,
      searchTerms: "K562",
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

  handleKeypress(e) {
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
      <div>
        <Container>
          <Row style={{ marginBottom: "15px" }}>
            <input
              className="float-left"
              style={{
                marginRight: "10px",
                width: "84%",
                height: "33px",
                padding: "5px",
                borderColor: "#ced4da",
                borderStyle: "solid",
                borderWidth: "1px",
                borderRadius: ".25rem",
              }}
              type="text"
              value={this.state.searchTerms}
              onChange={this.setSearchTerms.bind(this)}
              onKeyPress={this.handleKeypress.bind(this)}
            />
            <DropdownButton
              alignRight
              title={this.state.genome ? this.state.genome : "Select Genome"}
              id="select-genome"
              onSelect={this.handleSelect.bind(this)}
              style={{ height: "33px", marginRight: "10px" }}
              onKeyPress={this.handleKeypress.bind(this)}
            >
              {Array.from(new Set(this.state.genomeList.map(obj => obj.genome.alias))).map((value, index) => {
                return (
                  <Dropdown.Item key={index} eventKey={value}>
                    {value}
                  </Dropdown.Item>
                );
              })}
            </DropdownButton>
            <button
              style={{ height: "33px" }}
              className="float-right btn btn-sm my-btn"
              onClick={this.setShowResults.bind(this)}
            >
              {this.state.searching ? "Searching..." : "SEARCH"}
            </button>
          </Row>
          {this.state.showResults ? (
            <ResultsBed
              terms={this.state.searchTerms}
              genome={this.state.genome}
              setSearchingFalse={this.setSearchingFalse.bind(this)}
            />
          ) : null}
        </Container>
      </div>
    );
  }
}

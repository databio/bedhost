import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom"
import ResultsBed from "./searchResult";
import { Row, Col } from "react-bootstrap";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";
import bedhost_api_url from "../const/server";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default function StringSearch() {
  const [showResults, setShowResults] = useState(false);
  const [searchTerms, setSearchTerms] = useState();
  const [genomeList, setGenomeList] = useState([]);
  const [genome, setGenome] = useState("hg38");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    api.get("/api/bed/genomes").then(result => setGenomeList(result.data));
  }, []);

  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);

  useEffect(() => {
    setSearchTerms(query.get("terms"))
    if (searchTerms) {
      setShowResults(true)
    }
  }, [query, searchTerms]);

  const handleShowResults = () => {
    setShowResults(true)
    setSearching(true)
  }

  const handleSearching = (val) => {
    setSearching(val)
  };

  const handleSearchTerms = (e) => {
    setSearchTerms(e.target.value)
    setShowResults(false)
    // this.forceUpdate();
  }

  const handleSelect = (e) => {
    setGenome(e)
    setShowResults(false)
  }

  const handleSearchSubmit = (e) => {
    //it triggers by pressing the enter key
    if (e.key === 'Enter') {
      if (searchTerms) {
        handleShowResults();
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

  return (
    <>
      <Row>
        <Col md="auto" style={{ paddingRight: "0px" }}>
          <input
            className="float-left search-input"
            type="text"
            value={searchTerms || ""}
            placeholder="Search BEDbase (ex. K562)"
            onChange={handleSearchTerms}
            onKeyDown={handleSearchSubmit}
          />
        </Col>
        <Col md="auto" style={{ paddingLeft: "0px", paddingRight: "0px" }}>
          <DropdownButton
            alignRight
            className="dropdown-btn"
            title={genome ? genome : "Select Genome"}
            id="select-genome"
            onSelect={handleSelect}
            onKeyPress={handleSearchSubmit}
          >
            {Array.from(new Set(genomeList.map(obj => obj.genome.alias))).map((value, index) => {
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
            onClick={handleShowResults}
            disabled={searching ? "true" : ""}
          >
            SEARCH
          </button>
        </Col>
      </Row>
      <p style={{ fontSize: "8pt" }}>
        * The search function is still under development. This is a demo.
      </p>
      {
        showResults ? (
          <ResultsBed
            terms={searchTerms}
            genome={genome}
            setSearchingFalse={handleSearching}
          />
        ) : null
      }

    </>
  );
}

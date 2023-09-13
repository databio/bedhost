import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom"

import ResultsBed from "./searchResult";
import { Row, Col } from "react-bootstrap";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";
import bedhost_api_url from "../const/server";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default function StringSearch() {
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);

  const [showResults, setShowResults] = useState(false);
  const [searchTerms, setSearchTerms] = useState(query.get("terms"));
  const [genomeList, setGenomeList] = useState([]);
  const [genome, setGenome] = useState("hg38");
  const [searching, setSearching] = useState(false);
  const [temp, setTemp] = useState(query.get("terms"));

  let navigate = useNavigate();

  useEffect(() => {
    api.get("/bed/genomes").then(result => setGenomeList(result.data));
  }, []);

  useEffect(() => {
    if (searchTerms) {
      setShowResults(true)
    }
  }, [query, searchTerms]);

  const handleShowResults = () => {
    navigate(`/search?terms=${temp}`)
    setShowResults(true)
    setSearching(false)
  }

  const handleSearching = (val) => {
    setSearching(val)
  };

  const handleSelect = (e) => {
    setGenome(e)
    setShowResults(false)
  }

  const handleSearchSubmit = (e) => {
    //it triggers by pressing the enter key
    if (e.key === 'Enter') {
      setSearchTerms(temp)
      handleShowResults();
    } else if (e.key === "Backspace") {
      setShowResults(false)
      const input = temp.substring(0, temp.length)
      setTemp(input)
    } else {
      setShowResults(false)
      setTemp(e.target.value)
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
            value={temp || ""}
            placeholder="Search BEDbase (ex. K562)"
            onChange={handleSearchSubmit}
            onKeyDown={handleSearchSubmit}
          />
        </Col>
        <Col md="auto" style={{ paddingLeft: "0px", paddingRight: "0px" }}>
          <DropdownButton
            alignright="true"
            className="dropdown-btn"
            title={genome ? genome : "Select Genome"}
            id="select-genome"
            onSelect={handleSelect}
          // onKeyPress={handleSearchSubmit}
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
            disabled={searching ? true : false}
          >
            SEARCH
          </button>
        </Col>
      </Row>
      <p style={{ fontSize: "9pt" }}>
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

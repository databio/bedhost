import React from "react";
import { Container, Row } from "react-bootstrap";
import { Tab, Tabs } from 'react-bootstrap';
import { StringSearch, BedCountsSpan, AdvancedSearch } from "../Components";
import "../style/search.css";

export default class SearchPage extends React.Component {
    constructor(props) {
        super();
        this.state = {
            search: "bedfiles",
            searchType: "string",
            searchTerms: "",
        };
    }

    componentWillMount() {
        if (this.props.location.state) {
            console.log("search entered:", this.props.location.state.searchTerms)
            this.setState({
                searchTerms: this.props.location.state.searchTerms,
            });
        }
        console.log("search entered:", this.state.searchTerms)
    }


    setSearchType(type) {
        this.setState({ searchType: type });
    }

    render() {
        return (
            <>
                <div className="conten-body">
                    <Container style={{ width: "75%" }} fluid className="p-4">
                        <BedCountsSpan />
                    </Container>
                    <Container style={{ width: "75%" }} fluid className="p-4">
                        {this.state.searchType === "string" ? (
                            <>
                                <button
                                    className="btn btn-sm"
                                    style={{ padding: "0px", borderWidth: "0px" }}
                                    onClick={() => this.setSearchType("advance")}>
                                    Advanced Search
                                </button>
                                <StringSearch searchTerm={this.state.searchTerms} />
                            </>
                        ) : (
                            <>
                                <button
                                    className="btn btn-sm"
                                    style={{ padding: "0px", borderWidth: "0px" }}
                                    onClick={() => this.setSearchType("string")}
                                >
                                    String Search
                                </button>
                                <Row>
                                    <Tabs
                                        defaultActiveKey="bed"
                                        id="uncontrolled-tab-example"
                                        className="justify-content-end"
                                    >
                                        <Tab eventKey="bed" title="Search BED Files">
                                            <AdvancedSearch table_name="bedfiles" />
                                        </Tab>
                                        <Tab eventKey="bedset" title="Search BED Sets">
                                            <AdvancedSearch table_name="bedsets" />
                                        </Tab>
                                    </Tabs>
                                </Row>
                            </>
                        )}
                    </Container>
                </div>
            </>
        );
    }
}
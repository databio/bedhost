import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { StringSearch, BedCountsSpan, AdvancedSearch } from "../Components";
import "../style/home.css";

export default class SearchPage extends React.Component {
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
            <>
                <div className="conten-body">
                    <Container style={{ width: "75%" }} fluid className="p-4">
                        <BedCountsSpan />
                    </Container>
                    <Container style={{ width: "75%" }} fluid className="p-4">
                        {this.state.searchType === "string" ? (
                            <Container>
                                <button
                                    style={{ marginBottom: "15px" }}
                                    className="btn btn-block btn-sm my-btn"
                                    onClick={() => this.setSearchType("advance")}
                                >
                                    Advanced Search
                                </button>
                                <StringSearch />
                            </Container>
                        ) : (
                            <Container>
                                <button
                                    style={{ marginBottom: "15px" }}
                                    className="btn btn-block btn-sm my-btn"
                                    onClick={() => this.setSearchType("string")}
                                >
                                    String Search
                                </button>

                                <Row>
                                    <Col>
                                        <button
                                            className="btn btn-block btn-sm my-btn"
                                            disabled={this.state.filebtn}
                                            onClick={() => this.handleClick("bedfiles")}
                                        >
                                            Search BED Files
                                        </button>
                                    </Col>
                                    <Col md={6}>
                                        <button
                                            className="btn btn-block btn-sm my-btn"
                                            disabled={this.state.setbtn}
                                            onClick={() => this.handleClick("bedsets")}
                                        >
                                            Search BED Sets
                                        </button>
                                    </Col>
                                </Row>
                                <AdvancedSearch table_name={this.state.search} />
                            </Container>
                        )}
                    </Container>
                </div>
            </>
        );
    }
}
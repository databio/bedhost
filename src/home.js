import React from "react";
import QueryBuilderBedset from './queryBuilderBedset.jsx';
import QueryBuilderBedfile from './queryBuilderBedfile.jsx';
import BedCountsSpan from "./bedCountsSpan";
import BedSetList from "./bedSetList";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import "bootstrap/dist/css/bootstrap.min.css";

export default class Home extends React.Component {
    constructor(props) {
        super();
        this.state = {
            search: ""
        };
    }

    handleClick(type) {
        this.setState({ search: type });
    };

    render() {
        return (
            <React.StrictMode>
                <Header />
                <Container fluid className="p-4">
                    <Row>
                        <Col>
                            <BedCountsSpan />
                        </Col>
                    </Row>
                </Container>
                <Container fluid className="p-4">
                    <Row>
                        <Col>
                            <Row>
                                <Col md={6}>
                                    <button className='btn btn-block btn-info btn-sm' onClick={() => this.handleClick('bedfiles')}> Search Bedfiles </button>
                                </Col>
                                <Col md={6}>
                                    <button className='btn btn-block btn-info btn-sm' onClick={() => this.handleClick('bedsets')}> Search Bedsets </button>
                                </Col>
                            </Row>

                            {this.state.search === "bedsets" ? (
                                <QueryBuilderBedset />
                            ) : (
                                    <QueryBuilderBedfile />
                                )}
                            {/* <QueryBuilderWrapper/> */}
                        </Col>
                        <Col md={6}>
                            <BedSetList />
                        </Col>
                    </Row>
                </Container>
                <VersionsSpan />
            </React.StrictMode>
        )
    }
}
import React from "react";
import QueryBuilderWrapper from './queryBuilder.jsx';
import BedCountsSpan from "./bedCountsSpan";
import BedSetList from "./bedSetList";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import "bootstrap/dist/css/bootstrap.min.css";

export default class Home extends React.Component {
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
                    <Col md={4}>
                        <BedSetList />
                    </Col>
                    <Col>
                        <h1> Search Component</h1>
                        <QueryBuilderWrapper />
                    </Col>
                    </Row>
                </Container>
                <VersionsSpan />
            </React.StrictMode>
        )
    }
}
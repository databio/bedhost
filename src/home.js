import React from "react";
import QueryBuilder from './queryBuilder.jsx';
import BedCountsSpan from "./bedCountsSpan";
import BedSetList from "./bedSetList";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import "bootstrap/dist/css/bootstrap.min.css";
import { Label } from 'semantic-ui-react'

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
                {/* <Container fluid className="p-4">
                    <Row>
                        <Col>
                            <Row>
                                <Col md={6}>
                                    <button className='btn btn-block btn-sm' style={{backgroundColor:'#264653', color:"white"}} onClick={() => this.handleClick('bedfiles')}> Search BED Files </button>
                                </Col>
                                <Col md={6}>
                                    <button className='btn btn-block btn-sm' style={{backgroundColor:'#264653', color:"white"}} onClick={() => this.handleClick('bedsets')}> Search BED Sets </button>
                                </Col>
                            </Row>

                            {this.state.search === "bedsets" ? (
                                <QueryBuilderBedset />
                            ) : (
                                    <QueryBuilderBedfile />
                                )}
                        </Col>
                        <Col md={6}>
                            <BedSetList />
                        </Col>
                    </Row>
                </Container> */}
                <Container fluid className="p-4">
                    <Row>
                        <Col>
                            <Label style={{marginLeft: '15px', fontSize: '15px'}} as='a' color='teal' ribbon>
                                BED File Search
                            </Label>
                            <QueryBuilder schema = 'bedfile'/>
                            <BedSetList />
                        </Col>
                        <Col >
                            <Label style={{marginLeft: '15px', fontSize: '15px'}} as='a' color='teal' ribbon>
                                BED Set Search
                            </Label>
                            <QueryBuilder schema = 'bedset' />
                            <BedSetList />
                        </Col>
                    </Row>
                </Container>
                <VersionsSpan />
            </React.StrictMode>
        )
    }
}
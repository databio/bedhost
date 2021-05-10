import React from "react";
import QueryBuilderWrapper from './queryBuilder.jsx';
import BedCountsSpan from "./bedCountsSpan";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Label } from 'semantic-ui-react';
import "./style/home.css"

import bedhost_api_url, {client} from "./const";
import {ApolloProvider, HttpLink,} from "@apollo/client"

export default class Home extends React.Component {
    constructor(props) {
        super();
        this.state = {
            search: "bedfiles",
            setbtn: false,
            filebtn: true
        };
    }

    handleClick(type) {
        this.setState({ search: type });
        if (type === "bedsets") {
            this.setState({ filebtn: false, setbtn: true })
        } else {
            this.setState({ filebtn: true, setbtn: false })
        }
    };

    render() {
        return (
            <ApolloProvider client={client}>
                <React.StrictMode >
                    <Header />
                    <div className="conten-body">
                        <Container style={{ width: "75%" }} fluid className="p-4">
                            <BedCountsSpan />
                        </Container>
                        <Container style={{ width: "75%" }} fluid className="p-4">
                            <Label style={{ marginBottom: "15px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                                Find BED Files
                        </Label>
                            <Row>
                                <Col >
                                    <button className='btn btn-block btn-sm my-btn' disabled={this.state.filebtn} onClick={() => this.handleClick('bedfiles')}> Search BED Files </button>
                                </Col>
                                <Col md={6}>
                                    <button className='btn btn-block btn-sm my-btn' disabled={this.state.setbtn} onClick={() => this.handleClick('bedsets')}> Search BED Sets </button>
                                </Col>
                            </Row>
                            <QueryBuilderWrapper table_name={this.state.search} />
                        </Container>
                    </div>
                    <VersionsSpan />
                </React.StrictMode>
            </ApolloProvider>
        )
    }
}
import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Header from './header';
import StatsDef from './statsDef';
import VersionsSpan from "./versionsSpan";
import "./style/home.css"



export default class Info extends React.Component {
    render() {
        return (
            <React.StrictMode >
                <Header />
                <div className="conten-body" style={{ display: 'flex', justifyContent: 'center' }}>
                    <Container style={{ width: "75%" }} fluid className="p-4">
                        <Row>
                            <Col md={10}>
                                <div>
                                    <h1>About</h1>
                                    <p>
                                        Bedbase is a unifying platform for aggregating, analyzing {" "}
                                    and serving genomic region data as BED files. Input files are {" "}
                                    processed by a series of python pipelines. The output of {" "}
                                    these pipelines is displayed through a RESTful API where {" "}
                                    users can access BED files along with useful statistics and {" "}
                                    plots.
                                    </p>
                                    <img
                                        src="/workflow.svg"
                                        width='100%'
                                        alt="BEDBASE logo"
                                    />
                                    <h2>How does Bedbase work?</h2>
                                    <h3>Bedmaker</h3>
                                    <p>
                                    Standardize heterogenous and numerous omics region data files into BED format. {" "}
                                    Generate bigBed files for visualization in Genome Browser. {" "}
                                    Current supported formats are bed, bedGraph, bigBed, bigWig, and wig.
                                    </p>
                                    <h3>Bedstat</h3>
                                    <p>
                                    Calculate and plot a wide variety of genomic region statistics, {" "}
                                    insert BED files metadata/plots into PostgresQL database. {" "}
                                    </p>
                                    <h3>Bedbuncher</h3>
                                    <p>
                                    Retrieve and group BED files according to biological or experimental attributes. {" "}
                                    Bedsets also contain group statistics and outputs for downstream analysis. {" "}
                                    </p>
                                    <h3>Bedhost</h3>
                                    <p>
                                    Search/download statistics, plots, Bed files, BEDsets and other useful outputs. 
                                    </p>
                                </div>
                                <div id='stats-def' >
                                    <StatsDef />
                                </div>
                            </Col>
                            <Col md={2}>
                                <a href='/about'><p>About</p></a>
                                <a href="#stats-def"><p>Statistic Defination</p></a>
                            </Col>
                        </Row>
                    </Container>
                </div>
                <VersionsSpan />
            </React.StrictMode>
        )
    }
}
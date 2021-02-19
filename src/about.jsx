import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Header from './header';
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
                            <Col md={9}>
                                <div id='about'>
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
                                </div>
                                <div id='key-features' style={{ marginTop: '15px' }}>
                                    <h1>Key Features</h1>
                                    <p>
                                        <b>Comprehensive statistics:{' '}</b>
                                        GC content, genomic partitions distribution, distance to TSS, etc.
                                    </p>
                                    <p>
                                        <b>Bedsets:{' '}</b>
                                        Building of targeted collections of BED files based on genome assembly, experiment protocol, antibody, cell type, etc.
                                    </p>
                                    <p>
                                        <b>Fast access:{' '}</b>
                                        PostgresQL backend for storing of BED files and Bedsets metadata, saving considerable disk space.
                                    </p>
                                </div>
                                <div id='how-does-it-work' style={{ marginTop: '15px' }}>
                                    <h1>How does Bedbase work?</h1>
                                    <p>
                                        <b>Bedmaker: {' '}</b>
                                        Standardize heterogenous and numerous omics region data files into BED format. {" "}
                                        Generate bigBed files for visualization in Genome Browser. {" "}
                                        Current supported formats are bed, bedGraph, bigBed, bigWig, and wig.
                                    </p>
                                    <p>
                                    <b>Bedstat: {' '}</b>
                                        Calculate and plot a wide variety of genomic region statistics, {" "}
                                        insert BED files metadata/plots into PostgresQL database. {" "}
                                    </p>
                                    <p>
                                    <b>Bedbuncher: {' '}</b>
                                        Retrieve and group BED files according to biological or experimental attributes. {" "}
                                        Bedsets also contain group statistics and outputs for downstream analysis. {" "}
                                    </p>
                                    <p>
                                        <b>Bedhost: {' '}</b>
                                        Search/download statistics, plots, Bed files, BEDsets and other useful outputs.
                                    </p>
                                    <p> Please go to our <a className="home-link" href = 'https://github.com/databio/bedbase'>GitHub repository</a> {' '}
                                    to see the full <a className="home-link" href = 'https://github.com/databio/bedbase/blob/trackHub/docs_jupyter/bedbase_tutorial.ipynb'>Bedbase tutorial</a>. </p>
                                </div>
                                <div id='stats-def' style={{ marginTop: '15px' }}>
                                    <h1>Statistic Definations</h1>
                                    <div id='bedfile-stats'>
                                        <h2 >BED File Statistics </h2>
                                        <table style={{ marginBottom: '15px' }}>
                                            <tbody>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        gc_content
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The average GC content of the region set.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        regions_no
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The total number of regions in the BED file.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        mean_absolute_tss_dist
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The average absolute distance to the Transcription Start Sites (TSS)
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        mean_region_width
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The average region width of the region set.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        exon (%)
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The percentage of the regions in the BED file that are annotated as exon.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        intron (%)
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The percentage of the regions in the BED file that are annotated as intron.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        promoterprox (%)
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The percentage of the regions in the BED file that are annotated as promoter-prox.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        intergenic (%)
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The percentage of the regions in the BED file that are annotated as intergenic.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        promotercore (%)
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The percentage of the regions in the BED file that are annotated as promoter-core.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        fiveutr (%)
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The percentage of the regions in the BED file that are annotated as 5'-UTR.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        threeutr (%)
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The percentage of the regions in the BED file that are annotated as 3'-UTR.
                                                </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div id='bedset-stats'>
                                        <h2>BED Set Statistics </h2>
                                        <table style={{ marginBottom: '15px' }}>
                                            <tbody>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        gc_content
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The average GC content of the BED set.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        mean_absolute_tss_dist
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The average absolute distance to the Transcription Start Sites (TSS) of the BED set.
                                                </td>
                                                </tr>
                                                <tr style={{ verticalAlign: "top" }} >
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold" }}>
                                                        mean_region_width
                                                </td>
                                                    <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                                                        The average region width of the BED set.
                                                </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Col>
                            <Col md={3}>
                                <div style={{ marginLeft: '55px' }}>
                                <a className="home-link" href='#about'><p>About</p></a>
                                <a className="home-link" href='#key-features'><p>Key Features</p></a>
                                <a className="home-link" href='#how-does-it-work'><p>How does it work?</p></a>
                                <a className="home-link" href='#stats-def'><p>Statistic Defination</p></a>
                                <a className="home-link" href='#bedfile-stats'><p style={{ marginLeft: '20px' }}>BED File Statistics</p></a>
                                <a className="home-link" href='#bedset-stats'><p style={{ marginLeft: '20px' }}>BED Set Statistics</p></a>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>
                <VersionsSpan />
            </React.StrictMode>
        )
    }
}
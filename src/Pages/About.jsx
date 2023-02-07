import React from "react";
import { Container, Row, Col } from "react-bootstrap";

export default class About extends React.Component {
  render() {
    return (
      <React.StrictMode>
        <div
          className="conten-body"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Container style={{ width: "75%" }} fluid className="p-4">
            <Row>
              <Col md={9}>
                <div id="about">
                  <h4>About</h4>
                  <p>
                    Bedbase is a unifying platform for aggregating, analyzing{" "}
                    and serving genomic region data as BED files. Input files
                    are processed by a series of python pipelines. The output of{" "}
                    these pipelines is displayed through a RESTful API where{" "}
                    users can access BED files along with useful statistics and{" "}
                    plots.
                  </p>
                  <img src="/ui/workflow.svg" width="100%" alt="workflow" />
                  {/* <img src="/workflow.svg" width="100%" alt="workflow" /> */}
                </div>
                <div id="key-features" style={{ marginTop: "15px" }}>
                  <h4>Key Features</h4>
                  <p>
                    <b>Comprehensive statistics: </b>
                    GC content, genomic partitions distribution, distance to
                    TSS, etc.
                  </p>
                  <p>
                    <b>Bedsets: </b>
                    Building of targeted collections of BED files based on
                    genome assembly, experiment protocol, antibody, cell type,
                    etc.
                  </p>
                  <p>
                    <b>Fast access: </b>
                    PostgresQL backend for storing of BED files and Bedsets
                    metadata, saving considerable disk space.
                  </p>
                </div>
                <div id="how-does-it-work" style={{ marginTop: "15px" }}>
                  <h4>How does Bedbase work?</h4>
                  <p>
                    <b>Bedmaker: </b>
                    Standardize heterogenous and numerous omics region data
                    files into BED format. Generate bigBed files for
                    visualization in Genome Browser. Current supported formats
                    are bed, bedGraph, bigBed, bigWig, and wig.
                  </p>
                  <p>
                    <b>Bedstat: </b>
                    Calculate and plot a wide variety of genomic region
                    statistics, insert BED files metadata/plots into PostgresQL
                    database.{" "}
                  </p>
                  <p>
                    <b>Bedbuncher: </b>
                    Retrieve and group BED files according to biological or
                    experimental attributes. Bedsets also contain group
                    statistics and outputs for downstream analysis.{" "}
                  </p>
                  <p>
                    <b>Bedhost: </b>
                    Search/download statistics, plots, Bed files, BEDsets and
                    other useful outputs.
                  </p>
                  <p>
                    {" "}
                    We use the standard{" "}
                    <a
                      className="home-link"
                      href="http://pep.databio.org/en/latest/"
                    >
                      PEP
                    </a>{" "}
                    format for the annotation of the files to load. PEP consists
                    of 1) a sample table (.csv) that annotates the files, and 2)
                    a project config.yaml file that points to the sample
                    annotation sheet. The config file also has other components,
                    such as derived and implied attributes. To run the pipelines
                    for Bedbase, we are use the pipeline submission engine{" "}
                    <a
                      className="home-link"
                      href="http://looper.databio.org/en/latest/"
                    >
                      Looper
                    </a>
                    . Please go to our{" "}
                    <a
                      className="home-link"
                      href="https://github.com/databio/bedbase"
                    >
                      GitHub repository
                    </a>{" "}
                    to see the full{" "}
                    <a
                      className="home-link"
                      href="https://github.com/databio/bedbase/blob/trackHub/docs_jupyter/bedbase_tutorial.ipynb"
                    >
                      Bedbase tutorial
                    </a>
                    .{" "}
                  </p>
                </div>
                <div id="stats-def" style={{ marginTop: "15px" }}>
                  <h4>Statistic Definations</h4>
                  <div id="bedfile-stats">
                    <h5>BED File Statistics </h5>
                    <table style={{ marginBottom: "10px" }}>
                      <tbody>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10px",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            GC content
                          </td>
                          <td style={{ padding: "3px 10px" }}>
                            The average GC content of the region set.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10px",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            Number of regions
                          </td>
                          <td style={{ padding: "3px 10px" }}>
                            The total number of regions in the BED file.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10px",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            Median TSS distance
                          </td>
                          <td style={{ padding: "3px 10px" }}>
                            The median absolute distance to the Transcription
                            Start Sites (TSS)
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10px",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            Mean region width
                          </td>
                          <td style={{ padding: "3px 10px" }}>
                            The average region width of the region set.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10px",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            Exon percentage
                          </td>
                          <td style={{ padding: "3px 10px" }}>
                            The percentage of the regions in the BED file that
                            are annotated as exon.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10px",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            Intron percentage
                          </td>
                          <td style={{ padding: "3px 10pt" }}>
                            The percentage of the regions in the BED file that
                            are annotated as intron.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10pt",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            Promoter proc percentage
                          </td>
                          <td style={{ padding: "3px 10pt" }}>
                            The percentage of the regions in the BED file that
                            are annotated as promoter-prox.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10pt",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            Intergenic percentage
                          </td>
                          <td style={{ padding: "3px 10pt" }}>
                            The percentage of the regions in the BED file that
                            are annotated as intergenic.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10pt",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            Promoter core percentage
                          </td>
                          <td style={{ padding: "3px 10pt" }}>
                            The percentage of the regions in the BED file that
                            are annotated as promoter-core.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10pt",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            5' UTR percentage
                          </td>
                          <td style={{ padding: "3px 10pt" }}>
                            The percentage of the regions in the BED file that
                            are annotated as 5'-UTR.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10pt",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            3' UTR percentage
                          </td>
                          <td style={{ padding: "3px 10pt" }}>
                            The percentage of the regions in the BED file that
                            are annotated as 3'-UTR.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div id="bedset-stats">
                    <h5>BED Set Statistics </h5>
                    <table style={{ marginBottom: "10px" }}>
                      <tbody>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10pt",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            GC content
                          </td>
                          <td style={{ padding: "3px 10pt" }}>
                            The average GC content of the BED set.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10pt",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            Median TSS distance
                          </td>
                          <td style={{ padding: "3px 10pt" }}>
                            The average median absolute distance to the Transcription
                            Start Sites (TSS) of the BED set.
                          </td>
                        </tr>
                        <tr style={{ verticalAlign: "top" }}>
                          <td
                            style={{
                              padding: "3px 10pt",
                              fontWeight: "bold",
                              width: '250px'
                            }}
                          >
                            Mean region width
                          </td>
                          <td style={{ padding: "3px 10pt" }}>
                            The average region width of the BED set.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div style={{ marginLeft: "55px" }}>
                  <a className="home-link" href="#about">
                    <p>About</p>
                  </a>
                  <a className="home-link" href="#key-features">
                    <p>Key Features</p>
                  </a>
                  <a className="home-link" href="#how-does-it-work">
                    <p>How does it work?</p>
                  </a>
                  <a className="home-link" href="#stats-def">
                    <p>Statistic Defination</p>
                  </a>
                  <a className="home-link" href="#bedfile-stats">
                    <p style={{ marginLeft: "20px" }}>BED File Statistics</p>
                  </a>
                  <a className="home-link" href="#bedset-stats">
                    <p style={{ marginLeft: "20px" }}>BED Set Statistics</p>
                  </a>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </React.StrictMode>
    );
  }
}

import React from "react";
import { Container, Row, Col } from "react-bootstrap";


export default function About() {
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
                  and serving genomic region data as BED files. Input files are
                  processed by a series of python pipelines. The output of these
                  pipelines is displayed through a RESTful API where users can
                  access BED files along with useful statistics and plots.
                </p>
                {/* <img src="/ui/workflow.svg" width="100%" alt="workflow" /> */}
                <img src="/workflow.svg" width="100%" alt="workflow" />
              </div>
              <div id="key-features" style={{ marginTop: "15px" }}>
                <h4>Key Features</h4>
                <p>
                  <b>Comprehensive statistics: </b>
                  GC content, genomic partitions distribution, distance to TSS,
                  etc.
                </p>
                <p>
                  <b>Bedsets: </b>
                  Building of targeted collections of BED files based on genome
                  assembly, experiment protocol, antibody, cell type, etc.
                </p>
                <p>
                  <b>Fast access: </b>
                  PostgresQL backend for storing of BED files and Bedsets
                  metadata, saving considerable disk space.
                </p>
              </div>
              <div
                id="how-does-it-work"
                style={{ marginTop: "15px" }}
              >
                <h4>How does Bedbase work?</h4>
                <p>
                  <b>Bedmaker: </b>
                  Standardize heterogenous and numerous omics region data files
                  into BED format. Generate bigBed files for visualization in
                  Genome Browser. Current supported formats are bed, bedGraph,
                  bigBed, bigWig, and wig.
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
                  experimental attributes. Bedsets also contain group statistics
                  and outputs for downstream analysis.{" "}
                </p>
                <p>
                  <b>Bedhost: </b>
                  Search/download statistics, plots, Bed files, BEDsets and other
                  useful outputs.
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
                  of 1) a sample table (.csv) that annotates the files, and 2) a
                  project config.yaml file that points to the sample annotation
                  sheet. The config file also has other components, such as
                  derived and implied attributes. To run the pipelines for
                  Bedbase, we are use the pipeline submission engine{" "}
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
                <h4>Statistic Definitions</h4>
                <div id="bedfile-stats">
                  <h5>BED File Statistics </h5>
                  <table style={{ marginBottom: "10px" }}>
                    <tbody>
                      {/* ... (existing table rows) ... */}
                    </tbody>
                  </table>
                </div>
                <div id="bedset-stats">
                  <h5>BED Set Statistics </h5>
                  <table style={{ marginBottom: "10px" }}>
                    <tbody>
                      {/* ... (existing table rows) ... */}
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
                  <p>Statistic Definition</p>
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
};

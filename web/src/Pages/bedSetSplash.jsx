import React, { useState, useEffect } from "react";
import { withRouter } from '../Components/withRouter';
import { HashLink as Link } from "react-router-hash-link";
import { Container, Row, Col, Card } from "react-bootstrap";
import { FaExternalLinkAlt } from "react-icons/fa"
import { BsQuestionCircle } from "react-icons/bs";
import { BedSetTable, BedSetPlots, BarChart, NoRecord } from "../Components";
import bedhost_api_url from "../const/server";
import axios from "axios";
import {
  bedset_stats_cols,
  bedset_distribution_cols
} from "../fastapi/bedSetQueries";
import "../style/splash.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});

const BedSetSplash = ({ router }) => {

  const [bedSetName, setBedSetName] = useState("");
  const [bedsCount, setBedsCount] = useState("");
  const [creatTime, setCreatTime] = useState("");
  const [modifiedTime, setModifiedTime] = useState("");
  const [genome, setGenome] = useState({});
  const [bedSetStat, setBedSetStat] = useState([]);
  const [avgRegionD, setAvgRegionD] = useState({});
  const [bedSetFig, setBedSetFig] = useState(false);
  const [hubFilePath, setHubFilePath] = useState("");
  const [bedSetTableData, setBedSetTableData] = useState({});
  const [bedSchema, setBedSchema] = useState({});
  const [code, setCode] = useState(-1);


  useEffect(() => {
    const fetchData = async () => {
      // get table schema via fastAPI
      const bed_schema = await api
        .get("/bed/schema")
        .then(({ data }) => data["properties"]["samples"]["properties"]);
      const bedset_schema = await api
        .get("/bedset/schema")
        .then(({ data }) => data["properties"]["samples"]["properties"]);

      const res = await api
        .get(`/bedset/${router.params.bedset_md5sum}/metadata`)
        .then(({ data }) => {
          setCode(200);
          return data;
        })
        .catch(error => {
          setCode(error.response.status)
        });
      console.log(res)

      if (code === 200) {
        setBedSetName(res.name)
        setGenome(res.genome)
        setCreatTime(res.pipestat_created_time.replace(/(.*?:.*?):.*/, '$1'))
        setModifiedTime(res.pipestat_modified_time.replace(/(.*?:.*?):.*/, '$1'))
        setBedSchema(bed_schema)
        setHubFilePath(
          `http://genome.ucsc.edu/cgi-bin/hgTracks?db=${res.genome.alias}&hubUrl=${bedhost_api_url}/bedset/${router.params.bedset_md5sum}/track_hub`
        )


        const avg = res.bedset_means;
        const sd = res.bedset_standard_deviation;

        let bedSetStat = []
        bedset_stats_cols.forEach((col, idx) => {
          if (avg[col] !== null) {
            bedSetStat.push({
              label: bed_schema[col].description,
              data: [avg[col].toFixed(3), sd[col].toFixed(3)]
            })
          } else {
            bedSetStat.push({
              label: bed_schema[col].description,
              data: []
            });
          }
        });

        setBedSetStat(bedSetStat)

        let avgRegionD = {}
        bedset_distribution_cols.forEach((col, idx) => {
          let key = col + "_percentage"
          avgRegionD[col] = [avg[key].toFixed(3), sd[key].toFixed(3)]
        });

        setAvgRegionD(avgRegionD)

        let bedSetFig = []
        Object.entries(bedset_schema).forEach(([key, value], index) => {
          if (typeof value.object_type !== "undefined" && value.object_type === "image") {
            bedSetFig.push({
              id: key,
              src_pdf:
                `${bedhost_api_url}/objects/bedset.${router.params.bedset_md5sum}.${key}/access/http/bytes`,
              src_png:
                `${bedhost_api_url}/objects/bedset.${router.params.bedset_md5sum}.${key}/access/http/thumbnail`,
              // `/fignotavl_png.svg`
            })
          }
        });

        setBedSetFig(bedSetFig);

        const res_bed = await api
          .get(`/bedset/${router.params.bedset_md5sum}/bedfiles?metadata=true`)
          .then(({ data }) => data.bedfile_metadata);

        setBedsCount(res_bed.length)
        setBedSetTableData(res_bed)
      }
    };

    fetchData();
  }, [router.params.bedset_md5sum, code]);

  return (
    <React.StrictMode>
      {code === 404 ? (
        <NoRecord
          type="bedset"
          md5sum={router.params.bedset_md5sum}
        />
      ) : (
        <div className="conten-body">
          <Container
            style={{ width: "75%", minWidth: "900px" }}
            fluid
            className="p-4"
          >
            <Row className="justify-content-between">
              <Col md="10">
                <h3>
                  BED Set: {bedSetName}
                  <a href={
                    `${bedhost_api_url}/bedset/${router.params.bedset_md5sum}/metadata`
                  }>
                    <FaExternalLinkAlt
                      style={{
                        marginBottom: "3px",
                        marginLeft: "10px",
                        fontSize: "15px",
                      }}
                      color="teal"
                    />
                  </a>
                </h3>
                <span> ID: {router.params.bedset_md5sum} </span>
              </Col>
              <Col md="auto">
                <a href={hubFilePath}>
                  <button
                    className="float-right btn btn-primary"
                    style={{
                      backgroundColor: "teal",
                      borderColor: "teal"
                    }}
                  >
                    Genome Browser
                  </button>
                </a>
              </Col>
            </Row>
          </Container>
          <Container
            style={{ width: "75%", minWidth: "900px" }}
            fluid
            className="p-4"
          >
            <Row>
              <Col sm={5} md={5}>
                <Card style={{ marginBottom: '10px' }}>
                  <Card.Header>
                    Summary
                  </Card.Header>
                  <Card.Body
                    style={{
                      padding: "10px",
                      minHeight: "125px"
                    }}
                  >
                    <Col>
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <label
                          style={{
                            fontWeight: "bold",
                            width: '208px',
                            display: "block",
                            textAlign: "right"
                          }}
                        >
                          Total BED:
                        </label>
                        <div style={{
                          marginLeft: "10px"
                        }}>
                          {bedsCount}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <label
                          style={{
                            fontWeight: "bold",
                            width: '208px',
                            display: "block",
                            textAlign: "right"
                          }}
                        >
                          Genome:
                        </label>
                        <div style={{
                          marginLeft: "10px"
                        }}>
                          {genome.alias}
                          {genome.digest !== "" ? (
                            <a
                              href={
                                `http://refgenomes.databio.org/v3/genomes/splash/${genome.digest}`
                              }
                              className="home-link"
                              style={{
                                marginLeft: "15px",
                                fontWeight: "bold",
                              }}
                            >
                              [Refgenie]
                            </a>
                          ) : null
                          }
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <label
                          style={{
                            fontWeight: "bold",
                            width: '208px',
                            display: "block",
                            textAlign: "right"
                          }}
                        >
                          Created time:
                        </label>
                        <div style={{
                          marginLeft: "10px"
                        }}>
                          {creatTime}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <label
                          style={{
                            fontWeight: "bold",
                            width: '208px',
                            display: "block",
                            textAlign: "right"
                          }}
                        >
                          Last modified:
                        </label>
                        <div style={{
                          marginLeft: "10px"
                        }}>
                          {modifiedTime}
                        </div>
                      </div>
                    </Col>
                  </Card.Body>
                </Card>
                <Card style={{ marginBottom: '10px' }}>
                  <Card.Header>
                    Statistics (mean|sd)
                    <Link to="/about#bedset-stats">
                      <BsQuestionCircle
                        style={{
                          marginBottom: "3px",
                          marginLeft: "10px",
                          fontSize: "15px",
                        }}
                        color="black"
                      />
                    </Link>
                  </Card.Header>
                  <Card.Body
                    style={{
                      padding: "10px",
                      minHeight: "125px"
                    }}
                  >
                    <Col component={'span'}>
                      {bedSetStat.map((value, index) => {
                        return value.data.length !== 0 ? (
                          <div key={index} style={{ display: 'flex', flexDirection: 'row' }}>
                            <label
                              style={{
                                fontWeight: "bold",
                                width: '208px',
                                display: "block",
                                textAlign: "right"
                              }}
                            >
                              {value.label ===
                                "Median absolute distance from transcription start sites" ? (
                                <>Median TSS distance: </>
                              ) : (
                                <>{value.label}: </>
                              )}

                            </label>
                            <div style={{
                              marginLeft: "10px"
                            }}>
                              {value.data[0]} {"|"} {value.data[1]}
                            </div>
                          </div>) : null
                      })}
                    </Col>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={7} md={7}>
                <Card style={{ height: '345px' }}>
                  <Card.Header>
                    BED Set Plots
                  </Card.Header>
                  <Card.Body
                    style={{
                      padding: "10px",
                    }}
                  >
                    <Col component={'span'}>
                      <Row>
                        <Col>
                          {Object.keys(avgRegionD).length !== 0 ? (
                            <BarChart stats={avgRegionD} />
                          ) : null}
                        </Col>
                        <Col>
                          {bedSetFig ? (
                            <BedSetPlots bedset_figs={bedSetFig} />
                          ) : null}
                        </Col>
                      </Row>
                    </Col>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
          <Container
            style={{ width: "75%", minWidth: "900px" }}
            fluid
            className="p-4"
          >
            <h4 style={{ marginBottom: "10px" }}>
              BED File Comparison
            </h4>
            <div style={{ marginLeft: "15px" }}>
              <span className={"new-line"}>
                The table below shows the statistics of each BED file in this
                BED set. {"\n"}
                The statistics of the regional distributions are shown in
                frequency by default. You can click on the
                toggle button to switch between statistics showing in frequency
                and percentage. {"\n"}
                You can compare the GenomicDistribution plots of multiple BED
                files by: {"\n"}
                <p style={{ marginLeft: "40px" }}>
                  1) select the BED files you want to compare using the select box
                  in the left-most column, and {"\n"}
                  2) select one plot type you want to compare using the dropdown button
                  on the top right corner of the table. {"\n"}
                </p>
              </span>
            </div>
            {Object.keys(bedSetTableData).length > 0 ? (
              <BedSetTable
                bedset_md5sum={router.params.bedset_md5sum}
                bedSetTableData={bedSetTableData}
                schema={bedSchema}
              />) : null}
          </Container>
        </div>
      )}
    </React.StrictMode>
  );
};

export default withRouter(BedSetSplash);



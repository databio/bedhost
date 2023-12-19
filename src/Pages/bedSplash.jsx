import React, { useEffect, useState } from "react";
import { withRouter } from '../Components/withRouter';
import { Container, Row, Col, Card } from "react-bootstrap";
import { ImgGrid, BedInfo, NoRecord } from "../Components"
import { FaExternalLinkAlt } from "react-icons/fa"
import bedhost_api_url from "../const/server";
import axios from "axios";
import "../style/splash.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});

const moveToTheEnd = (arr) => {
  arr.map((elem, index) => {
    if (elem.label.includes("percentage")) {
      arr.splice(index, 1);
      arr.push(elem);
    }
  })
  return arr;
}

const BedSplash = ({ router }) => {
  const [bedName, setBedName] = useState("");
  const [bedFig, setBedFig] = useState([]);
  const [bedFiles, setBedFiles] = useState([]);
  const [bedDownload, setBedDownload] = useState({});
  const [trackPath, setTrackPath] = useState("");
  const [bigbed, setBigBed] = useState(false);
  const [bedMeta, setBedMeta] = useState({});
  const [bedGenome, setBedGenome] = useState({});
  const [bedSchema, setBedSchema] = useState({});
  const [bedStats, setBedStats] = useState([]);
  const [bedStatsCols, setBedStatsCols] = useState("");
  const [code, setCode] = useState(-1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const schema = await api.get("/bed/schema").then(({ data }) => data["properties"]["samples"]["properties"]);
        setBedSchema(schema);

        const res = await api.get(`/bed/${router.params.bed_md5sum}/metadata`);
        setCode(200);

        if (code === 200) {
          const { data } = res;

          if (data.bigbedfile !== null) {
            setBigBed(true);
          }

          const bedStats = [
            { label: schema["regions_no"].description, data: data["regions_no"] }
          ];

          Object.entries(data).forEach(([key, value]) => {
            if (typeof schema[key] !== "undefined" && schema[key].type === "number") {
              bedStats.push({ label: schema[key].description, data: data[key] });
            }
          });

          setBedStats(moveToTheEnd(bedStats));

          const newBedFig = [];
          Object.entries(schema).forEach(([key, value]) => {
            if (typeof value.object_type !== "undefined" && value.object_type === "image") {
              newBedFig.push({
                id: key,
                title: value.description,
                src_pdf: `${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.${key}/access/http/bytes`,
                src_png: `${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.${key}/access/http/thumbnail`
                // src_png: `/fignotavl_png.svg`
              });
            }
          });

          const newBedFiles = {};
          Object.entries(schema).forEach(([key, value]) => {
            if (typeof value.object_type !== "undefined" && value.object_type === "file") {
              if (data[key]) {
                newBedFiles[key] = data[key].size;
              }
            }
          });

          const bedMeta = {
            created_time: data.pipestat_created_time.replace(/(.*?:.*?):.*/, '$1'),
            last_modified: data.pipestat_modified_time.replace(/(.*?:.*?):.*/, '$1')
          };

          setBedMeta({ ...data.other, ...bedMeta });

          setBedName(data.name);
          setBedGenome(data.genome);
          setBedStats(bedStats);
          setBedFig(newBedFig);
          setBedFiles(newBedFiles);

          setTrackPath(
            `http://genome.ucsc.edu/cgi-bin/hgTracks?db=${data.genome}&mappability=full&hgct_customText=${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.bigbedfile/access/http`
          );

          const bedDownload = {};

          if (bigbed) {
            const bedUrl = await api.get(`${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.bedfile/access/http`).then(({ data }) => data);
            const bigBedUrl = await api.get(`${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.bigbedfile/access/http`).then(({ data }) => data);

            bedDownload.BED_File = {
              id: "bedfile",
              label: "BED file",
              url: bedUrl,
              http: `${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.bedfile/access/http`,
              s3: `${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.bedfile/access/s3`
            };

            bedDownload.bigBED_File = {
              id: "bigbedfile",
              label: "bigBed file",
              url: bigBedUrl,
              http: `${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.bigbedfile/access/http`,
              s3: `${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.bigbedfile/access/s3`
            };
          } else {
            const bedUrl = await api.get(`${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.bedfile/access/http`).then(({ data }) => data);

            bedDownload.BED_File = {
              id: "bedfile",
              label: "BED file",
              url: bedUrl,
              http: `${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.bedfile/access/http`,
              s3: `${bedhost_api_url}/objects/bed.${router.params.bed_md5sum}.bedfile/access/s3`
            };
          }

          setBedDownload(bedDownload);
        }
      } catch (error) {
        setCode(error.response ? error.response.status : -1);
      }
    };

    fetchData();
  }, [router.params.bed_md5sum, bigbed, code]);

  useEffect(() => {
    if (router.params.bed_md5sum !== router.params.bed_md5sum) {
      window.location.reload(true);
    }
  }, [router.params.bed_md5sum]);

  return (
    <React.StrictMode>
      {code === 422 ? (
        <NoRecord type="bed" md5sum={router.params.bed_md5sum} />
      ) : (
        <div className="conten-body">
          <Container style={{ width: "75%", minWidth: "900px" }} fluid className="p-4">
            <Row className="justify-content-between">
              <Col md={10}>
                <h3>
                  BED File: {bedName}
                  <a href={`${bedhost_api_url}/bed/${router.params.bed_md5sum}/metadata`}>
                    <FaExternalLinkAlt
                      style={{ marginBottom: "3px", marginLeft: "10px", fontSize: "15px" }}
                      color="teal"
                    />
                  </a>
                </h3>
                <span> ID: {router.params.bed_md5sum} </span>
              </Col>
              <Col md="auto">
                {bigbed ? (
                  <a href={trackPath}>
                    <button
                      className="float-right btn btn-primary"
                      style={{ backgroundColor: "teal", borderColor: "teal" }}
                    >
                      Genome Browser
                    </button>
                  </a>
                ) : null}
              </Col>
            </Row>
          </Container>
          <Container style={{ width: "75%", minWidth: "900px" }} fluid className="p-4">
            <Row>
              <Col sm={5} md={5}>
                {Object.keys(bedStats).length > 0 ? (
                  <BedInfo
                    bed_md5sum={router.params.bed_md5sum}
                    bed_genome={bedGenome}
                    bed_info={bedMeta}
                    bed_stats={bedStats}
                    bedStats_cols={bedStatsCols}
                  />
                ) : null}
                <Card>
                  <Card.Header>Downloads</Card.Header>
                  <Card.Body>
                    <Col>
                      {Object.entries(bedDownload).map(([key, value], index) => (
                        <p style={{ marginBottom: "5px" }} key={index}>
                          <a
                            href={value.url}
                            className="home-link"
                            style={{ marginLeft: "15px", fontWeight: "bold" }}
                          >
                            http
                          </a>{" "}
                          |{" "}
                          <a href={value.s3} className="home-link" style={{ fontWeight: "bold" }}>
                            s3
                          </a>
                          : {value.label} ({bedFiles[value.id]})
                        </p>
                      ))}
                    </Col>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={7} md={7}>
                <Card style={{ minHeight: '735px' }}>
                  <Card.Header>GenomicDistribution Plots</Card.Header>
                  <Card.Body>
                    <Col>
                      {bedFig ? <ImgGrid style={{ marginLeft: "15px" }} imgList={bedFig} page="bed" /> : null}
                    </Col>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      )}
    </React.StrictMode>
  );
};

export default withRouter(BedSplash);
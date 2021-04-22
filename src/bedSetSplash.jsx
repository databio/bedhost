import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import BedSetTable from "./bedSetTable";
import BedSetPlots from "./bedSetPlots";
import BarChart from "./barChart";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import axios from "axios";
import bedhost_api_url from "./const";
import { Label } from 'semantic-ui-react';
import { HashLink as Link } from 'react-router-hash-link';
import { FaQuestionCircle } from "react-icons/fa";
import "./style/splash.css";


const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedSetSplash extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedSetName: "",
      bedsCount: "",
      genome: "",
      bedSetStat: [],
      avgRegionD: {},
      bedSetDownload: [],
      bedSetFig: false,
      hubFilePath: "",
      description: ""
    };
  }

  async componentDidMount() {
    let data = await api.get("/api/bedset/" + this.props.match.params.bedset_md5sum + "/data").then(({ data }) => data);
    console.log("BED set data retrieved from the server: ", data);
    let bed_schema = await api.get("/api/bed/all/schema").then(({ data }) => data);
    let bedset_schema = await api.get("/api/bedset/all/schema").then(({ data }) => data);
    this.setState(
      {
        bedSetName: data.data[0][2],
        hubFilePath: 'http://genome.ucsc.edu/cgi-bin/hgTracks?db=' + data.data[0][13] + '&hubUrl=http://data.bedbase.org/outputs/bedbuncher_output/' + this.props.match.params.bedset_md5sum + "/bedsetHub/hub.txt",
        bedSetStat: [
          { label: bed_schema['gc_content'].description, data: [data.data[0][9].gc_content.toFixed(3), data.data[0][10].gc_content.toFixed(3)] },
          { label: bed_schema['mean_absolute_tss_dist'].description, data: [data.data[0][9].mean_absolute_tss_dist.toFixed(3), data.data[0][10].mean_absolute_tss_dist.toFixed(3)] },
          { label: bed_schema['mean_region_width'].description, data: [data.data[0][9].mean_region_width.toFixed(3), data.data[0][10].mean_region_width.toFixed(3)] }
        ],
        genome: data.data[0][13],
        avgRegionD: {
          exon: [data.data[0][9].exon_percentage.toFixed(3), data.data[0][10].exon_percentage.toFixed(3)],
          fiveutr: [data.data[0][9].fiveutr_percentage.toFixed(3), data.data[0][10].fiveutr_percentage.toFixed(3)],
          intergenic: [data.data[0][9].intergenic_percentage.toFixed(3), data.data[0][10].intergenic_percentage.toFixed(3)],
          intron: [data.data[0][9].intron_percentage.toFixed(3), data.data[0][10].intron_percentage.toFixed(3)],
          threeutr: [data.data[0][9].threeutr_percentage.toFixed(3), data.data[0][10].threeutr_percentage.toFixed(3)]
        }
      }
    );

    let newbedSetFile = data.data[0].map((file, index) => {
      return (
        (index >= 4 && index <= 8) ? {
          ...file,
          id: data.columns[index],
          label: bedset_schema[data.columns[index]].label.replaceAll("_", " "),
          url: bedhost_api_url + "/api/bedset/" + this.props.match.params.bedset_md5sum + "/file/" + bedset_schema[data.columns[index]].label
        } : null
      )
    });

    newbedSetFile = newbedSetFile.slice(4, 9)
    this.setState({ bedSetDownload: newbedSetFile });
    
    let newbedSetFig = data.data[0].map((img, index) => {
      return (
        (index >= 11 && index <= data.columns.length - 2) ? {
          ...img,
          id: data.columns[index],
          src_pdf: bedhost_api_url + "/api/bedset/" + this.props.match.params.bedset_md5sum + "/img/" + bedset_schema[data.columns[index]].label + "?format=pdf",
          src_png: bedhost_api_url + "/api/bedset/" + this.props.match.params.bedset_md5sum + "/img/" + bedset_schema[data.columns[index]].label + "?format=png"
        } : null
      )
    });
    newbedSetFig = newbedSetFig.slice(11, data.columns.length)
    this.setState({ bedSetFig: newbedSetFig });

    data = await api.get("/api/bedset/" + this.props.match.params.bedset_md5sum + "/bedfiles").then(({ data }) => data);
    this.setState(
      {
        bedsCount: Object.keys(data.data).length,
      })
  }

  render() {
    return (
      <React.StrictMode >
        <Header />
        <div className="conten-body">
          <Container style={{ width: "75%", minWidth: '900px' }} fluid className="p-4">
            <Row>
              <Col md="10">
                <h1>BED Set: {this.state.bedSetName}</h1>
              </Col>
              <Col>
                <a href={this.state.hubFilePath}>
                  <button className='float-right btn primary-btn' >Genome Browser</button>
                </a>
              </Col>
            </Row>
          </Container>
          <Container style={{ width: "75%", minWidth: '900px' }} fluid className="p-4">
            <Row>
              <Col sm={5} md={5}>
                <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  BED Set Info
                </Label>
                <table >
                  <tbody>
                    <tr style={{ verticalAlign: "top" }} >
                      <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold", color: "teal" }}>
                        md5sum
                            </td>
                      <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                        {this.props.match.params.bedset_md5sum}
                      </td>
                    </tr>
                    <tr style={{ verticalAlign: "top" }} >
                      <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold", color: "teal" }}>
                        genome
                            </td>
                      <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                        <><span>{this.state.genome}</span><a href={"http://refgenomes.databio.org/#" + this.state.genome} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>[Refgenie]</a></>
                      </td>
                    </tr>
                    <tr style={{ verticalAlign: "top" }} >
                      <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold", color: "teal" }}>
                        total BED
                            </td>
                      <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                        {this.state.bedsCount}
                      </td>
                    </tr>
                  </tbody>
                </ table>

                <Label style={{ marginTop: "15px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  BED Set Stats <Link to='/about#bedset-stats'> <FaQuestionCircle style={{ marginBottom: "3px", marginLeft: '10px', fontSize: '12px' }} color='white' /></Link>
                </Label>
                <table >
                  <tbody>
                    <tr>
                      <th> </th>
                      <th style={{ padding: "3px 15px", fontSize: "10pt" }}>AVG</th>
                      <th style={{ padding: "3px 15px", fontSize: "10pt" }}>SD</th>
                    </tr>
                    {this.state.bedSetStat.map((value, index) =>
                      <tr style={{ verticalAlign: "top" }} key={index}>
                        <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold", color: "teal" }}>
                          {value.label === "Mean absolute distance from transcription start sites" ?
                            (<>Mean absolute distance from TSS</>) :
                            (<>{value.label}</>)}
                        </td>
                        <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                          {value.data[0]}
                        </td>
                        <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                          {value.data[1]}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <Label style={{ marginTop: "15px", marginBottom: "5px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  BED Set Downloads
                </Label>
                {this.state.bedSetDownload.map((file, index) => {
                  return (
                    <p style={{ marginBottom: "5px" }} key={file.id}>
                      <a href={file.url} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                        {file.label}
                      </a>
                    </p>
                  );
                })}

                <Label style={{ marginTop: "15px", marginBottom: "5px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  API Endpoint Examples
                </Label>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bedset/' + this.props.match.params.bedset_md5sum + '/data'} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    All data
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bedset/' + this.props.match.params.bedset_md5sum + '/bedfiles'} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED files data
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bedset/' + this.props.match.params.bedset_md5sum + '/data?ids=bedset_means&ids=bedset_standard_deviation'}
                    className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED set stats
                  </a>
                </p>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bedset/' + this.props.match.params.bedset_md5sum + '/data?ids=region_commonality'} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED set plot
                  </a>
                </p>
              </Col>
              <Col sm={7} md={7}>
                <Row>
                  <Col>
                    <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                      BED Set Plots
                  </Label>
                    {this.state.bedSetFig ? (<BedSetPlots bedset_figs={this.state.bedSetFig} />) : null}
                  </Col>
                  <Col>
                    {Object.keys(this.state.avgRegionD).length !== 0 ? (<BarChart stats={this.state.avgRegionD} />) : null}
                  </Col>
                </Row>
              </Col>

            </Row>
          </Container>
          <Container style={{ width: "75%", minWidth: '900px' }} fluid className="p-4">
            <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
              BED File Comparison
            </Label>
            <div style={{ marginLeft: '15px' }}>
              <span className={'new-line'} >
                {"\n"}
              The table below shows the statistics of each BED file in this BED set. {"\n"}
              The statistics of the reginal distributions are shown in frequency by default. {" "}
              You can click on the <b> SHOW PERCENTAGE</b> button to show reginal distributions in percentage. {"\n"}
              You can compare the GenomicDistribution plots of multiple BED files by: {"\n"}
              1) select the BED files you want to compare using the select box in the left-most column, and {"\n"}
              2) select one plot type you want to compare using the buttons below the table. {"\n"}
              </span>
            </div>
            <BedSetTable bedset_md5sum={this.props.match.params.bedset_md5sum} />
          </Container>
        </div>
        <VersionsSpan />
      </React.StrictMode>
    )
  }
}
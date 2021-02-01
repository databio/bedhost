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
import SimplePopover from "./popover"
import bedhost_api_url from "./const";
import { Label } from 'semantic-ui-react';
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
      bedSetStat: {},
      // avgGC: [],
      // avgRegionW: [],
      avgRegionD: {},
      bedSetDownload: {},
      bedSetFig: false,
      hubFilePath: "",
      description: ""
    };
  }

  async componentDidMount() {
    let data = await api.get("/api/bedset/" + this.props.match.params.bedset_md5sum + "/data").then(({ data }) => data);
    console.log("BED set data retrieved from the server: ", data);
    this.setState(
      {
        bedSetName: data.data[0][2],
        hubFilePath: 'http://genome.ucsc.edu/cgi-bin/hgTracks?db=' + data.data[0][13] + '&hubUrl=http://data.bedbase.org/outputs/bedbuncher_output/' + this.props.match.params.bedset_md5sum + "/bedsetHub/hub.txt",
        bedSetDownload: {
          BED_Set_Rxiv: bedhost_api_url + "/api/bedset/" + this.props.match.params.bedset_md5sum + "/file/bedset_tar",
          BED_Stats: bedhost_api_url + "/api/bedset/" + this.props.match.params.bedset_md5sum + "/file/beds_stats",
          BED_Set_Summary: bedhost_api_url + "/api/bedset/" + this.props.match.params.bedset_md5sum + "/file/summary_stats",
          BED_Set_IGD: bedhost_api_url + "/api/bedset/" + this.props.match.params.bedset_md5sum + "/file/iGD_database",
          BED_Set_PEP: bedhost_api_url + "/api/bedset/" + this.props.match.params.bedset_md5sum + "/file/PEP"
        },
        bedSetStat: {
          "gc_content": [data.data[0][9].gc_content.toFixed(3), data.data[0][10].gc_content.toFixed(3)],
          "mean_absolute_tss_dist": [data.data[0][9].mean_absolute_tss_dist.toFixed(3), data.data[0][10].mean_absolute_tss_dist.toFixed(3)],
          "mean_region_width": [data.data[0][9].mean_region_width.toFixed(3), data.data[0][10].mean_region_width.toFixed(3)]
        },
        genome: data.data[0][13],
        // avgGC: [data.data[0][9].gc_content.toFixed(3), data.data[0][10].gc_content.toFixed(3)],
        // avgRegionW: [data.data[0][9].mean_region_width.toFixed(3), data.data[0][10].mean_region_width.toFixed(3)],
        avgRegionD: {
          exon: [data.data[0][9].exon_percentage.toFixed(3), data.data[0][10].exon_percentage.toFixed(3)],
          fiveutr: [data.data[0][9].fiveutr_percentage.toFixed(3), data.data[0][10].fiveutr_percentage.toFixed(3)],
          intergenic: [data.data[0][9].intergenic_percentage.toFixed(3), data.data[0][10].intergenic_percentage.toFixed(3)],
          intron: [data.data[0][9].intron_percentage.toFixed(3), data.data[0][10].intron_percentage.toFixed(3)],
          threeutr: [data.data[0][9].threeutr_percentage.toFixed(3), data.data[0][10].threeutr_percentage.toFixed(3)]
        }
      }
    );

    let newbedSetFig = data.data[0].map((img, index) => {
      return (
        (index >= 11 && index <= data.columns.length - 2) ? {
          ...img,
          id: data.columns[index],
          src_pdf: bedhost_api_url + "/api/bedset/" + this.props.match.params.bedset_md5sum + "/img/" + data.columns[index] + "?format=pdf",
          src_png: bedhost_api_url + "/api/bedset/" + this.props.match.params.bedset_md5sum + "/img/" + data.columns[index] + "?format=png"
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

  handleGetDescription() {
    this.setState({
      description: 'gc_content: The average GC content of the BED set. \n \n mean_region_width: The average region width of the BED set. \n \n mean_absolute_tss_dist: The average absolute distance to the Transcription Start Sites (TSS) of the BED set.\n \n '
    });
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
                  BED Set Stats <SimplePopover onClick={this.handleGetDescription.bind(this)} message={this.state.description} />
                </Label>
                <table >
                  <tbody>
                    <tr>
                      <th> </th>
                      <th style={{ padding: "3px 15px", fontSize: "10pt" }}>AVG</th>
                      <th style={{ padding: "3px 15px", fontSize: "10pt" }}>SD</th>
                    </tr>
                    {Object.entries(this.state.bedSetStat)
                      .map(([key, value], index) =>
                        <tr style={{ verticalAlign: "top" }} key={index}>
                          <td style={{ padding: "3px 15px", fontSize: "10pt", fontWeight: "bold", color: "teal" }}>
                            {key.replaceAll("_percentage", " (%)")}
                          </td>
                          <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                            {value[0]}
                          </td>
                          <td style={{ padding: "3px 15px", fontSize: "10pt" }}>
                            {value[1]}
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>

                <Label style={{ marginTop: "15px", marginBottom: "5px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  BED Set Downloads
                </Label>
                {Object.entries(this.state.bedSetDownload)
                  .map(([key, value], index) =>
                    <p style={{ marginBottom: "5px" }} key={index}>
                      <a href={value} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                        {key}
                      </a>
                    </p>
                  )}

                <Label style={{ marginTop: "15px", marginBottom: "5px", marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
                  BED Set API Endpoints
                </Label>
                <p style={{ marginBottom: "5px" }}>
                  <a href={bedhost_api_url + '/api/bedset/' + this.props.match.params.bedset_md5sum + '/data'} className="home-link" style={{ marginLeft: '15px', fontSize: "10pt", fontWeight: "bold" }}>
                    BED set data
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
            <div style={{marginLeft:'15px'}}>
            <span className={'new-line'} >
            {"\n"}
              The table below shows the statistics of each BED file in this BED set. {"\n"}
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
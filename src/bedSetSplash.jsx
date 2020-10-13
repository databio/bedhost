import React from "react";
import Header from './header';
import VersionsSpan from "./versionsSpan";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import axios from "axios";
import bedhost_api_url from "./const";
import path from "path"
import "./bedSetSplash.css"

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedSetSplash extends React.Component {
  _isMounted = false;
  constructor() {
    super();
    this.state = {
      bedSetName: "",
      bedSetData:[],
      bedSetFig:[]
    };
  }

  async componentDidMount(){
    let data = await api.get("/bedset/splash/"+this.props.match.params.bedset_md5sum).then(({ data }) => data);
    this.setState({ bedSetName: data[0][2], bedSetFig: data[0][8][0], bedSetData: data }); 
    console.log("BED set data retrieved from the server: ", this.state.bedSetData, this.state.bedSetFig.name);
  }

  render() {
    return(
      <div>
        <Header />
        <Container fluid className="p-4">
          <Row>
            <Col>
              <h1>Bedset: {this.state.bedSetName}</h1>
            </Col>
          </Row>
        </Container>
        <Container fluid className="p-4">
          <Row>
            <Col>
              <h2> Data Table Component</h2>
              <h3>Fig Comparison Component</h3>
            </Col>
            <Col sm="4">
              <h2>{this.state.bedSetFig.caption}</h2>
              
              <a href={path.join("/outputs/bedbuncher_output",this.props.match.params.bedset_md5sum,this.state.bedSetName+"_"+this.state.bedSetFig.name+".pdf")}>
              <img
                      className = "img-size"
                      src={path.join("/outputs/bedbuncher_output",this.props.match.params.bedset_md5sum,this.state.bedSetName+"_"+this.state.bedSetFig.name+".png")}
                      alt={this.state.bedSetFig.name}
                    />
              </a>
                   
              <h2>Bedset stats summary</h2>
              <h2>Download list</h2>
            </Col>
          </Row>
        </Container>
        <VersionsSpan />
      </div>
    )
  }
}
import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ListGroup from "react-bootstrap/ListGroup";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import "bootstrap/dist/css/bootstrap.min.css";
import BedFileList from "./bedFileList";
import bedhost_api_url from "./const";

import { FaDatabase } from "react-icons/fa";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedSetList extends React.Component {
  constructor() {
    super();
    this.state = {
      bedSetNames: [],
      selectedId: -1,
      bedFileNames: [],
      iconColor: '#45B39D'
    };
  }

  async componentDidMount(){
    let data = await api.get("bedset/list/name").then(({ data }) => data);
    console.log("BED set names retrieved from the server: ", data);
    this.setState({ bedSetNames: data });
  }
  
  getBedFileNames = async (id) => {
    let data = await api
      .get("/bed/bedset/" + id + "?column=name")
      .then(({ data }) => data)
      .catch(function (error) {
        alert(error + "; is bedhost running at " + bedhost_api_url + "?");
      });
    console.log(
      "BED files names retrieved from the server for 0 BED set: ",
      data
    );
    this.setState({ bedFileNames: data });
  };

  handleClick = (id) => {
    this.setState({ selectedId: id, iconColor: '#ffffff' });
    this.getBedFileNames(id);
  };

  render() {
    return (
      <div style={{marginTop: '10px'}}>
        <Card>
          <Card.Header>
            <b>List of BED sets</b>
          </Card.Header>
          <ListGroup variant="flush">
            {this.state.bedSetNames.map((bedSet) => {
              return bedSet[0] === this.state.selectedId ? (
                <ListGroup.Item
                  onClick={() => this.handleClick(bedSet[0])}
                  action
                  active
                  key={bedSet[0]}
                >
                  {bedSet[0]}: {bedSet[1]}
                  <Link to={{
                    pathname: '/bedsetsplash/' + bedSet[1]
                  }}>
                    <FaDatabase className="float-right" color={this.state.iconColor} />
                  </Link>
                </ListGroup.Item>
              ) : (
                  <ListGroup.Item
                    onClick={() => this.handleClick(bedSet[0])}
                    action
                    key={bedSet[0]}
                  >
                    {bedSet[0]}: {bedSet[1]}
                    <Link to={{
                      pathname: '/bedsetsplash/' + bedSet[1]
                    }}>
                      <FaDatabase className="float-right" color='teal' />
                    </Link>
                  </ListGroup.Item>
                );
            })}
          </ListGroup>
        </Card>
        <div>
          {this.state.selectedId > -1 ? (
            <BedFileList
              bedSetId={this.state.bedSetNames[this.state.selectedId - 1][1]}
              bedFileList={this.state.bedFileNames}
            />
          ) : (
              <Alert md={4} variant="secondary">
                <i>Select BED set to display BED files for</i>
              </Alert>
            )}
        </div>
      </div>
    );
  }
}

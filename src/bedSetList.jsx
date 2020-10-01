import React from "react";
import axios from "axios";
import ListGroup from "react-bootstrap/ListGroup";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import "bootstrap/dist/css/bootstrap.min.css";
import BedFileList from "./bedFileList";
import bedhost_api_url from "./const";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class BedSetList extends React.Component {
  state = {
    bedSetNames: [],
    selectedId: -1,
    bedFileNames: [],
  };

  constructor() {
    super();
    this.getBedSetNames();
  }

  getBedSetNames = async () => {
    let data = await api.get("bedset/list/name").then(({ data }) => data);
    console.log("BED set names retrieved from the server: ", data);
    this.setState({ bedSetNames: data });
  };

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
    this.setState({ selectedId: id });
    this.getBedFileNames(id);
  };

  render() {
    return (
      <div>
        <Card style={{ width: "30em" }}>
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
                </ListGroup.Item>
              ) : (
                <ListGroup.Item
                  onClick={() => this.handleClick(bedSet[0])}
                  action
                  key={bedSet[0]}
                >
                  {bedSet[0]}: {bedSet[1]}
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
            <Alert style={{ width: "30em" }} variant="secondary">
              <i>Select BED set to display BED files for</i>
            </Alert>
          )}
        </div>
      </div>
    );
  }
}

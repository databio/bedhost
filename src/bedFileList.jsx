import React from "react";
import ListGroup from "react-bootstrap/ListGroup";
import Card from "react-bootstrap/Card";
import "bootstrap/dist/css/bootstrap.min.css";

export default class BedFileList extends React.Component {
  renderList(id) {
    return (
      <div>
        <Card style={{ width: "30rem" }}>
          <Card.Header>
            <b>
              List of BED files in <code>{id}</code>
            </b>
          </Card.Header>
          <ListGroup
            variant="flush"
            style={{ "max-height": "300px", overflow: "scroll" }}
          >
            {this.props.bedFileList.map((bedFile) => {
              return (
                <ListGroup.Item as="li" key={bedFile[0]}>
                  {bedFile[0]}: {bedFile[1]}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Card>
      </div>
    );
  }

  render() {
    return this.renderList(this.props.bedSetId);
  }
}

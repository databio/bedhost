import React from "react";
import {Link} from "react-router-dom";
import ListGroup from "react-bootstrap/ListGroup";
import Card from "react-bootstrap/Card";
import "bootstrap/dist/css/bootstrap.min.css";


export default class BedFileList extends React.Component {
  renderList(id) {
    return (
      <div>
        <Card md={4}>
          <Card.Header>
            <b>
              List of BED files in <code>{id}</code>
            </b>
          </Card.Header>
          <ListGroup
            variant="flush"
            style={{height: "30em", overflow: "scroll" }}
          >
            {this.props.bedFileList.map((bedFile) => {
              return (
                <ListGroup.Item as="li" key={bedFile[0]}>
                  <Link to={{
                    pathname: '/bedfilesplash/' + bedFile[1]}}>
                    {bedFile[0]}: {bedFile[1]}
                  </Link>  
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

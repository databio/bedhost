import React from "react";
import { Link } from "react-router-dom";
import ListGroup from "react-bootstrap/ListGroup";
import Card from "react-bootstrap/Card";
import "bootstrap/dist/css/bootstrap.min.css";

export default class BedList extends React.Component {
  render() {
    return (
    <div>
      <Card md={4}>
        <Card.Header>
          <b>
            List of BED files in selected BED set
            </b>
        </Card.Header>
        <ListGroup
          variant="flush"
          style={{ height: "19em", overflow: "scroll" }}
        >
          {this.props.bedList.map((bed) => {
            return (
              <ListGroup.Item as="li" key={bed[0]}>
                <Link className="home-link" to={{
                  pathname: '/bedsplash/' + bed[1]
                }}>
                  {bed[0]}: {bed[2]}
                </Link>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Card>
    </div>
    )}
}

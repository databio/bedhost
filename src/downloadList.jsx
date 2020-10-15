import React from "react";
import ListGroup from "react-bootstrap/ListGroup";

export default class DownloadList extends React.Component {
  render() {
    return (
      <div>
        {
          Object.entries(this.props.list)
            .map(([key, value]) =>
              <a href={require(`${"." + value.match(/\/outputs\/.*/)}`)}>
                <li key={key}>{key}</li>
              </a>)
        }
      </div>

    )
  }
}

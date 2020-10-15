import React from "react";

export default class DownloadList extends React.Component {
 

  render() {
    return(
      <div>
        <>{this.props.list[0]}</>
      </div>
    )
  }
}
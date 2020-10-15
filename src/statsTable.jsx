import React from "react";
import * as d3 from 'd3';
import MaterialTable  from "material-table";
import { Paper } from "@material-ui/core";
import { tableIcons } from "./tableIcons";

export default class StatsTable extends React.Component {
  constructor(props) {
    super();
    this.state = {
      dataPath: "." + props.dataSrc,
      columns: [],
      bedStats: []
    }
  }
  componentDidMount() {
    var data = require(`${this.state.dataPath}`)
    d3.csv(data).then((data) => {
      this.setState({ columns: data.columns, bedStats: data.slice(0, data.length) });
      console.log(data);
    })
  }

  getColumns() {
    const tableColumns = [
      {
        title: this.state.columns[0],
        field: this.state.columns[0],
        
        cellStyle: {
          backgroundColor: "#333535",
          color: "#FFF",
          fontWeight: "bold",
        },
        headerStyle: {
          backgroundColor: "#333535",
          color: "#FFF",
          fontWeight: "bold",
        },
      },
      { title: this.state.columns[1], field: this.state.columns[1] },
      { title: this.state.columns[2], field: this.state.columns[2] },
    ];
    return tableColumns
  }

  render() {
    return (
      // <div>
      //   <>{this.props.dataSrc}</>
      // </div>
      <div>
        <div>
          <MaterialTable
            title=""
            columns={this.getColumns()} // <-- Set the columns on the table
            data={this.state.bedStats} // <-- Set the data on the table
            icons={tableIcons}
            options={{
              
              headerStyle: {
                backgroundColor: "#333535",
                color: "#FFF",
                fontWeight: "bold",
              },
              search: false,
              sorting: false,
              paging: false,
              toolbar: false
            }}
            
            components={{
              Container: props => <Paper {...props} elevation={0} />,
            }}
          />
        </div>
      </div>
    )
  }
}
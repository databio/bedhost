import React from "react";
import MaterialTable  from "material-table";
import { Paper } from "@material-ui/core";
import { tableIcons } from "./tableIcons";
import bedhost_api_url from "./const";
import axios from "axios";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class StatsTable extends React.Component {
  constructor(props) {
    super();
    this.state = {
      columns: [],
      bedStats: []
    }
  }

  async componentDidMount() {
    let res = await api.get("/bedsets/data/" + this.props.bedset_md5sum+"?column=bedset_gd_stats").then(({ data }) => data);
    console.log('BED set summary from API: ', res)
    
    this.setState({
      columns: res.columns,
      bedStats: res.data
    })
  }

  getColumns() {
    const tableColumns = [
      {
        title: "",
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
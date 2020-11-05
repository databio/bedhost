import React from "react";
import MaterialTable from "material-table";
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
    let res = await api.get("/bedset/data/" + this.props.bedset_md5sum + "?column=bedset_gd_stats").then(({ data }) => data);
    console.log('BED set summary from API: ', res)

    this.setState({
      columns: res.columns,
      bedStats: res.data
    })
  }

  getColumns() {
    let tableColumns = []
    for (var i = 0; i < this.state.columns.length; i++) {
      if (i === 0) {
        tableColumns.push({
          title: "",
          field: this.state.columns[i],
          minWidth: 200,
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
        })
      } else {
        tableColumns.push({ title: this.state.columns[i], field: this.state.columns[i], minWidth: 200 })
      }
    }
      return tableColumns
    }

    render() {
      return (
        <div style={{ marginBottom: "10px" }}>
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
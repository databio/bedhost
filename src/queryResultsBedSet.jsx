import React from "react";
import MaterialTable from "material-table";
import Spinner from "react-bootstrap/Spinner";
import { Paper } from "@material-ui/core";
import { tableIcons } from "./tableIcons";
import { Link } from "react-router-dom";
import ResultsBed from "./queryResultsBed";
import bedhost_api_url, { client } from "./const/server";
import axios from "axios";
import { QUERY_BEDSET, GET_BEDSET_BEDFILE_COUNT } from "./graphql/bedSetQueries";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class ResultsBedSet extends React.Component {
  constructor(props) {
    super();
    this.state = {
      query: "",
      bedSetData: [],
      columns: [],
      data: [],
      pageSize: -1,
      pageSizeOptions: [],
    };
  }

  async componentDidMount() {
    await this.getBedSetByQuery();
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.query !== this.props.query) {
      await this.getBedSetByQuery();
      this.setState({ query: this.props.query });
    }
  }

  async getBedSetByQuery() {
    // query bedset via Graphql
    const res = await client
      .query({
        query: QUERY_BEDSET,
        variables: { filters: this.props.query, first: this.props.limit },
      })
      .then(({ data }) => data.bedsets.edges);

    
    this.setState({
      bedSetData: res,
    });

    if (res.length >= 50) {
      this.setState({
        pageSize: 50,
        pageSizeOptions: [50, 100, 150],
      });
    } else {
      this.setState({
        pageSize: res.length,
        pageSizeOptions: [res.length],
      });
    }

    this.setState({ query: this.props.query });
    console.log("BED sets retrieved from the server: ", res);
    this.getColumns();
    let data = await this.getData();
    this.setState({
      data: data,
    });
  }

  async getBedCount(id) {
    const count = await client
      .query({
        query: GET_BEDSET_BEDFILE_COUNT,
        variables: { md5sum: id },
      })
      .then(({ data }) => data.bedsets.edges[0].node.bedfiles.totalCount);

      return count
  }

  getColumns() {
    let cols = ["name", "md5sum", "bed_file_count", "genome"];
    cols = cols.concat(Object.keys(JSON.parse(this.state.bedSetData[0].node.bedsetMeans)));

    let tableColumns = [];

    for (var i = 0; i < cols.length; i++) {
      if (
        cols[i] === "md5sum" ||
        cols[i].includes("_frequency") ||
        cols[i].includes("_percentage")
      ) {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          hidden: true,
        });
      } else if (cols[i] === "name") {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          render: (rowData) => (
            <Link
              className="home-link"
              to={{
                pathname: "/bedsetsplash/" + rowData.md5sum,
              }}
            >
              {rowData.name}
            </Link>
          ),
        });
      } else {
        tableColumns.push({
          title: cols[i].replaceAll("_percentage", "(%)"),
          field: cols[i],
        });
      }
    }
    this.setState({
      columns: tableColumns,
    });
  }

  async getData() {
    let data = [];
    data.push(
      this.state.bedSetData.map(async (bed, index) => {
        let count = await this.getBedCount(bed.node.md5sum);
        let row = {
          name: bed.node.name,
          md5sum: bed.node.md5sum,
          bed_file_count: count,
          genome: JSON.parse(bed.node.genome).alias,
        };

        let bs_mean = JSON.parse(bed.node.bedsetMeans)
        for (var key in  bs_mean) {
            bs_mean[key] =  bs_mean[key].toFixed(3);
        }
        row = Object.assign({}, row,  bs_mean);
        return row;
      })
    );
    return Promise.all(data[0]);
  }

  render() {
    return this.props.query === this.state.query && this.state.data ? (
      this.state.pageSize !== -1 ? (
        <div style={{ maxWidth: "100%" }}>
          <MaterialTable
            icons={tableIcons}
            columns={this.state.columns}
            data={this.state.data}
            title=""
            options={{
              headerStyle: {
                backgroundColor: "#264653",
                color: "#FFF",
                fontWeight: "bold",
              },
              paging: true,
              pageSize: this.state.pageSize,
              pageSizeOptions: this.state.pageSizeOptions,
              search: false,
            }}
            detailPanel={[
              {
                tooltip: "Show bedfiles",
                render: (rowData) => {
                  return <ResultsBed md5sum={rowData.md5sum} limit={10}/>;
                },
              },
            ]}
            components={{
              Container: (props) => <Paper {...props} elevation={0} />,
            }}
            localization={{
              body: {
                emptyDataSourceMessage: (
                  <div style={{ position: "absolute", top: "5%", left: "50%" }}>
                    <Spinner
                      animation="border"
                      size="sm"
                      style={{ color: "lightgray" }}
                    />
                    <p style={{ color: "lightgray" }}>Loading data </p>
                  </div>
                ),
              },
            }}
          />
        </div>
      ) : null
    ) : null;
  }
}

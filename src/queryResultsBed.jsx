import React from "react";
import MaterialTable from "material-table";
import Spinner from "react-bootstrap/Spinner";
import { Paper } from "@material-ui/core";
import { tableIcons } from "./tableIcons";
import { Link } from "react-router-dom";
import { client } from "./const/server";
import { QUERY_BED, GET_BEDSET_BEDFILES } from "./graphql/bedQueries";


export default class ResultsBed extends React.Component {
  constructor(props) {
    super();
    this.state = {
      query: "",
      md5sum: "",
      bedData: [],
      columns: [],
      data: [],
      pageSize: -1,
      pageSizeOptions: [],
      toolBar: true,
    };
  }

  async componentDidMount() {
    if (this.props.query) {
      await this.getBedByQuery();
    } else {
      await this.getBedByBedSet();
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.query !== this.props.query) {
      await this.getBedByQuery();
      this.setState({ query: this.props.query });
    } else if (prevProps.md5sum !== this.props.md5sum) {
      await this.getBedByBedSet();
      this.setState({ md5sum: this.props.md5sum });
    }
  }

  async getBedByQuery() {
    // query bed via Graphql
    const res = await client
      .query({
        query: QUERY_BED,
        variables: { filters: this.props.query, first: this.props.limit },
      })
      .then(({ data }) => data.bedfiles.edges);

    this.setState({
      bedData: res,
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
    // console.log("BED files retrieved from the server: ", res);
    this.getColumns();
    this.getData();
  }

  async getBedByBedSet() {
    const res = await client
      .query({
        query: GET_BEDSET_BEDFILES,
        variables: { md5sum: this.props.md5sum, first: this.props.limit },
      })
      .then(({ data }) => data.bedsets.edges[0].node.bedfiles.edges);

    this.setState({
      bedData: res,
      toolBar: false,
    });

    if (res.length >= 10) {
      this.setState({
        pageSize: 10,
        pageSizeOptions: [10, 15, 20],
      });
    } else {
      this.setState({
        pageSize: res.length,
        pageSizeOptions: [res.length],
      });
    }
    this.setState({ md5sum: this.props.md5sum });
    // console.log("BED files retrieved from the server: ", res);
    this.getColumns();
    this.getData();
  }

  getColumns() {
    let tableColumns = [];
    let cols = [
      "name",
      "md5sum",
      "genome",
      "GSE",
      "data_source",
      "description",
    ];
    for (var i = 0; i < cols.length; i++) {
      if (cols[i] === "md5sum" || cols[i] === "GSE") {
        tableColumns.push({ title: cols[i], field: cols[i], hidden: true });
      } else if (cols[i] === "name") {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          cellStyle: {
            width: 500,
            maxWidth: 500,
          },
          headerStyle: {
            width: 500,
            maxWidth: 500,
          },
          render: (rowData) => (
            <Link
              className="home-link"
              to={{
                pathname: "/bedsplash/" + rowData.md5sum,
              }}
            >
              {rowData.name}
            </Link>
          ),
        });
      } else if (cols[i] === "description") {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          cellStyle: {
            width: 600,
            minWidth: 600,
          },
          headerStyle: {
            width: 600,
            minWidth: 600,
          },
        });
      } else if (cols[i] === "data_source") {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          render: (rowData) =>
            rowData.data_source === "GEO" ? (
              <a
                href={
                  "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=" +
                  rowData.GSE
                }
                className="home-link"
              >
                {rowData.data_source}
              </a>
            ) : rowData.data_source === "ENCODE" ? (
              <a
                href={"https://www.encodeproject.org/files/" + rowData.file_acc}
                className="home-link"
              >
                {rowData.data_source}
              </a>
            ) : null,
        });
      } else {
        tableColumns.push({ title: cols[i], field: cols[i] });
      }
    }
    this.setState({
      columns: tableColumns,
    });
  }

  getData() {
    let data = this.state.bedData.map((bed) => {
      let row = { name: bed.node.name, md5sum: bed.node.md5sum };
      row = Object.assign({}, row, JSON.parse(bed.node.other));
      return row;
    })

    this.setState({
      data: data,
    });
  }

  render() {
    return this.props.md5sum === this.state.md5sum ||
      this.props.query === this.state.query ? (
      this.state.pageSize !== -1 ? (
        <div>
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
              toolbar: this.state.toolBar,
            }}
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
                      style={{ marginRight: "5px", color: "lightgray" }}
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

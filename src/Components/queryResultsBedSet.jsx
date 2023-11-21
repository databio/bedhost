import React from "react";
import { Link } from "react-router-dom";
import { Row, Spinner } from 'react-bootstrap';
import MaterialTable from "@material-table/core";
import { Paper, TablePagination } from "@mui/material";
import { tableIcons } from "./tableIcons";
import ResultsBed from './queryResultsBed'
import bedhost_api_url from "../const/server";
import axios from "axios";

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
      pageSizeOptions: []
    }
  }

  async componentDidMount() {
    await this.getBedSetByQuery()
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.query !== this.props.query) {
      await this.getBedSetByQuery()
      this.setState({ query: this.props.query })
    } else if (prevProps.limit !== this.props.limit) {
      await this.getBedSetByQuery()
      this.setState({ query: this.props.query })
    }
  }

  async getBedSetByQuery() {
    var request = {
      query: this.props.query
    };

    let res = await api.post(
      `/_private_api/query/bedsets?ids=name&ids=md5sum&ids=genome&ids=bedset_means&limit=${this.props.limit}`, request
    )
      .then(({ data }) => data)
    this.setState({
      bedSetData: res
    })

    if (res.data.length >= 50) {
      this.setState({
        pageSize: 50,
        pageSizeOptions: [50, 100, 150]
      })
    } else {
      this.setState({
        pageSize: res.data.length,
        pageSizeOptions: [res.data.length]
      })
    }

    this.setState({ query: this.props.query })
    // console.log('BED sets retrieved from the server: ', res)
    this.getColumns()
    let data = await this.getData()
    this.setState({
      data: data
    })
  }

  async getBedCount(id) {
    let count = await api.get(`/bedset/${id}/bedfiles`)
      .then(({ data }) => data.data.length)
    return count
  }

  getColumns() {
    let cols = ["name", "md5sum", "bed_file_count", "genome"]
    cols = cols.concat(Object.keys(this.state.bedSetData.data[0][3]))

    let tableColumns = []

    for (var i = 0; i < cols.length; i++) {
      if ((cols[i] === 'md5sum') || (cols[i].includes("_frequency")) || (cols[i].includes("_percentage"))) {
        tableColumns.push({ title: cols[i], field: cols[i], hidden: true, width: 0 })
      } else if (cols[i] === 'name') {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          render: rowData => <Link className="home-link" to={{
            pathname: `/bedset/${rowData.md5sum}`
          }}>{rowData.name}
          </Link>
        })
      } else {
        tableColumns.push({ title: cols[i].replaceAll("_percentage", "(%)"), field: cols[i] })
      }
    }
    this.setState({
      columns: tableColumns
    })
  }

  async getData() {
    let data = []
    data.push(this.state.bedSetData.data.map(async (bed, index) => {
      let count = await this.getBedCount(bed[1])
      let row = { name: bed[0], md5sum: bed[1], bed_file_count: count, genome: bed[2].alias }
      for (var key in bed[3]) {
        bed[3][key] = bed[3][key].toFixed(3)
      }
      row = Object.assign({}, row, bed[3]);
      return row
    }))
    return Promise.all(data[0])
  }

  render() {
    return (this.props.query === this.state.query && this.state.data ? (
      this.state.pageSize !== -1 ? (
        <div style={{ marginTop: "20px" }}>
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
              toolbar: false,
              idSynonym: 'md5sum',
            }}
            detailPanel={[
              {
                tooltip: 'Show bedfiles',
                render: rowData => {
                  return (<ResultsBed bedset_md5sum={rowData.md5sum} />)
                },
              },
            ]}
            components={{
              Container: props => <Paper {...props} elevation={0} />,
              Pagination: (props) => (
                <Row className="justify-content-end">
                  <TablePagination component="div"
                    {...props}
                  />
                </Row>
              ),
            }}
            localization={{
              body: {
                emptyDataSourceMessage: < div style={{ position: "absolute", top: '5%', left: '50%' }}>
                  <Spinner animation="border" size="sm" style={{ color: 'lightgray' }} />
                  <p style={{ color: 'lightgray' }}>Loading data </p>
                </div>
              }
            }}
          />
        </div>) : null) : null
    );
  }
}
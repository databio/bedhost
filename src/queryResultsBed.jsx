import React from "react";
import MaterialTable from "material-table";
import Spinner from 'react-bootstrap/Spinner'
import { Paper } from "@material-ui/core";
import { tableIcons } from "./tableIcons";
import { Link } from "react-router-dom";
import bedhost_api_url from "./const/server";
import axios from "axios";

const api = axios.create({
  baseURL: bedhost_api_url,
});

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
      toolBar: true
    }
  }

  async componentDidMount() {
    if (this.props.query) {
      await this.getBedByQuery()
    } else {
      await this.getBedByBedSet()
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.query !== this.props.query) {
      await this.getBedByQuery()
      this.setState({ query: this.props.query })
    } else if (prevProps.bedset_md5sum !== this.props.bedset_md5sum) {
      await this.getBedByBedSet()
      this.setState({ md5sum: this.props.md5sum })
    } else if (prevProps.limit !== this.props.limit) {
      if (this.props.query) {
        await this.getBedByQuery()
        this.setState({ query: this.props.query })
      } else {
        await this.getBedByBedSet()
        this.setState({ md5sum: this.props.md5sum })
      }
    }
  }

  async getBedByQuery() {
    var request = {
      query: this.props.query
    };
    let res = await api.post(
      `/_private_api/query/bedfiles?ids=name&ids=md5sum&ids=other&limit=${this.props.limit}`, request
    )
      .then(({ data }) => data)
    console.log(res)
    this.setState({
      bedData: res.data
    })

    if (res.length >= 50) {
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
    this.getColumns()
    this.getData()
  }

  async getBedByBedSet() {
    let res = await api.get(
      `/api/bedset/${this.props.bedset_md5sum}/bedfiles?ids=name&ids=md5sum&ids=other&limit=${this.props.limit}`
    )
      .then(({ data }) => data)

    this.setState({
      bedData: res.data,
      toolBar: false
    })

    if (res.data.length >= 10) {
      this.setState({
        pageSize: 10,
        pageSizeOptions: [10, 15, 20]
      })
    } else {
      this.setState({
        pageSize: res.data.length,
        pageSizeOptions: [res.data.length]
      })
    }
    this.setState({ md5sum: this.props.md5sum })
    this.getColumns()
    this.getData()
  }

  getColumns() {
    let tableColumns = []
    let cols = ['name', 'md5sum', 'genome', 'GSE', 'data_source', 'description']
    for (var i = 0; i < cols.length; i++) {
      if (cols[i] === 'md5sum' || cols[i] === 'GSE') {
        tableColumns.push({ title: cols[i], field: cols[i], hidden: true })
      } else if (cols[i] === 'name') {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          cellStyle: {
            width: 500,
            maxWidth: 500
          },
          headerStyle: {
            width: 500,
            maxWidth: 500
          },
          render: rowData =>
            <Link className="home-link" to={{
              pathname: `/bedsplash/${rowData.md5sum}`
            }}>{rowData.name}
            </Link>
        })
      } else if (cols[i] === 'description') {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          cellStyle: {
            width: 600,
            minWidth: 600
          },
          headerStyle: {
            width: 600,
            minWidth: 600
          }
        })
      } else if (cols[i] === 'data_source') {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          render: rowData => rowData.data_source === 'GEO' ?
            (<a
              href={
                `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${rowData.GSE}`
              }
              className="home-link" >
              {rowData.data_source}
            </a>) :
            (rowData.data_source === 'ENCODE' ?
              (<a
                href={
                  `https://www.encodeproject.org/files/${rowData.file_acc}`
                }
                className="home-link" >
                {rowData.data_source}
              </a>) :
              null)
        })
      } else {
        tableColumns.push({ title: cols[i], field: cols[i] })
      }
    }
    this.setState({
      columns: tableColumns
    })
  }

  getData() {
    let data = []
    data.push(this.state.bedData.map((bed) => {
      let row = { name: bed[0], md5sum: bed[1] }
      row = Object.assign({}, row, bed[2]);
      return row
    }))
    this.setState({
      data: data[0]
    })
  }


  render() {
    return (this.props.md5sum === this.state.md5sum || this.props.query === this.state.query ? (
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
              toolbar: this.state.toolBar
            }}
            components={{
              Container: props => <Paper {...props} elevation={0} />
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
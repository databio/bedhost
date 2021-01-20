import React from "react";
import MaterialTable from "material-table";
import { Paper } from "@material-ui/core";
import { tableIcons } from "./tableIcons";
import { Link } from "react-router-dom";
import Tooltip from "@material-ui/core/Tooltip";
import bedhost_api_url from "./const";
import axios from "axios";

const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class ResultsBed extends React.Component {
    constructor(props) {
        super();
        this.state = {
            bedData: [],
            columns: [],
            data: [],
            title: ""
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
        } else if (prevProps.bedset_md5sum !== this.props.bedset_md5sum) {
            await this.getBedByBedSet()
        }
    }

    async getBedByQuery() {
        let query = this.props.query.sql.replaceAll("?", "%s");
        let query_val = this.props.query.params.map((val, index) => {
            let my_query_val = ''
            if (index === 0) {
                my_query_val = "?query_val=" + val
            } else { my_query_val = my_query_val + "&query_val=" + val }
            return my_query_val
        }).join('');

        let res = await api.get("/_private_api/query/bedfiles/" + encodeURIComponent(query) + query_val)
            .then(({ data }) => data)

        this.setState({
            bedData: res
        })
        console.log('BED files retrieved from the server: ', res)
        this.getColumns()
        this.getData()
    }

    async getBedByBedSet() {
        let res = await api.get("/api/bedset/" + this.props.bedset_md5sum + "/bedfiles")
            .then(({ data }) => data)

        this.setState({
            bedData: res.data,
            title: "There are " + res.data.length + " BED files in this BED set."
        })
        console.log('BED files retrieved from the server: ', res)
        this.getColumns()
        console.log('BED files retrieved from the server: ', this.state.columns)
        this.getData()
    }

    getColumns() {
        let tableColumns = []
        let cols = ['name', 'md5sum', 'genome', 'cell_type', 'tissue', 'antibody', 'trestment', 'exp_protocol', 'description', 'GSE', 'data_source']
        // cols = cols.concat(Object.keys(this.state.bedData[0][33]))
        for (var i = 0; i < cols.length; i++) {
            if (cols[i] === 'md5sum' || cols[i] === 'GSE') {
                tableColumns.push({ title: cols[i], field: cols[i], hidden: true })
            } else if (cols[i] === 'name') {
                tableColumns.push({
                    title: cols[i],
                    field: cols[i],
                    cellStyle: {
                        width: 150,
                        maxWidth: 150,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    },
                    headerStyle: {
                        width: 150,
                        maxWidth: 150
                    },
                    render: rowData =>
                        <Tooltip
                            key={rowData.name}
                            title={rowData.name}
                            placement="top"
                        >
                            <Link className="home-link" to={{
                                pathname: '/bedsplash/' + rowData.md5sum
                            }}>{rowData.name}
                            </Link>
                        </Tooltip>
                })
            } else if (cols[i] === 'description') {
                tableColumns.push({
                    title: cols[i],
                    field: cols[i],
                    cellStyle: {
                        width: 500,
                        minWidth: 500
                    },
                    headerStyle: {
                        width: 500,
                        minWidth: 500
                    }
                })
            } else if (cols[i] === 'data_source') {
                tableColumns.push({
                    title: cols[i],
                    field: cols[i],   
                    render: rowData => rowData.data_source === 'GEO' ? <a href={"https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=" + rowData.GSE} className="home-link" >
                        {rowData.data_source}
                    </a> : null
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
        let name_idx = 0
        let md5sum_idx = 0
        let data_idx = 0
        data.push(this.state.bedData.map((bed) => {
            if (this.props.query) {
                name_idx = 2
                md5sum_idx = 1
                data_idx = 33
            } else {
                name_idx = 0
                md5sum_idx = 1
                data_idx = 31
            }
            let row = { name: bed[name_idx], md5sum: bed[md5sum_idx] }
            row = Object.assign({}, row, bed[data_idx]);
            return row
        }))
        this.setState({
            data: data[0]
        })
    }


    render() {
        return (
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
                        pageSize: 50,
                        pageSizeOptions: [25, 50, 100],
                        search: false,
                    }}
                    // detailPanel={rowData => {
                    //     return (
                    //         <p>{rowData.description}</p>
                    //     )
                    // }}
                    components={{
                        Container: props => <Paper {...props} elevation={0} />
                    }}
                />
            </div>
        );
    }
}

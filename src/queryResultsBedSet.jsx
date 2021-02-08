import React from "react";
import MaterialTable from "material-table";
import { Paper } from "@material-ui/core";
import { tableIcons } from "./tableIcons";
import { Link } from "react-router-dom";
import ResultsBed from './queryResultsBed'
import bedhost_api_url from "./const";
import axios from "axios";

const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class ResultsBedSet extends React.Component {
    constructor(props) {
        super();
        this.state = {
            query:"",
            bedSetData: [],
            columns: [],
            data: [],
            pageSize: -1,
            pageSizeOptions: []
        }
    }

    async componentDidMount() {
        console.log("debug:", this.props.query)
        await this.getBedSetByQuery()
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.query !== this.props.query) {
            await this.getBedSetByQuery()
            this.setState({ query: this.props.query })
        }
    }

    async getBedSetByQuery() {
        let query = this.props.query.sql.replaceAll("?", "%s");
        let query_val = this.props.query.params.map((val, index) => {
            let my_query_val = ''
            if (index === 0) {
                my_query_val = "?query_val=" + val
            } else { my_query_val = my_query_val + "&query_val=" + val }
            return my_query_val
        }).join('');

        let res = await api.get("/_private_api/query/bedsets/" + encodeURIComponent(query) + query_val + "&columns=name&columns=md5sum&columns=genome&columns=bedset_means&limit=" + this.props.limit)
            .then(({ data }) => data)

        this.setState({
            bedSetData: res
        })

        if (res.length >= 50) {
            this.setState({
                pageSize: 50,
                pageSizeOptions: [50, 100, 150]
            })
        } else {
            this.setState({
                pageSize: res.length,
                pageSizeOptions: [res.length]
            })
        }

        this.setState({ query: this.props.query })
        console.log('BED sets retrieved from the server: ', res)
        this.getColumns()
        let data = await this.getData()
        this.setState({
            data: data
        })
    }

    async getBedCount(id) {
        let count = await api.get("/api/bedset/" + id + "/bedfiles")
            .then(({ data }) => data.data.length)
        return count
    }

    getColumns() {
        let cols = ["name", "md5sum", "bed_file_count", "genome"]
        cols = cols.concat(Object.keys(this.state.bedSetData[0][3]))

        let tableColumns = []

        for (var i = 0; i < cols.length; i++) {
            if ((cols[i] === 'md5sum') || (cols[i].includes("_frequency")) || (cols[i].includes("_percentage")) ){
                tableColumns.push({ title: cols[i], field: cols[i], hidden: true, width: 0 })
            } else if (cols[i] === 'name') {
                tableColumns.push({
                    title: cols[i],
                    field: cols[i],
                    render: rowData => <Link className="home-link" to={{
                        pathname: '/bedsetsplash/' + rowData.md5sum
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
        data.push(this.state.bedSetData.map(async (bed, index) => {
            let count = await this.getBedCount(bed[1])
            let row = { name: bed[0], md5sum: bed[1], bed_file_count: count , genome:bed[2]}
            for (var key in bed[3]) {
                bed[3][key] = bed[3][key].toFixed(3)
            }
            row = Object.assign({}, row, bed[3]);
            return row
        }))
        return Promise.all(data[0])
    }

    render() {
        return ( this.props.query === this.state.query && this.state.data ? (
            this.state.pageSize !== -1 ? (
            <div style={{ maxWidth: '100%' }}>
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
                            tooltip: 'Show bedfiles',
                            render: rowData => {
                                return (<ResultsBed bedset_md5sum={rowData.md5sum} />)
                            },
                        },
                    ]}
                    components={{
                        Container: props => <Paper {...props} elevation={0} />
                    }}
                />
            </div>):null):null
        );
    }
}

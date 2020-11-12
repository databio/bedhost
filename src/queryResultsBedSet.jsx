import React from "react";
import MaterialTable, { MTableToolbar } from "material-table";
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
            bedData: -1,
            columns: [],
            data: []
        }
    }

    async componentDidMount() {
        console.log("testing:", this.props.data)
        let cols = ["name", "md5sum"]
        cols = cols.concat(Object.keys(this.props.data[0][9]))

        let data = []
        data.push(this.props.data.map((bed, index) => {
            console.log(index, this.state.bedData)
            let row = { name: bed[2], md5sum: bed[1] }
            row = Object.assign({}, row, bed[9]);
            return row
        }))

        this.setState({
            columns: cols,
            data: data[0]
        })

        console.log("cols:", cols)
        console.log("data:", data)
    }

    async getBedData(id) {
        let data = await api.get("/api/bedset/" + id + "/bedfiles")
            .then(({ data }) => data)

            this.setState({
                bedData: data.data
            })
    }

    getColumns() {
        let tableColumns = []

        for (var i = 0; i < this.state.columns.length; i++) {
            if (this.state.columns[i] === 'md5sum') {
                tableColumns.push({ title: this.state.columns[i], field: this.state.columns[i], hidden: true })
            } else if (this.state.columns[i] === 'name') {
                tableColumns.push({
                    title: this.state.columns[i],
                    field: this.state.columns[i],
                    width: 500,
                    render: rowData => <Link className="home-link" to={{
                        pathname: '/bedsetsplash/' + rowData.md5sum
                    }}>{rowData.name}
                    </Link>
                })
            } else {
                tableColumns.push({ title: this.state.columns[i], field: this.state.columns[i] })
            }
        }
        return tableColumns
    }

    render() {
        console.log('bedset props: ', this.props.data)
        return (
            <div style={{ maxWidth: '100%' }}>
                <MaterialTable
                    icons={tableIcons}
                    columns={this.getColumns()}
                    data={this.state.data}
                    title=""
                    options={{
                        headerStyle: {
                            backgroundColor: "#264653",
                            color: "#FFF",
                            fontWeight: "bold",
                        },
                        paging: true,
                        search: false,
                    }}
                    detailPanel={rowData => {
                        this.getBedData(rowData.md5sum)
                        return (
                            this.state.bedData!==-1 ? (<ResultsBed data={this.state.bedData}/>) : null 
                        )
                    }}
                    components={{
                        Container: props => <Paper {...props} elevation={0} />
                    }}
                />
            </div>
        );
    }
}

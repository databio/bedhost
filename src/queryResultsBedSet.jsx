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
            bedSetData: [],
            columns: [],
            data: []
        }
    }

    async componentDidMount() {
        await this.getBedSetByQuery()
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.query !== this.props.query) {
            await this.getBedSetByQuery()
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

        console.log(this.props.query.sql)
        let res = await api.get("/_private_api/query/bedsets/" + encodeURIComponent(query) + query_val)
            .then(({ data }) => data)

        this.setState({
            bedSetData: res
        })

        this.getColumns()
        this.getData()
    }

    getColumns() {
        let cols = ["name", "md5sum"]
        cols = cols.concat(Object.keys(this.state.bedSetData[0][9]))

        let tableColumns = []

        for (var i = 0; i < cols.length; i++) {
            if ((cols[i] === 'md5sum') || (cols[i].includes("_frequency"))) {
                tableColumns.push({ title: cols[i], field: cols[i], hidden: true })
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

    getData() {
        let data = []
        data.push(this.state.bedSetData.map((bed, index) => {
            console.log(index, this.state.bedSetData)
            let row = { name: bed[2], md5sum: bed[1] }
            for (var key in bed[9]) {
                bed[9][key] = bed[9][key].toFixed(3)
              }
            row = Object.assign({}, row, bed[9]);
            return row
        }))

        this.setState({
            data: data[0]
        })
    }


    render() {
        return (
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
                        search: false,
                    }}
                    detailPanel={rowData => {
                        return (<ResultsBed bedset_md5sum={rowData.md5sum} />)
                    }}
                    components={{
                        Container: props => <Paper {...props} elevation={0} />
                    }}
                />
            </div>
        );
    }
}

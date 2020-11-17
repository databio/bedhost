import React from "react";
import MaterialTable from "material-table";
import { Paper } from "@material-ui/core";
import { tableIcons } from "./tableIcons";
import { Link } from "react-router-dom";
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
            data: []
        }
    }

    async componentDidMount() {
        if (this.props.query){
            await this.getBedByQuery()
        } else  {
            await this.getBedByBedSet()
        }
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.query !== this.props.query) {
            await this.getBedByQuery()
        } else if (prevProps.bedset_md5sum !== this.props.bedset_md5sum){
            await this.getBedByBedSet()
        } 
    }

    async getBedByQuery(){
        console.log("here:")
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
        console.log(this.state.bedData)

        this.getColumns()
        this.getData()
    }

    async getBedByBedSet(){
        let res = await api.get("/api/bedset/" + this.props.bedset_md5sum + "/bedfiles")
            .then(({ data }) => data)

        this.setState({
            bedData: res.data
        })

        this.getColumns()
        this.getData()
    }

    getColumns() {
        let tableColumns = []
        let cols = ["name", "md5sum"]
        console.log(this.state.bedData)
        cols = cols.concat(Object.keys(this.state.bedData[0][23]))

        for (var i = 0; i < cols.length; i++) {
            if (cols[i] === 'md5sum'||cols[i] === 'description') {
                tableColumns.push({ title: cols[i], field: cols[i], hidden: true })
            } else if (cols[i] === 'name') {
                tableColumns.push({
                    title: cols[i],
                    field: cols[i],
                    width: 550,
                    render: rowData => <Link className="home-link" to={{
                        pathname: '/bedsplash/' + rowData.md5sum
                    }}>{rowData.name}
                    </Link>
                })
            } else {
                tableColumns.push({ title: cols[i], field: cols[i], width: 100 })
            }
        }
        this.setState({
            columns: tableColumns
        })
    }

    getData(){
        let data = []
        data.push(this.state.bedData.map((bed) => {
            let row = { name: bed[3], md5sum: bed[1] }
            row = Object.assign({}, row, bed[23]);
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
                        search: false,
                    }}
                    // detailPanel={rowData => {
                    //     return (
                    //         <p>{rowData.description}</p>
                    //     )
                    // }}
                    components={{
                        Container: props => <Paper {...props} elevation={0}/>
                    }}
                />
            </div>
        );
    }
}

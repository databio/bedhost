import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ListGroup from "react-bootstrap/ListGroup";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import BedFileList from "./bedFileList";
import bedhost_api_url from "./const";
import { FaDatabase } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style/home.css"

const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class QueryResults extends React.Component {
    constructor() {
        super();
        this.state = {
            bedSetNames: [],
            selectedId: -1,
            bedFileNames: [],
            iconColor: '#45B39D'
        };
    }

    async componentDidMount() {
        let my_query = JSON.parse(this.props.query)
        let data = await api.get("/"+this.props.table_name + "/" + encodeURI(my_query)).then(({ data }) => data);
        console.log(data)
    }

    render() {
        return (
            <div style={{ marginTop: '50px' }}>
                <h1>{this.props.query}</h1>
            </div>
        );
    }
}

import React from 'react';
import "./queryBuilder.css";
// import { FaSearch } from "react-icons/fa";
import ResponsiveDialog from "./responsiveDialog"
// import $ from 'jquery';
// import QueryBuilder from '../utils/qb.js';
import axios from "axios";
import bedhost_api_url from "./const";

console.log("bedhost_api_url:", bedhost_api_url);
const api = axios.create({
  baseURL: bedhost_api_url,
});

const setRules = {
    condition: 'AND',
    rules: [{
        id: 'name',
        operator: 'not_equal',
        value: 'testname'
    }]
};

const fileRules = {
    condition: 'AND',
    rules: [{
        id: 'name',
        operator: 'not_equal',
        value: 'null'
    }, {
        condition: 'OR',
        rules: [{
            id: 'gc_content',
            operator: 'greater',
            value: 0.4
        }, {
            id: 'md5sum',
            operator: 'equal',
            value: '23jhb4j324b32hj4b23hj4b23hb42'
        }]
    }]
};


async function initializeQueryBuilder(element, table_name, newRules) {
    let filters_res = await api
    .get("filters/" + table_name)
    .catch(function (error) {
      alert(error + "; is bedhost running at " + bedhost_api_url + "?");
    });
    let filters = filters_res.data
    console.log(table_name, "filters retrieved from the server:", filters);
    const defaultRules = table_name === "bedfiles" ? fileRules : setRules
    const rules = newRules ? newRules : defaultRules;
    window.$(element).queryBuilder({ filters, rules });
}

export default class QueryBuilder extends React.Component {
    constructor(props) {
        super();
        this.queryBuilder = React.createRef()
        this.state = {
            rules: {},
        };
    }

    componentDidMount() {
        const element = this.queryBuilder.current;
        initializeQueryBuilder(element, this.props.table_name);
    }

    componentWillUnmount() {
        window.$(this.queryBuilder.current).queryBuilder('destroy');
    }

    shouldComponentUpdate() {
        return false;
    }

    // get data from jQuery Query Builder and pass to the react component
    handleGetRulesClick() {
        const rules = window.$(this.queryBuilder.current).queryBuilder('getSQL');
        this.setState({ rules: rules.sql });
        this.forceUpdate();
    }
    // reinitialize jQuery Query Builder based on react state
    handleSetRulesClick() {
        if (this.props.table_name === 'bedsets'){
            var defaultRules = setRules
        } else if (this.props.table_name === 'bedfiles') {
            defaultRules = fileRules
        }
        const newRules = { ...defaultRules };
        window.$(this.queryBuilder.current).queryBuilder('setRules', newRules);
        this.setState({ rules: newRules });
    }

    render() {
        return (
            <div>
                <div id='query-builder' ref={this.queryBuilder} />
                <ResponsiveDialog onClick={this.handleGetRulesClick.bind(this)} message = {JSON.stringify(this.state.rules, undefined, 2)}/>
                <button className='btn btn-sm' style={{backgroundColor:'#264653', color:"white"}} onClick={this.handleSetRulesClick.bind(this)}>RESET RULES</button>
                <button className='float-right btn btn-sm' style={{backgroundColor:'#264653', color:"white"}}>SEARCH</button>
            </div>
        );
    }
};
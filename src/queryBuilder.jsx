import React from 'react';
import "./queryBuilder.css";
// import { FaSearch } from "react-icons/fa";
import ResponsiveDialog from "./responsiveDialog"
import $ from 'jquery';
import queryBuilder from 'jQuery-QueryBuilder';
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

export default class QueryBuilderWrapper extends React.Component {
    constructor(props) {
        super();
        this.queryBuilder = React.createRef()
        this.state = {
            rules: {},
            filters: {}
        };
    }

    async componentDidMount() {
        await this.getfilter()
        const element = this.queryBuilder.current;
        this.initializeQueryBuilder(element, this.state.filters);
    }

    componentWillUnmount() {
        $(this.queryBuilder.current).queryBuilder('destroy');
    }

    async componentDidUpdate(prevProps, prevState) {
        // only update chart if the data has changed
        if (prevProps.table_name !== this.props.table_name) {
            await this.getfilter()
            $(this.queryBuilder.current).queryBuilder('setFilters', true, this.state.filters);
            if (this.props.table_name === 'bedsets') {
                var defaultRules = setRules
            } else if (this.props.table_name === 'bedfiles') {
                defaultRules = fileRules
            }
            const newRules = { ...defaultRules };
            $(this.queryBuilder.current).queryBuilder('setRules', newRules);
            this.setState({ rules: newRules });
        }
    }

    async getfilter() {
        let filters_res = await api
            .get("filters/" + this.props.table_name)
            .catch(function (error) {
                alert(error + "; is bedhost running at " + bedhost_api_url + "?");
            });
        this.setState({ filters: filters_res.data })
        console.log(this.state.filters)
    }

    initializeQueryBuilder(element, filters, newRules) {
        const defaultRules = this.props.table_name === "bedfiles" ? fileRules : setRules
        const rules = newRules ? newRules : defaultRules;
        $(element).queryBuilder({ filters, rules });
    }

    // get data from jQuery Query Builder and pass to the react component
    handleGetRulesClick() {
        const rules = $(this.queryBuilder.current).queryBuilder('getSQL');
        this.setState({ rules: rules.sql });
        this.forceUpdate();
    }
    // reinitialize jQuery Query Builder based on react state
    handleSetRulesClick() {
        if (this.props.table_name === 'bedsets') {
            var defaultRules = setRules
        } else if (this.props.table_name === 'bedfiles') {
            defaultRules = fileRules
        }
        const newRules = { ...defaultRules };
        $(this.queryBuilder.current).queryBuilder('setRules', newRules);
        this.setState({ rules: newRules });
    }


    render() {
        return (
            <div>
                <div id='query-builder' ref={this.queryBuilder} />
                <ResponsiveDialog onClick={this.handleGetRulesClick.bind(this)} message={JSON.stringify(this.state.rules, undefined, 2)} />
                <button className='btn btn-sm' style={{ backgroundColor: '#264653', color: "white" }} onClick={this.handleSetRulesClick.bind(this)}>RESET RULES</button>
                <button className='float-right btn btn-sm' style={{ backgroundColor: '#264653', color: "white" }}>SEARCH</button>
            </div>
        );
    }
};
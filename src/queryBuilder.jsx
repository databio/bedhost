import React from 'react';
import ResponsiveDialog from "./responsiveDialog"
import $ from 'jquery';
import 'jQuery-QueryBuilder';
import axios from "axios";
import bedhost_api_url from "./const";
import "./style/queryBuilder.css";
import ResultsBed from './queryResultsBed'
import ResultsBedSet from './queryResultsBedSet'



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
        value: 'test'
    }, {
        condition: 'OR',
        rules: [{
            id: 'gc_content',
            operator: 'greater',
            value: 0.5
        }, {
            id: 'regions_no',
            operator: 'greater',
            value: 300000
        }]
    }]
};

export default class QueryBuilderWrapper extends React.Component {
    constructor(props) {
        super();
        this.queryBuilder = React.createRef()
        this.state = {
            table_name: "",
            rules: {},
            query: '',
            filters: {},
            limit: 500
        };
    }

    async componentDidMount() {
        this.setState({ table_name: this.props.table_name })
        await this.getfilter()
        const element = this.queryBuilder.current;
        this.initializeQueryBuilder(element, this.state.filters);
        this.handleGetRulesClick()
    }

    componentWillUnmount() {
        $(this.queryBuilder.current).queryBuilder('destroy');
    }

    async componentDidUpdate(prevProps, prevState) {
        // only update query filter if the table_name has changed
        if (prevProps.table_name !== this.props.table_name) {
            await this.getfilter()
            $(this.queryBuilder.current).queryBuilder('setFilters', true, this.state.filters);
            this.handleSetRulesClick()
            this.setState({ table_name: this.props.table_name })
        }
    }

    async getfilter() {
        let filters_res = await api
            .get("/_private_api/filters/" + this.props.table_name)
            .catch(function (error) {
                alert(error + "; is bedhost running at " + bedhost_api_url + "?");
            });
        this.setState({ filters: filters_res.data })
    }

    initializeQueryBuilder(element, filters, newRules) {
        const defaultRules = this.props.table_name === "bedfiles" ? fileRules : setRules
        const rules = newRules ? newRules : defaultRules;
        $(element).queryBuilder({ filters, rules });
    }

    // get data from jQuery Query Builder and pass to the react component
    handleGetRulesClick() {
        const rules = $(this.queryBuilder.current).queryBuilder('getSQL');
        const query = $(this.queryBuilder.current).queryBuilder('getSQL', 'question_mark');
        this.setState({ rules: rules.sql, query: query });
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
        this.handleGetRulesClick()
    }

    setLimit(event) {
        this.setState({ limit: event.target.value });
    };

    render() {
        return (
            <div>
                <div id='query-builder' ref={this.queryBuilder} />
                <ResponsiveDialog onClick={this.handleGetRulesClick.bind(this)} message={JSON.stringify(this.state.rules, undefined, 2)} />
                <button className='btn btn-sm my-btn' onClick={this.handleSetRulesClick.bind(this)}>RESET RULES</button>
                <button className='float-right btn btn-sm my-btn' onClick={this.handleGetRulesClick.bind(this)}>SEARCH</button>
                <input className='float-right' style={{ width: '100px', height: '27px', marginLeft: '5px', padding: '5px', borderColor: '#ced4da', borderStyle: 'solid', borderWidth: '1px', borderRadius: '.25rem' }} type="text" value={this.state.limit} onChange={this.setLimit.bind(this)} />
                <label className='float-right' style={{ marginTop: '3px', fontSize: '10pt' }}>Set limit: </label>
                { this.props.table_name === this.state.table_name && this.state.query ? (
                    this.state.table_name === 'bedfiles' ? (
                        <ResultsBed query={this.state.query} limit={this.state.limit} />
                    ) : (
                            <ResultsBedSet query={this.state.query} limit={this.state.limit} />
                        )
                ) : null}
            </div>

        );
    }
};
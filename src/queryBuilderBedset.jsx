import React from 'react';
import "./queryBuilder.css";
import { FaSearch } from "react-icons/fa";
// import $ from 'jquery';
// import QueryBuilder from '../utils/qb.js';

const defaultRules = {
    condition: 'AND',
    rules: [{
        id: 'setname',
        operator: 'not_equal',
        value: 'null'
    }, {
        condition: 'OR',
        rules: [{
            id: 'genome',
            operator: 'equal',
            value: 1
        }]
    }]
};

function initializeQueryBuilder(element, newRules) {
    let filters = [{
        id: 'setname',
        label: 'Set Name',
        type: 'string'
    }, {
        id: 'genome',
        label: 'Genome',
        type: 'integer',
        input: 'select',
        values: {
            hg38: 'hg38',
            hg19: 'hg19',
        },
        operators: ['equal']
    }];
    const rules = newRules ? newRules : defaultRules;
    window.$(element).queryBuilder({ filters, rules });
}

export default class QueryBuilderBedset extends React.Component {
    constructor(props) {
        super();
        this.state = {
            rules: {},
        };
    }

    componentDidMount() {
        const element = this.refs.queryBuilder;
        initializeQueryBuilder(element);
    }

    componentWillUnmount() {
        window.$(this.refs.queryBuilder).queryBuilder('destroy');
    }
    shouldComponentUpdate() {
        return false;
    }
    // get data from jQuery Query Builder and pass to the react component
    handleGetRulesClick() {
        const rules = window.$(this.refs.queryBuilder).queryBuilder('getSQL');
        this.setState({ rules: rules });
        this.forceUpdate();
    }
    // reinitialize jQuery Query Builder based on react state
    handleSetRulesClick() {
        const newRules = { ...defaultRules };
        newRules.rules[0].value = newRules.rules[0].value ;
        window.$(this.refs.queryBuilder).queryBuilder('setRules', newRules);
        this.setState({ rules: newRules });
    }

    render() {
        return (
            <div>
                <div id='query-builder' ref='queryBuilder' />
                    <button className='btn btn-sm' style={{marginRight:'5px', backgroundColor:'#264653', color:"white"}} onClick={this.handleGetRulesClick.bind(this)}>SQL</button>
                    <button className='btn btn-sm' style={{backgroundColor:'#264653', color:"white"}} onClick={this.handleSetRulesClick.bind(this)}>RESET RULES</button>
                    <div className="float-right"><button className='btn btn-sm' style={{backgroundColor:'#264653'}}><FaSearch size={20} style={{ fill: 'white' }} /></button></div>
                <pre>
                    Component state:
                    {JSON.stringify(this.state.rules, undefined, 2)}
                </pre>
            </div>
        );
    }
};
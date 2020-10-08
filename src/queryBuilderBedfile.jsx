import React from 'react';
import "./queryBuilder.css";
import { FaSearch } from "react-icons/fa";
// import $ from 'jquery';
// import QueryBuilder from '../utils/qb.js';

const defaultRules = {
    condition: 'AND',
    rules: [{
        id: 'filename',
        operator: 'not_equal',
        value: 'null'
    }, {
        condition: 'OR',
        rules: [{
            id: 'gccontent',
            operator: 'greater',
            value: 0.4
        }, {
            id: 'genome',
            operator: 'equal',
            value: 'hg38'
        }]
    }]
};

function initializeQueryBuilder(element, newRules) {
    let filters = [{
        id: 'filename',
        label: 'File Name',
        type: 'string'
    }, {
        id: 'gccontent',
        label: 'GC content',
        type: 'double',
        validation: {
            min: 0,
            step: 0.1
        },
        operators: ['equal', 'not_equal', 'less', 'greater']
    }, {
        id: 'genome',
        label: 'Genome',
        type: 'string',
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

export default class QueryBuilderBedfile extends React.Component {
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
        newRules.rules[1].rules[0].value = newRules.rules[1].rules[0].value + 0.1;
        console.log( newRules.rules)
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
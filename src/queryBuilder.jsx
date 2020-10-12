import React from 'react';
import "./queryBuilder.css";
import { FaSearch } from "react-icons/fa";
import ResponsiveDialog from "./responsiveDialog"
// import $ from 'jquery';
// import QueryBuilder from '../utils/qb.js';

const setRules = {
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
            value: 'hg19'
        }]
    }]
};

const fileRules = {
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

let setFilters = [{
    id: 'setname',
    label: 'Set Name',
    type: 'string'
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

let fileFilters = [{
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


function initializeQueryBuilder(element, schema, newRules) {
    if (schema === 'bedset'){
        var filters = setFilters
        var defaultRules = setRules
    } else if (schema === 'bedfile') {
        filters = fileFilters
        defaultRules = fileRules
    }
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
        initializeQueryBuilder(element, this.props.schema);
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
        this.setState({ rules: rules });
        this.forceUpdate();
    }
    // reinitialize jQuery Query Builder based on react state
    handleSetRulesClick() {
        if (this.props.schema === 'bedset'){
            var defaultRules = setRules
        } else if (this.props.schema === 'bedfile') {
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
                <button className='float-right btn btn-sm' style={{backgroundColor:'#264653'}}><FaSearch size={20} style={{ fill: 'white' }} /></button>
            </div>
        );
    }
};
import React from "react";
import $ from "jquery";
import "jQuery-QueryBuilder";
import { OP_MAP } from "../const/keyMap";
import ResponsiveDialog from "./responsiveDialog";
import ResultsBed from "./queryResultsBed";
import ResultsBedSet from "./queryResultsBedSet";
import axios from "axios";
import bedhost_api_url from "../const/server";
import "../style/queryBuilder.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});

const setRules = {
  condition: "AND",
  rules: [
    {
      id: "name",
      operator: "not_equal",
      value: "testname",
    },
  ],
};

const fileRules = {
  condition: "AND",
  rules: [
    {
      id: "name",
      operator: "not_equal",
      value: "test",
    },
    {
      condition: "OR",
      rules: [
        {
          id: "gc_content",
          operator: "greater",
          value: 0.5,
        },
        {
          id: "regions_no",
          operator: "greater",
          value: 300000,
        },
      ],
    },
  ],
};

export default class QueryBuilderWrapper extends React.Component {
  constructor(props) {
    super();
    this.queryBuilder = React.createRef();
    this.state = {
      table_name: "",
      rules: {},
      query: "",
      graphql: "",
      filters: {},
      bedlimit: 500,
      setlimit: 50,
    };
  }

  async componentDidMount() {
    this.setState({ table_name: this.props.table_name });
    await this.getfilter();
    const element = this.queryBuilder.current;
    this.initializeQueryBuilder(element, this.state.filters);
    this.handleGetRulesClick();
  }

  componentWillUnmount() {
    $(this.queryBuilder.current).queryBuilder("destroy");
  }

  async componentDidUpdate(prevProps, prevState) {
    // only update query filter if the table_name has changed
    if (prevProps.table_name !== this.props.table_name) {
      await this.getfilter();
      $(this.queryBuilder.current).queryBuilder(
        "setFilters",
        true,
        this.state.filters
      );
      this.handleSetRulesClick();
      this.setState({ table_name: this.props.table_name });
    }
  }

  async getfilter() {
    let filters_res = await api
      .get(`/_private_api/filters/${this.props.table_name}`)
      .catch(function (error) {
        alert(`${error}; is bedhost running at ${bedhost_api_url}?`);
      });
    this.setState({ filters: filters_res.data });
  }

  initializeQueryBuilder(element, filters, newRules) {
    const defaultRules =
      this.props.table_name === "bedfiles" ? fileRules : setRules;
    const rules = newRules ? newRules : defaultRules;
    $(element).queryBuilder({ filters, rules });
  }

  // get data from jQuery Query Builder and pass to the react component
  handleGetRulesClick() {
    const sql = $(this.queryBuilder.current).queryBuilder("getSQL");
    const rules = $(this.queryBuilder.current).queryBuilder("getRules");
    const graphql = this.getFilter(rules);
    const graphql_query = `
    {bedfiles(filters: ${JSON.stringify(graphql).replace(/"(\w+)"\s*:/g, '$1:')}) {
        edges {
          node {
            name
            md5sum
          }
        }
      }
    }
    `
    this.setState({ rules: sql.sql, query: sql.sql, graphql: graphql_query });
    this.forceUpdate();
  }
  // reinitialize jQuery Query Builder based on react state
  handleSetRulesClick() {
    if (this.props.table_name === "bedsets") {
      var defaultRules = setRules;
    } else if (this.props.table_name === "bedfiles") {
      defaultRules = fileRules;
    }
    const newRules = { ...defaultRules };
    $(this.queryBuilder.current).queryBuilder("setRules", newRules);
    this.setState({ rules: newRules });
    this.handleGetRulesClick();
  }

  getFilter(rules) {
    if (Array.isArray(rules)) {
      let format_rules = [];
      for (var i = 0; i < rules.length; i++) {
        format_rules.push(this.getFilter(rules[i]));
      }
      return format_rules;
    } else {
      let format_rules = {};
      if (Object.keys(rules).includes("condition")) {
        format_rules[rules.condition.toLowerCase()] = this.getFilter(rules.rules);
      } else {
        const id = rules.id.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());
        const op = OP_MAP[rules.operator];
        const field = id + op;
        if (rules.operator !== "between") {
          format_rules[field] = rules.value;
        } else {
          format_rules[field] = {
            begin: rules.value[0],
            end: rules.value[1],
          };
        }
      }
      return format_rules;
    }
  }

  setLimit(event) {
    if (this.state.table_name === "bedfiles") {
      this.setState({ bedlimit: parseInt(event.target.value) });
    } else {
      this.setState({ setlimit: parseInt(event.target.value) });
    }
    console.log(this.state.bedlimit, this.state.setlimit)
  }

  render() {
    return (
      <div>
        <div id="query-builder" ref={this.queryBuilder} />
        <ResponsiveDialog
          onClick={this.handleGetRulesClick.bind(this)}
          message={JSON.stringify(this.state.rules, undefined, 2)}
          btn={'SQL'}
        />
        <ResponsiveDialog
          onClick={this.handleGetRulesClick.bind(this)}
          message={this.state.graphql}
          btn={'GraphQL'}
        />
        <button
          className="btn btn-sm my-btn"
          onClick={this.handleSetRulesClick.bind(this)}
        >
          RESET RULES
        </button>
        <button
          className="float-right btn btn-sm my-btn"
          onClick={this.handleGetRulesClick.bind(this)}
        >
          SEARCH
        </button>
        {this.state.table_name === "bedfiles" ? (
          <input
            className="float-right"
            style={{
              width: "100px",
              height: "27px",
              marginLeft: "5px",
              padding: "5px",
              borderColor: "#ced4da",
              borderStyle: "solid",
              borderWidth: "1px",
              borderRadius: ".25rem",
            }}
            type="number"
            value={this.state.bedlimit}
            onChange={this.setLimit.bind(this)}
          />
        ) : (
          <input
            className="float-right"
            style={{
              width: "100px",
              height: "27px",
              marginLeft: "5px",
              padding: "5px",
              borderColor: "#ced4da",
              borderStyle: "solid",
              borderWidth: "1px",
              borderRadius: ".25rem",
            }}
            type="number"
            value={this.state.setlimit}
            onChange={this.setLimit.bind(this)}
          />
        )}
        <label
          className="float-right"
          style={{ marginTop: "3px", fontSize: "10pt" }}
        >
          Set limit:{" "}
        </label>
        {this.props.table_name === this.state.table_name && this.state.query ? (
          this.state.table_name === "bedfiles" ? (
            <ResultsBed query={this.state.query} limit={this.state.bedlimit} />
          ) : (
            <ResultsBedSet
              query={this.state.query}
              limit={this.state.setlimit}
            />
          )
        ) : null}
      </div>
    );
  }
}

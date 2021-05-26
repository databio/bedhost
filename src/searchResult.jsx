import React from "react";
import MaterialTable from "material-table";
import Spinner from "react-bootstrap/Spinner";
import { Paper } from "@material-ui/core";
import { tableIcons } from "./tableIcons";
import { Link } from "react-router-dom";
import bedhost_api_url, {client} from "./const/server";
import axios from "axios";
import { FaMinus } from "react-icons/fa";
import { GET_BED_DIST } from "./graphql/bedQueries";


const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class ResultsBed extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedData: [],
      columns: [],
      data: [],
      pageSize: -1,
      pageSizeOptions: [],
      toolBar: true,
    };
  }

  async componentDidMount() {
    await this.getBedBySearchTerms();
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.term !== this.props.term) {
      await this.getBedBySearchTerms();
      this.setState({ term: this.props.term });
    }
  }

  async getBedBySearchTerms() {
    let terms = this.props.terms.split(/[\s,]+/)

    if (terms.length === 1){
        var res = await client
        .query({
          query: GET_BED_DIST,
          variables: { filters:  {searchTermIlike: terms[0]} },
        })
        .then(({ data }) => data.distances.edges);
        console.log("test:", res, typeof(res[0].node.score))
        res = res.slice().sort((a, b) => a.node.score - b.node.score);
        console.log("test:", res)
    } else{
        let old_res = {}
        res = terms.map(async (term, index) => {
            var new_res = await client
            .query({
              query: GET_BED_DIST,
              variables: { filters: '{searchTermIlike: '+term+'}' },
            })
            .then(({ data }) => data.distances.edges);
            if (index === 0) {
                old_res = new_res
            } else if (index === terms.length-1){
                old_res = this.getAvgDist(old_res, new_res, terms.length)
            } else{
                old_res = this.getAvgDist(old_res, new_res, 1)
            }
        return old_res
        }
        )
    }
    // let res = await api
    //   .get(
    //     "_private_api/distance/" +
    //       this.props.term +
    //       "/bedfiles/" +
    //       this.props.genome +
    //       "?ids=name&ids=md5sum&ids=other&limit=200"
    //   )
    //   .then(({ data }) => data);

    this.setState({
      bedData: res,
      toolBar: false,
    });

    if (res.length >= 50) {
      this.setState({
        pageSize: 50,
        pageSizeOptions: [50, 100, 150],
      });
    } else {
      this.setState({
        pageSize: res.length,
        pageSizeOptions: [res.length],
      });
    }
    this.setState({ terms: this.props.terms });
    console.log("BED files retrieved from the server: ", res);
    this.getColumns();
    this.getData();
  }

  getAvgDist(old_res, new_res, len){
    var res = []
    var bedIds = []
    bedIds.push(new_res.map((bed, index) => {
        return bed.node.bedId;
    }))
    res.push(old_res.map((bed, index) => {
        if (bedIds.includes(bed.node.bedId)){
            var new_res_idx = new_res.findIndex(function(new_bed) {
                return new_bed.node.bedId === bed.node.bedId
              });
            bed.node.score = (bed.node.score + new_res[new_res_idx].node.score)/len
            return bed
        }else{
           return
        }

    }
    ))
  }

  getColumns() {
    let tableColumns = [];
    let cols = [
      "name",
      "relevance",
      "data_source",
      "description",
    ];

    for (var i = 0; i < cols.length; i++) {
      if (cols[i] === "name") {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          cellStyle: {
            width: 500,
            maxWidth: 500,
          },
          headerStyle: {
            width: 500,
            maxWidth: 500,
          },
          render: (rowData) => (
            <Link
              className="home-link"
              to={{
                pathname: "/bedsplash/" + rowData.md5sum,
              }}
            >
              {rowData.name}
            </Link>
          ),
        });
      } else if (cols[i] === "description") {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          cellStyle: {
            width: 600,
            minWidth: 600,
          },
          headerStyle: {
            width: 600,
            minWidth: 600,
          },
        });
      } else if (cols[i] === "data_source") {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          render: (rowData) =>
            rowData.data_source === "GEO" ? (
              <a
                href={
                  "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=" +
                  rowData.GSE
                }
                className="home-link"
              >
                {rowData.data_source}
              </a>
            ) : rowData.data_source === "ENCODE" ? (
              <a
                href={"https://www.encodeproject.org/files/" + rowData.file_acc}
                className="home-link"
              >
                {rowData.data_source}
              </a>
            ) : null,
        });
      } else {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
        });
      }
    }
    this.setState({
      columns: tableColumns,
    });
  }

  getData() {
    let data = [];
    data.push(
      this.state.bedData.map((bed) => {
        let row = {
          name: bed.node.bedfile.name,
          md5sum: bed.node.bedfile.md5sum,
          relevance: this.getRelevance(bed.node.score),
        };
        row = Object.assign({}, row, JSON.parse(bed.node.bedfile.other));
        return row;
      })
    );
    this.setState({
      data: data[0],
    });
  }


  perc2Color(perc) {
    const gradient = [
      [209, 14, 0],
      [255, 215, 0],
      [0, 161, 5],
    ];
    if (perc < 0.5) {
      var color1 = gradient[1];
      var color2 = gradient[0];
      var upper = 0.5;
      var lower = 0;
    } else {
      color1 = gradient[2];
      color2 = gradient[1];
      upper = 1;
      lower = 0.5;
    }
    var firstcolor_x = lower;
    var secondcolor_x = upper - firstcolor_x;
    var slider_x = perc - firstcolor_x;
    var ratio = slider_x / secondcolor_x;

    var w = ratio * 2 - 1;
    var w1 = (w / 1 + 1) / 2;
    var w2 = 1 - w1;
    var rgb = [
      Math.round(color1[0] * w1 + color2[0] * w2),
      Math.round(color1[1] * w1 + color2[1] * w2),
      Math.round(color1[2] * w1 + color2[2] * w2),
    ];
    return rgb;
  }

  getRelevance(score) {
    let color = this.perc2Color(1 - score);
    score = ((1 - score) * 100).toFixed(2).toString() + "%";
    return (
      <p>
        <FaMinus
          style={{ marginRight: "5px", fontSize: "20px" }}
          color={"rgb(" + color.join() + ")"}
        />
        {score}
      </p>
    );
  }

  render() {
    return this.props.md5sum === this.state.md5sum ||
      this.props.query === this.state.query ||
      this.props.term === this.state.term ? (
      this.state.pageSize !== -1 ? (
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
              pageSize: this.state.pageSize,
              pageSizeOptions: this.state.pageSizeOptions,
              search: false,
              toolbar: this.state.toolBar,
            }}
            components={{
              Container: (props) => <Paper {...props} elevation={0} />,
            }}
            localization={{
              body: {
                emptyDataSourceMessage: (
                  <div style={{ position: "absolute", top: "5%", left: "50%" }}>
                    <Spinner
                      animation="border"
                      size="sm"
                      style={{ color: "lightgray" }}
                    />
                    <p style={{ color: "lightgray" }}>Loading data </p>
                  </div>
                ),
              },
            }}
          />
        </div>
      ) : null
    ) : null;
  }
}

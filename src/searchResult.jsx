import React from "react";
import MaterialTable from "material-table";
import Spinner from "react-bootstrap/Spinner";
import { Paper } from "@material-ui/core";
import { tableIcons } from "./tableIcons";
import { Link } from "react-router-dom";
import { FaMinus } from "react-icons/fa";
import { FaFolderPlus } from "react-icons/fa";
import axios from "axios";
import bedhost_api_url from "./const/server";

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
      myBedSet: JSON.parse(localStorage.getItem('myBedSet')) || []
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
    let terms = this.props.terms.split(/[\s,]+/);

    var request = {
      genome: this.props.genome,
      terms: terms
    };

    let res = await api.post('/_private_api/distance/bedfiles/terms?ids=name&ids=md5sum&ids=other&ids=genome', request)
      .then(({ data }) => data);

    console.log("test:", res)

    this.setState({
      bedData: res,
      terms: this.props.terms
    });

    if (res.data.length >= 50) {
      this.setState({
        pageSize: 50,
        pageSizeOptions: [50, 100, 150],
      });
    } else {
      this.setState({
        pageSize: res.data.length,
        pageSizeOptions: [res.data.length],
      });
    }

    this.props.setSearchingFalse(false);
    this.getColumns();
    this.getData();
  }


  getColumns() {
    let tableColumns = [];
    let cols = ["name", "relevance", "data_source", "description"];

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
    let data = this.state.bedData.data.map((bed) => {
      let bf = {}
      this.state.bedData.columns.forEach((key, i) => bf[key] = bed[i]);
      let row = {
        name: bf.name,
        md5sum: bf.md5sum,
        relevance: this.getRelevance(bf.score),
      };
      row = Object.assign({}, row, bf.other);
      return row;
    })

    this.setState({
      data: data,
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

  addtoBedSet(data) {
    alert("You added " + data.name + " to your BED set.")
    this.setState({
      myBedSet: [...this.state.myBedSet, { "id": data.id, "name": data.name, "md5sum": data.md5sum }]
    }, () => {
      localStorage.setItem('myBedSet', JSON.stringify(this.state.myBedSet))
    })


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
            actions={[
              {
                icon: () => < FaFolderPlus className="my-icon" />,
                tooltip: 'add to your BED set',
                onClick: (event, rowData) => this.addtoBedSet(rowData)
              }
            ]}
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
              toolbar: false,
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
                      style={{ marginRight: "5px", color: "lightgray" }}
                    />
                    <p style={{ color: "lightgray" }}>Loading data </p>
                  </div>
                ),
              },
            }}
          />
        </div>
      ) : (<div>
        <Spinner
          animation="border"
          size="sm"
          style={{ marginRight: "5px", color: "lightgray" }}
        />
        <p style={{ color: "lightgray" }}>Loading data </p>
      </div>)
    ) : null;
  }
}

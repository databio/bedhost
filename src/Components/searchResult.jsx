import React from "react";
import { Link } from "react-router-dom";
import { Row, Spinner } from "react-bootstrap";
import MaterialTable from "@material-table/core";
import { Paper, TablePagination } from "@mui/material";
import { FaMinus } from "react-icons/fa";
import { BsFolderPlus } from "react-icons/bs";
import { tableIcons } from "./tableIcons";
import axios from "axios";
import bedhost_api_url from "../const/server";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class ResultsBed extends React.Component {
  constructor(props) {
    super();
    this.state = {
      bedData: [],
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
    let res = await api.get(`/search/bed/${this.props.terms}`).then(({ data }) => data)
    console.log("search res: ", res)

    this.setState({
      bedData: res,
      terms: this.props.terms
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

    this.props.setSearchingFalse(false);
    this.getColumns();

  }


  getColumns() {
    let tableColumns = [];
    let cols = ["name", "scores", "BEDbaseDB"];

    for (var i = 0; i < cols.length; i++) {
      if (cols[i] === "name") {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          cellStyle: {
            width: 600,
            maxWidth: 600,
          },
          headerStyle: {
            width: 600,
            maxWidth: 600,
          },
        });
      }
      // else if (cols[i] === "description") {
      //   tableColumns.push({
      //     title: cols[i],
      //     field: cols[i],
      //     cellStyle: {
      //       width: 600,
      //       minWidth: 600,
      //     },
      //     headerStyle: {
      //       width: 600,
      //       minWidth: 600,
      //     },
      //   });
      // } else if (cols[i] === "data_source") {
      //   tableColumns.push({
      //     title: cols[i],
      //     field: cols[i],
      //     render: (rowData) =>
      //       rowData.data_source === "GEO" ? (
      //         <a
      //           href={
      //             `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${rowData.GSE}`
      //           }
      //           className="home-link"
      //         >
      //           {rowData.data_source}
      //         </a>
      //       ) : rowData.data_source === "ENCODE" ? (
      //         <a
      //           href={`https://www.encodeproject.org/files/${rowData.file_acc}`}
      //           className="home-link"
      //         >
      //           {rowData.data_source}
      //         </a>
      //       ) : null,
      //   });
      // } 
      else {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
        });
      }
    }
    return (tableColumns)
  }

  getData() {
    let data = this.state.bedData.map((bed) => {

      let BEDbaseDB = ""
      let name = ""
      let id = ""

      if (bed.metadata) {
        name = bed.metadata.name
        BEDbaseDB = "available"
        id = bed.metadata.record_identifier
      } else if (typeof bed.metadata === "undefined") {
        name = bed.payload.fileid
        BEDbaseDB = "not available"
        id = bed.id
      }

      let row = {
        name: this.addLink(id, name, BEDbaseDB),
        md5sum: id,
        scores: this.getRelevance(bed.score),
        BEDbaseDB: BEDbaseDB
      };
      // row = Object.assign({}, row, bed.other);
      return row;
    })
    console.log("data:", data)
    return (data)
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
    let color = this.perc2Color(score);
    score = ((score) * 100).toFixed(2).toString() + "%";
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

  addLink(id, name, bedbasedb) {
    if (bedbasedb === "available") {
      return (
        <Link
          className="home-link"
          to={{
            pathname: `/bedsplash/${id}`,
          }}
        >
          {name}
        </Link>
      )
    } else {
      return (
        <>{name}</>
      )
    }
  }

  addtoBedSet(data) {
    alert(`You added ${data.name} to your BED set.`)
    this.setState({
      myBedSet: [...this.state.myBedSet, { "name": data.name, "md5sum": data.md5sum }]
    }, () => {
      localStorage.setItem('myBedSet', JSON.stringify(this.state.myBedSet))
    })
  }

  render() {
    return this.props.md5sum === this.state.md5sum ||
      // this.props.query === this.state.query ||
      this.props.term === this.state.term ||
      this.state.bedData ? (
      this.state.pageSize !== -1 ? (
        <div style={{ marginTop: "20px" }}>
          <MaterialTable
            icons={tableIcons}
            columns={this.getColumns()}
            data={this.getData()}
            actions={[
              {
                icon: () => < BsFolderPlus className="my-icon" />,
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
              idSynonym: 'md5sum',
            }}
            components={{
              Container: (props) => <Paper {...props} elevation={0} />,
              Pagination: (props) => (
                <Row className="justify-content-end">
                  <TablePagination component="div"
                    {...props}
                  />
                </Row>
              ),
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

import React from "react";
import { Link } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import MaterialTable, { MTableToolbar } from "material-table";
import { Button, Paper, Tooltip } from "@material-ui/core";
import { tableIcons } from "./tableIcons";
import ShowFig from "./showFig";


export default class BedSetTable extends React.Component {
  constructor(props) {
    super();
    this.state = {
      columns: [],
      bedSetData: [],
      tableColumns: [],
      bedFigs: [],
      showFig: false,
      figType: "",
      selectedBedId: [],
      selectedBedName: [],
      pageSize: -1,
      pageSizeOptions: [],
      hideCol: "percentage",
    };
  }

  async componentDidMount() {
    // get bedsplash data via fastapi endpoints
    const bed_count = this.props.bedSetTableData.length;

    let cols = Object.keys(this.props.bedSetTableData[0]);

    const editable = this.props.bedSetTableData.map((o) => ({ ...o }));
    editable.forEach((i) => {
      if (i["median_tss_dist"] === 0) {
        i["median_tss_dist"] = "n/a"
      }
    });

    let bedSetFig = []

    Object.entries(this.props.schema).forEach(([key, value], index) => {
      if (value.type === "image") {
        bedSetFig.push({
          id: key,
          title: value.label,
          label: value.label,
        })
      }
    });

    this.setState({
      columns: cols,
      tableColumns: this.getColumns(cols),
      bedSetData: editable,
      bedFigs: bedSetFig,
    });

    if (bed_count >= 10) {
      this.setState({
        pageSize: 10,
        pageSizeOptions: [10, 15, 20],
      });
    } else {
      this.setState({
        pageSize: bed_count,
        pageSizeOptions: [bed_count],
      });
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.hideCol !== this.state.hideCol) {
      this.setState({
        tableColumns: this.getColumns(this.state.columns),
      });
    }
  }

  getColumns(cols) {
    let tableColumns = [];

    for (var i = 0; i < cols.length; i++) {
      if (i === 0) {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          width: 200,
          cellStyle: {
          },
          headerStyle: {
            backgroundColor: "#264653",
            color: "#FFF",
            fontWeight: "bold",
          },
          render: (rowData) => (
            <Link
              className="splash-link"
              to={{
                pathname: `/bedsplash/${rowData.md5sum}`,
              }}
            >
              {rowData.name}
            </Link>
          ),
        });
      }
      if (i === 1) {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          width: 300,
        });
      } else if (i !== 0) {
        if (
          cols[i] === "median_tss_dist" ||
          cols[i] === "mean_region_width"
        ) {
          tableColumns.push({
            title: cols[i],
            field: cols[i],
            width: 150,
          });
        } else if (cols[i].includes(this.state.hideCol)) {
          tableColumns.push({
            title: cols[i],
            field: cols[i],
            hidden: true,
            width: 0,
          });
        } else {
          tableColumns.push({
            title: cols[i].replaceAll(/_frequency|_percentage/gi, ""),
            field: cols[i],
            width: 100,
          });
        }
      }
    }
    return tableColumns;
  }

  bedSelected(rows) {
    // console.log("Selected Row Data:", rows);
    this.state.selectedBedId.splice(0, this.state.selectedBedId.length);
    this.state.selectedBedName.splice(0, this.state.selectedBedName.length);
    for (var i = 0; i < rows.length; i++) {
      this.state.selectedBedId.push(rows[i].md5sum);
      this.state.selectedBedName.push(rows[i].name);
    }
    this.setState({
      selectedBedId: this.state.selectedBedId,
      selectedBedName: this.state.selectedBedName,
    });
  }

  figTypeClicked(fig, name) {
    this.setState({
      showFig: true,
      figType: [fig, name],
    });
  }

  getFigButton() {
    return (
      <div style={{ padding: "5px 5px" }}>
        {this.state.bedFigs.map((fig, index) => {
          return (
            <>
              {fig ? (
                <Tooltip key={index} title={fig.title} placement="top">
                  <Button
                    size="small"
                    variant="contained"
                    style={{ padding: 5, margin: 5 }}
                    onClick={() => {
                      this.figTypeClicked(fig.id, fig.label);
                    }}
                  >
                    {fig.id}
                  </Button>
                </Tooltip>
              ) : null}
            </>
          );
        })}
      </div>
    );
  }

  render() {
    return (
      <div>
        <div>
          {this.state.pageSize !== -1 ? (
            <MaterialTable
              title=""
              columns={this.state.tableColumns} // <-- Set the columns on the table
              data={this.state.bedSetData} // <-- Set the data on the table
              icons={tableIcons}
              options={{
                fixedColumns: {
                  left: 1,
                },
                headerStyle: {
                  backgroundColor: "#264653",
                  color: "white",
                  fontWeight: "bold",
                },
                paging: true,
                pageSize: this.state.pageSize,
                pageSizeOptions: this.state.pageSizeOptions,
                search: true,
                selection: true,
                showSelectAllCheckbox: true,
              }}
              onSelectionChange={(rows) => {
                rows.length > 0
                  ? this.bedSelected(rows)
                  : this.setState({
                    selectedBedId: [],
                    selectedBedName: [],
                  });
              }}
              components={{
                Container: (props) => <Paper {...props} elevation={0} />,
                Toolbar: (props) => (
                  <div>
                    <MTableToolbar {...props} />
                    <div style={{ padding: "5px 5px" }}>
                      <Button
                        size="small"
                        variant="contained"
                        style={{ padding: 5, margin: 5 }}
                        onClick={() => {
                          this.setState({ hideCol: "frequency" });
                        }}
                      >
                        show percentage
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        style={{ padding: 5, margin: 5 }}
                        onClick={() => {
                          this.setState({ hideCol: "percentage" });
                        }}
                      >
                        show frequency
                      </Button>
                    </div>
                  </div>
                ),
              }}
              localization={{
                body: {
                  emptyDataSourceMessage: (
                    <div
                      style={{ position: "absolute", top: "5%", left: "50%" }}
                    >
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
          ) : null}
        </div>

        <div style={{ padding: "10px 10px" }}>
          {this.state.showFig ? (
            <>
              <h5>
                {this.state.figType[1].replaceAll(/_/gi, " ")}
              </h5>
              {this.getFigButton()}
              <ShowFig
                figType={this.state.figType}
                bedIds={this.state.selectedBedId}
                bedNames={this.state.selectedBedName}
              />
            </>
          ) : (
            <div>
              <h5
                style={{
                  color: "orange",
                  fontWeight: "bold",
                }}
              >
                Please select plot type.
              </h5>
              {this.getFigButton()}
            </div>
          )}
        </div>
      </div>
    );
  }
}

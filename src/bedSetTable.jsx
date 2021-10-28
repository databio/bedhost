import React from "react";
import MaterialTable, { MTableToolbar } from "material-table";
import { Button, Paper } from "@material-ui/core";
import Tooltip from "@material-ui/core/Tooltip";
import Spinner from "react-bootstrap/Spinner";
import { tableIcons } from "./tableIcons";
import ShowFig from "./showFig";
import { Label } from "semantic-ui-react";
import { Link } from "react-router-dom";


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
      hideCol: "Percentage",
    };
  }

  async componentDidMount() {
    const bed_count = this.props.bedSetTableData.totalCount;
    const bed_stats = this.props.bedSetTableData.edges;

    let cols = Object.keys(bed_stats[0].node);
    let data = bed_stats.map((value) => {
      return value.node;
    });
    const editable = data.map((o) => ({ ...o }));

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
          width: 500,
          cellStyle: {
            backgroundColor: "#333535",
            color: "#FFF",
            fontWeight: "bold",
          },
          headerStyle: {
            backgroundColor: "#333535",
            color: "#FFF",
            fontWeight: "bold",
          },
          render: (rowData) => (
            <Link
              className="splash-link"
              to={{
                pathname: "/bedsplash/" + rowData.md5sum,
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
          width: 275,
        });
      } else if (i !== 0) {
        if (
          cols[i] === "meanAbsoluteTssDist" ||
          cols[i] === "meanRegionWidth"
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
            title: cols[i].replaceAll(/Frequency|Percentage/gi, ""),
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
                  backgroundColor: "#333535",
                  color: "#FFF",
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
                          this.setState({ hideCol: "Frequency" });
                        }}
                      >
                        show percentage
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        style={{ padding: 5, margin: 5 }}
                        onClick={() => {
                          this.setState({ hideCol: "Percentage" });
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
                        style={{ color: "lightgray" }}
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
              <Label
                style={{
                  marginLeft: "15px",
                  fontSize: "15px",
                  padding: "6px 20px 6px 30px",
                }}
                as="a"
                color="teal"
                ribbon
              >
                {this.state.figType[1]}
              </Label>
              {this.getFigButton()}
              <ShowFig
                figType={this.state.figType}
                bedIds={this.state.selectedBedId}
                bedNames={this.state.selectedBedName}
              />
            </>
          ) : (
            <div style={{ marginLeft: "10px" }}>
              <Label
                style={{
                  marginLeft: "15px",
                  fontSize: "15px",
                  padding: "6px 20px 6px 30px",
                }}
                as="a"
                color="orange"
                ribbon
              >
                Please select plot type.
              </Label>
              {this.getFigButton()}
            </div>
          )}
        </div>
      </div>
    );
  }
}

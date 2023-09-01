import React from "react";
import { Link } from "react-router-dom";
import {
  Spinner,
  Col, Row,
  Dropdown, DropdownButton,
  ToggleButtonGroup, ToggleButton
} from "react-bootstrap";
import MaterialTable, { MTableActions } from "@material-table/core";
import { Paper, TablePagination } from "@mui/material";
import Modal from "react-bootstrap/Modal";
import { tableIcons } from "./tableIcons";
import ShowFig from "./showFig";
import "../style/splash.css";

export default class BedSetTable extends React.Component {
  constructor(props) {
    super();
    this.state = {
      columns: [],
      bedSetData: [],
      tableColumns: [],
      bedFigs: [],
      showFig: false,
      figType: [],
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

  handleClose() {
    this.setState({
      figType: [],
      showFig: false,
    });
  };

  figTypeClicked(e) {
    let fig = e.split(',')
    this.setState({
      showFig: true,
      figType: fig,
    });
  }

  getFigButton() {
    return (
      <DropdownButton
        alignright="true"
        className="dropdown-btn"
        title={this.state.figType.length > 0 ? this.state.figType[0] : "Select figure type"
        }
        id="select-fig-type"
        onSelect={this.figTypeClicked.bind(this)}
      >
        {this.state.bedFigs.map((fig, index) => {
          return (
            < Dropdown.Item key={index} eventKey={[fig.id, fig.label]} >
              {fig.id}
            </Dropdown.Item>
          );
        })}
      </DropdownButton>
    );
  }

  handleStatsType(selectedValue) {
    this.setState({ hideCol: selectedValue });
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
                idSynonym: 'md5sum',
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
                Actions: (props) => (
                  <Row className="justify-content-end">
                    <Col md="auto">
                      <MTableActions {...props} />
                    </Col>
                    <Col md="auto" >
                      {this.getFigButton()}
                    </Col>
                  </Row>
                ),
                Pagination: (props) => (
                  <Row className="justify-content-end">
                    <Col
                      style={{
                        padding: "0px",
                        borderBottom: "1px solid rgba(224, 224, 224, 1)"
                      }}
                    >
                      <ToggleButtonGroup
                        component="div"
                        style={{
                          marginTop: "15px",
                          marginLeft: "10px"
                        }}
                        name='stats type'
                        value={this.state.hideCol}
                        onChange={this.handleStatsType.bind(this)}
                      >
                        <ToggleButton
                          component="div"
                          className="btn-xs"
                          type='radio'
                          style={{ padding: "5px", fontSize: "10pt" }}
                          value={"frequency"}
                        >
                          Percentage
                        </ToggleButton>
                        <ToggleButton
                          component="div"
                          className="btn-xs"
                          type='radio'
                          style={{ padding: "5px", fontSize: "10pt" }}
                          value={"percentage"}
                        >
                          Frequency
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Col>
                    <Col md="auto" style={{ padding: "0px" }}>
                      <TablePagination component="div"
                        {...props}
                      />
                    </Col>
                  </Row>
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
              <Modal
                contentClassName="transparentBgClass"
                size="xl"
                aria-labelledby="contained-modal-title-vcenter"
                centered
                show={this.state.showFig}
                onHide={this.handleClose.bind(this)}
                animation={false}
              >
                <Modal.Header >
                  <Modal.Title>{this.state.figType[1].replaceAll(/_/gi, " ")}</Modal.Title>
                </Modal.Header>
                <Modal.Body
                  style={{
                    maxHeight: "750px"
                  }}>
                  <ShowFig
                    figType={this.state.figType}
                    bedIds={this.state.selectedBedId}
                    bedNames={this.state.selectedBedName}
                  />
                </Modal.Body>
                <Modal.Footer>
                  <button className='btn btn-sm btn-search' onClick={this.handleClose.bind(this)}>
                    Close
                  </button>
                </Modal.Footer>
              </Modal>
            </>
          ) : null}
        </div>
      </div>
    );
  }
}

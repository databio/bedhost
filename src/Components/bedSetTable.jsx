import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Spinner,
  Col,
  Row,
  Dropdown,
  DropdownButton,
  ToggleButtonGroup,
  ToggleButton,
} from "react-bootstrap";
import MaterialTable, { MTableActions } from "@material-table/core";
import { Paper, TablePagination } from "@mui/material";
import Modal from "react-bootstrap/Modal";
import { tableIcons } from "./tableIcons";
import ShowFig from "./showFig";
import { bedset_bedfiles_cols } from "../fastapi/bedSetQueries";
import "../style/splash.css";

function filterData(dict, keys) {
  return Object.keys(dict).reduce((result, key) => {
    if (keys.includes(key)) {
      result[key] = dict[key];
    }
    return result;
  }, {});
}


export default function BedSetTable(props) {
  const [state, setState] = useState({
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
    hideCol: "frequency",
  });

  useEffect(() => {
    const fetchData = async () => {
      const bed_count = props.bedSetTableData.length;

      let cols = bedset_bedfiles_cols;

      let editable = props.bedSetTableData.map((o) => ({ ...o }));

      editable.forEach((i) => {
        if (i["median_tss_dist"] === 0) {
          i["median_tss_dist"] = "n/a";
        }
        Object.entries(i).forEach(([key, value], index) => {
          if (!bedset_bedfiles_cols.includes(key)) {
            delete i[key];
          }
        });
      });

      let bedSetFig = [];

      Object.entries(props.schema).forEach(([key, value], index) => {
        if (value.object_type === "image") {
          bedSetFig.push({
            id: key,
            title: value.label,
            label: value.label,
          });
        }
      });

      let table_cols = getColumns(cols);

      setState((prevState) => ({
        ...prevState,
        columns: cols,
        tableColumns: table_cols,
        bedSetData: editable,
        bedFigs: bedSetFig,
      }));

      if (bed_count >= 10) {
        setState((prevState) => ({
          ...prevState,
          pageSize: 10,
          pageSizeOptions: [10, 15, 20],
        }));
      } else {
        setState((prevState) => ({
          ...prevState,
          pageSize: bed_count,
          pageSizeOptions: [bed_count],
        }));
      }
    };

    fetchData();
  }, [props.bedSetTableData, props.schema, state.hideCol]);

  const getColumns = (cols) => {
    let tableColumns = [];

    for (var i = 0; i < cols.length; i++) {
      if (cols[i] === "name") {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          width: 350,
          cellStyle: {},
          headerStyle: {
            backgroundColor: "#264653",
            color: "#FFF",
            fontWeight: "bold",
          },
          render: (rowData) => (
            <Link
              className="splash-link"
              to={{
                pathname: `/bed/${rowData.record_identifier}`,
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
        } else if (cols[i].includes(state.hideCol)) {
          tableColumns.push({
            title: cols[i],
            field: cols[i],
            hidden: true,
            width: 0,
          });
        } else if (cols[i] === "record_identifier") {
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
  };

  const bedSelected = (rows) => {
    let selectedBedId = [];
    let selectedBedName = [];
    for (var i = 0; i < rows.length; i++) {
      selectedBedId.push(rows[i].md5sum);
      selectedBedName.push(rows[i].name);
    }
    setState((prevState) => ({
      ...prevState,
      selectedBedId,
      selectedBedName,
    }));
  };

  const handleClose = () => {
    setState((prevState) => ({
      ...prevState,
      figType: [],
      showFig: false,
    }));
  };

  const figTypeClicked = (e) => {
    let fig = e.split(",");
    setState((prevState) => ({
      ...prevState,
      showFig: true,
      figType: fig,
    }));
  };

  const getFigButton = () => {
    return (
      <DropdownButton
        alignright="true"
        className="dropdown-btn"
        title={
          state.figType.length > 0 ? state.figType[0] : "Select figure type"
        }
        id="select-fig-type"
        onSelect={figTypeClicked}
      >
        {state.bedFigs.map((fig, index) => {
          return (
            <Dropdown.Item key={index} eventKey={[fig.id, fig.label]}>
              {fig.id}
            </Dropdown.Item>
          );
        })}
      </DropdownButton>
    );
  };

  const handleStatsType = (selectedValue) => {
    setState((prevState) => ({
      ...prevState,
      hideCol: selectedValue,
    }));
  };

  return (
    <div>
      <div>
        {state.pageSize !== -1 ? (
          <MaterialTable
            title=""
            columns={state.tableColumns} // <-- Set the columns on the table
            data={state.bedSetData} // <-- Set the data on the table
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
              pageSize: state.pageSize,
              pageSizeOptions: state.pageSizeOptions,
              search: true,
              selection: true,
              showSelectAllCheckbox: true,
              idSynonym: 'md5sum',
            }}
            onSelectionChange={(rows) => {
              rows.length > 0
                ? bedSelected(rows)
                : setState((prevState) => ({
                  ...prevState,
                  selectedBedId: [],
                  selectedBedName: [],
                }));
            }}
            components={{
              Container: (props) => <Paper {...props} elevation={0} />,
              Actions: (props) => (
                <Row className="justify-content-end">
                  <Col md="auto">
                    <MTableActions {...props} />
                  </Col>
                  <Col md="auto">
                    {getFigButton()}
                  </Col>
                </Row>
              ),
              Pagination: (props) => (
                <Row className="justify-content-end">
                  <Col
                    style={{
                      padding: "0px",
                      borderBottom: "1px solid rgba(224, 224, 224, 1)",
                    }}
                  >
                    <ToggleButtonGroup
                      component="div"
                      style={{
                        marginTop: "15px",
                        marginLeft: "10px",
                      }}
                      name='stats type'
                      onChange={(e) => handleStatsType(e)}
                      value={state.hideCol}
                    >
                      <ToggleButton
                        id="precentage"
                        component="div"
                        className="btn-xs"
                        type='radio'
                        style={{ padding: "5px", fontSize: "10pt" }}
                        value={"frequency"}
                      >
                        Percentage
                      </ToggleButton>
                      <ToggleButton
                        id="frequency"
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
                    <TablePagination
                      component="div"
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
                    style={{
                      position: "absolute",
                      top: "5%",
                      left: "50%",
                    }}
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
        {state.showFig ? (
          <>
            <Modal
              contentClassName="transparentBgClass"
              size="xl"
              aria-labelledby="contained-modal-title-vcenter"
              centered
              show={state.showFig}
              onHide={handleClose}
              animation={false}
            >
              <Modal.Header>
                <Modal.Title>{state.figType[1].replaceAll(/_/gi, " ")}</Modal.Title>
              </Modal.Header>
              <Modal.Body
                style={{
                  maxHeight: "750px",
                }}
              >
                <ShowFig
                  figType={state.figType}
                  bedIds={state.selectedBedId}
                  bedNames={state.selectedBedName}
                />
              </Modal.Body>
              <Modal.Footer>
                <button className='btn btn-sm btn-search' onClick={handleClose}>
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

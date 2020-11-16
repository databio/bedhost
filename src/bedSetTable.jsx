import React from "react";
import MaterialTable, { MTableToolbar } from "material-table";
import { Button, Paper } from "@material-ui/core";
import Tooltip from "@material-ui/core/Tooltip";
import { tableIcons } from "./tableIcons";
import ShowFig from "./showFig";
import toObject from "./toObject";
import bedhost_api_url from "./const";
import axios from "axios";
import { Label } from 'semantic-ui-react';
import { Link } from "react-router-dom";

const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class BedSetTable extends React.Component {
    constructor(props) {
        super();
        this.state = {
            columns: [],
            bedSetData: [],
            bedFigs: [],
            showFig: false,
            figType: "",
            selectedBedId: [],
            selectedBedName: []
        }
    }

    async componentDidMount() {
        let res = await api.get("/api/bedset/" + this.props.bedset_md5sum + "/bedfiles").then(({ data }) => data);
        console.log('BED set summary from the server: ', res)

        let cols = [res.columns[1], res.columns[3], res.columns[4], res.columns[5], res.columns[6],
        res.columns[21], res.columns[7], res.columns[17], res.columns[8], res.columns[18],
        res.columns[9], res.columns[16], res.columns[11], res.columns[20], res.columns[10],
        res.columns[19], res.columns[12], res.columns[13], res.columns[14], res.columns[15]]

        let data = []
        data.push(res.data.map((row) => {
            let value = [row[1], row[3], row[4].toFixed(3), row[5].toFixed(3), row[6].toFixed(3),
            row[21], row[7], row[17].toFixed(3), row[8], row[18].toFixed(3),
            row[9], row[16].toFixed(3), row[11], row[20].toFixed(3), row[10],
            row[19].toFixed(3), row[12], row[13].toFixed(3), row[14], row[15].toFixed(3)]
            let dict = toObject(cols, value)
            return dict
        }))

        this.setState({
            columns: cols,
            bedSetData: data[0],
            bedFigs: res.data[0][22]
        })
    }

    getColumns() {
        let tableColumns = [
            {
                title: this.state.columns[1],
                field: this.state.columns[1],
                width: 550,
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
                render: rowData => <Link className="splash-link" to={{
                    pathname: '/bedsplash/' + rowData.md5sum
                }}>{rowData.name}
                </Link>
            }
        ]

        for (var i = 0; i < this.state.columns.length; i++) {
            if (i === 0) {
                tableColumns.push({ title: this.state.columns[i], field: this.state.columns[i], width: 300 })
            } else if (i !== 1) {
                tableColumns.push({ title: this.state.columns[i], field: this.state.columns[i], width: 200 })
            }
        }
        return tableColumns
    }

    bedSelected(rows) {
        console.log("Selected Row Data:", rows);
        this.state.selectedBedId.splice(0, this.state.selectedBedId.length);
        this.state.selectedBedName.splice(0, this.state.selectedBedName.length);
        for (var i = 0; i < rows.length; i++) {
            this.state.selectedBedId.push(rows[i].md5sum);
            this.state.selectedBedName.push(rows[i].name);
        }
        this.setState({
            selectedBedId: this.state.selectedBedId,
            selectedBedName: this.state.selectedBedName
        });
    };

    figTypeClicked(fig, name) {
        this.setState({
            showFig: true,
            figType: [fig, name],
        })
    };

    render() {
        return (
            <div>
                <div>
                    <MaterialTable
                        title=""
                        columns={this.getColumns()} // <-- Set the columns on the table
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
                            search: true,
                            selection: true,
                            showSelectAllCheckbox: true,
                        }}
                        onSelectionChange={(rows) => {
                            rows.length > 0
                                ? this.bedSelected(rows)
                                : (this.setState({
                                    selectedBedId: [],
                                    selectedBedName: []
                                }));
                        }}
                        components={{
                            Container: props => <Paper {...props} elevation={0} />,
                            Toolbar: (props) => (
                                <div>
                                    <MTableToolbar {...props} />
                                    <div style={{ padding: "5px 5px" }}>
                                        {this.state.bedFigs.map((fig, index) => {
                                            return (
                                                <Tooltip
                                                    title={fig.caption}
                                                    placement="top"
                                                >
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        style={{ padding: 5, margin: 5 }}
                                                        onClick={() => {
                                                            this.figTypeClicked(
                                                                fig.name,
                                                                fig.caption
                                                            );
                                                        }}
                                                    >
                                                        {fig.name}
                                                    </Button>
                                                </Tooltip>
                                            )
                                        })}
                                    </div>
                                </div>
                            ),
                        }}
                    />
                </div>
                <div style={{ padding: "10px 10px" }}>
                    {this.state.showFig ? (
                        <ShowFig
                            figType={this.state.figType}
                            bedIds={this.state.selectedBedId}
                            bedNames={this.state.selectedBedName}
                        />
                    ) : (
                            <div style={{ marginLeft: "10px" }}>
                                <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='orange' ribbon>
                                    Please select plot type.
                      </Label>
                            </div>
                        )}
                </div>
            </div>
        );
    }
}

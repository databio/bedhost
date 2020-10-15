import React from "react";
import MaterialTable, { MTableToolbar } from "material-table";
import { Button, Paper } from "@material-ui/core";
import Tooltip from "@material-ui/core/Tooltip";
import * as d3 from 'd3';
import { tableIcons } from "./tableIcons";
import ShowFig from "./showFig";
import "./bedSetSplash.css";

export default class BedSetTable extends React.Component {
    constructor(props) {
        super();
        this.state = {
            dataPath: "." + props.dataSrc,
            columns: [],
            bedSetData: [],
            showFig: false,
            figType: "",
            selectedBedId: [],
            selectedBedName: []
        }
    }

    componentDidMount() {
        var data = require(`${this.state.dataPath}`)
        d3.csv(data).then((data) => {
            this.setState({ columns: data.columns, bedSetData: data.slice(0, data.length) });
            console.log(data);
        })
    }

    getColumns() {
        const tableColumns = [
            {
                title: this.state.columns[1],
                field: this.state.columns[1],
                width: 600,
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
            },
            { title: this.state.columns[0], field: this.state.columns[0], width: 300 },
            { title: this.state.columns[2], field: this.state.columns[2], width: 200 },
            { title: this.state.columns[3], field: this.state.columns[3], width: 200 },
            { title: this.state.columns[4], field: this.state.columns[4], width: 200 },
            { title: this.state.columns[5], field: this.state.columns[5], width: 200 },
            { title: this.state.columns[6], field: this.state.columns[6], width: 200 },
            { title: this.state.columns[7], field: this.state.columns[7], width: 200 },
            { title: this.state.columns[8], field: this.state.columns[8], width: 200 },
            { title: this.state.columns[9], field: this.state.columns[9], width: 200 },
            { title: this.state.columns[10], field: this.state.columns[10], width: 200 },
            { title: this.state.columns[11], field: this.state.columns[11], width: 200 },
            { title: this.state.columns[12], field: this.state.columns[12], width: 200 },
            { title: this.state.columns[13], field: this.state.columns[13], width: 200 }
        ];
        return tableColumns
    }

    bedFileSelected(rows) {
        console.log(rows);
        this.state.selectedBedId.splice(0, this.state.selectedBedId.length);
        this.state.selectedBedName.splice(0, this.state.selectedBedName.length);
        console.log(this.state.selectedBedId);
        for (var i = 0; i < rows.length; i++) {
            this.state.selectedBedId.push(rows[i].md5sum);
            this.state.selectedBedName.push(rows[i].name);
        }
        this.setState({
            selectedBedId: this.state.selectedBedId,
            selectedBedName: this.state.selectedBedName
        });

        console.log(this.state.selectedBedName);
    };

    figTypeClicked(fig, name) {
        this.setState({
            showFig: true,
            figType: [fig, name],
        })
    };

    render() {
        console.log(this.state.columns)
        console.log(this.state.bedSetData)
        return (
            <div>
                <div>
                    <MaterialTable
                        title = ""
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
                            // showSelectAllCheckbox: false,
                        }}
                        onSelectionChange={(rows) => {
                            rows.length > 0
                                ? this.bedFileSelected(rows)
                                : (this.setState({
                                    selectedBedId: [],
                                    selectedBedName: []
                                }));
                        }}
                        components={{
                            Container: props => <Paper {...props} elevation={0}/>,
                            Toolbar: (props) => (
                                <div>
                                    <MTableToolbar {...props} />
                                    <div style={{ padding: "5px 5px" }}>
                                        <Tooltip
                                            title="Region-TSS distance distribution"
                                            placement="top"
                                        >
                                            <Button
                                                size="small"
                                                variant="contained"
                                                style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.figTypeClicked(
                                                        "tssdist",
                                                        "Region-TSS distance distribution"
                                                    );
                                                }}
                                            >
                                                TSS dist
                                            </Button>
                                        </Tooltip>
                                        <Tooltip
                                            title="Regions distribution over chromosomes"
                                            placement="top"
                                        >
                                            <Button
                                                size="small"
                                                variant="contained"
                                                style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.figTypeClicked(
                                                        "chrombins",
                                                        "Regions distribution over chromosomes"
                                                    );
                                                }}
                                            >
                                                chrombins
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title="GC Content" placement="top">
                                            <Button
                                                size="small"
                                                variant="contained"
                                                style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.figTypeClicked("gccontent", "GC Content");
                                                }}
                                            >
                                                GC Content
                                            </Button>
                                        </Tooltip>
                                        <Tooltip
                                            title="Regions distribution over genomic partitions"
                                            placement="top"
                                        >
                                            <Button
                                                size="small"
                                                variant="contained"
                                                style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.figTypeClicked(
                                                        "partitions",
                                                        "Regions distribution over genomic partitions"
                                                    );
                                                }}
                                            >
                                                Partitions
                                            </Button>
                                        </Tooltip>
                                        <Tooltip
                                            title="Expected distribution over genomic partitions"
                                            placement="top"
                                        >
                                            <Button
                                                size="small"
                                                variant="contained"
                                                style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.figTypeClicked(
                                                        "expected_partitions",
                                                        "Expected distribution over genomic partitions"
                                                    );
                                                }}
                                            >
                                                Expected partitions
                                            </Button>
                                        </Tooltip>
                                        <Tooltip
                                            title="Cumulative distribution over genomic partitions"
                                            placement="top"
                                        >
                                            <Button
                                                size="small"
                                                variant="contained"
                                                style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.figTypeClicked(
                                                        "cumulative_partitions",
                                                        "Cumulative distribution over genomic partitions"
                                                    );
                                                }}
                                            >
                                                Cumulative partitions
                                            </Button>
                                        </Tooltip>
                                        <Tooltip
                                            title="Quantile-Trimmed Histogram of Widths"
                                            placement="top"
                                        >
                                            <Button
                                                size="small"
                                                variant="contained"
                                                style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.figTypeClicked(
                                                        "widths_histogram",
                                                        "Quantile-Trimmed Histogram of Widths"
                                                    );
                                                }}
                                            >
                                                Widths Histogram
                                            </Button>
                                        </Tooltip>
                                        <Tooltip
                                            title="Distances between neighbor regions"
                                            placement="top"
                                        >
                                            <Button
                                                size="small"
                                                variant="contained"
                                                style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.figTypeClicked(
                                                        "neighbor_distances",
                                                        "Distances between neighbor regions"
                                                    );
                                                }}
                                            >
                                                Neighbor Distances
                                            </Button>
                                        </Tooltip>
                                        <Tooltip
                                            title="Cell specific enrichment for open chromatin"
                                            placement="top"
                                        >
                                            <Button
                                                size="small"
                                                variant="contained"
                                                style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.figTypeClicked(
                                                        "open_chromatin",
                                                        "Cell specific enrichment for open chromatin"
                                                    );
                                                }}
                                            >
                                                Open chromatin
                                            </Button>
                                        </Tooltip>
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
                            <h2>Please select plot type.</h2>
                        )}
                </div>
            </div>
        );
    }
}

import React from "react";
import MaterialTable, { MTableToolbar } from "material-table";
import { Button, Paper } from "@material-ui/core";
import Tooltip from "@material-ui/core/Tooltip";
import { tableIcons } from "./tableIcons";
import ShowFig from "./showFig";
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
            showFig: false,
            figType: "",
            selectedBedId: [],
            selectedBedName: []
        }
    }

    async componentDidMount() {
        let res = await api.get("/bedset/data/" + this.props.bedset_md5sum + "?column=bedset_bedfiles_gd_stats").then(({ data }) => data);
        console.log('BED set summary from API: ', res)

        this.setState({
            columns: res.columns,
            bedSetData: res.data
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
                    pathname: '/bedfilesplash/' + rowData.md5sum
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

    bedFileSelected(rows) {
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
                                ? this.bedFileSelected(rows)
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

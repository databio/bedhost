import React from "react";
import MaterialTable, { MTableToolbar } from "material-table";
import { Button, Paper } from "@material-ui/core";
import Tooltip from "@material-ui/core/Tooltip";
import Spinner from 'react-bootstrap/Spinner'
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
            tableColumns: [],
            bedFigs: [],
            showFig: false,
            figType: "",
            selectedBedId: [],
            selectedBedName: [],
            pageSize: -1,
            pageSizeOptions: [],
            hideCol: '_percentage'
        }
    }

    async componentDidMount() {
        let res = await api.get("/api/bedset/" + this.props.bedset_md5sum + "/bedfiles").then(({ data }) => data);
        console.log('BED set summary from the server: ', res)

        let cols = [
            res.columns[0], res.columns[1], // name, md5sum
            res.columns[4], res.columns[5], res.columns[6], res.columns[7], // regions_no, gc_content, mean_absolute_tss_dist, mean_region_width
            res.columns[8], res.columns[18], // exon
            res.columns[9], res.columns[19], // intron
            res.columns[10], res.columns[17], // promoterprox
            res.columns[12], res.columns[21], // promotercore
            res.columns[11], res.columns[20], // intergenic
            res.columns[13], res.columns[15], // fiveutr
            res.columns[14], res.columns[16]] //threeutr

        let data = []
        data.push(res.data.map((row) => {
            let value = [
                row[0], row[1],
                row[4], row[5].toFixed(3), row[6].toFixed(3), row[7].toFixed(3),
                row[8], row[18].toFixed(3),
                row[9], row[19].toFixed(3),
                row[10], row[17].toFixed(3),
                row[11], row[21].toFixed(3),
                row[12], row[20].toFixed(3),
                row[13], row[15].toFixed(3),
                row[14], row[16].toFixed(3)
            ]
            let dict = toObject(cols, value)
            return dict
        }))

        let newbedFig = res.data[0].map((img, index) => {
            return (
                (index >= 22 && index <= res.columns.length - 2) ? {
                    id: res.columns[index],
                    title: res.data[0][index].title
                } : null
            )
        });
        newbedFig = newbedFig.slice(22, res.columns.length - 1)

        this.setState({
            columns: cols,
            bedSetData: data[0],
            bedFigs: newbedFig
        })

        if (res.data.length >= 10) {
            this.setState({
                pageSize: 10,
                pageSizeOptions: [10, 15, 20]
            })
        } else {
            this.setState({
                pageSize: res.data.length,
                pageSizeOptions: [res.data.length]
            })
        }
    }

    getColumns() {
        let tableColumns = [
            {
                title: this.state.columns[0],
                field: this.state.columns[0],
                width: 200,
                cellStyle: {
                    backgroundColor: "#333535",
                    color: "#FFF",
                    fontWeight: "bold"
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
            if (i === 1) {
                tableColumns.push({ title: this.state.columns[i], field: this.state.columns[i], width: 275 })
            } else if (i !== 0) {
                if (this.state.columns[i] === "mean_absolute_tss_dist" || this.state.columns[i] === "mean_region_width") {
                    tableColumns.push({ title: this.state.columns[i], field: this.state.columns[i], width: 150 })
                } else if (this.state.columns[i].includes(this.state.hideCol)){
                    tableColumns.push({ title: this.state.columns[i], field: this.state.columns[i], hidden: true, width: 0 })
                } else {
                    tableColumns.push({ title: this.state.columns[i].replaceAll(/_frequency|_percentage/gi, ""), field: this.state.columns[i], width: 100 })
                }
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

    getFigButton() {
        return (
            <div style={{ padding: "5px 5px" }}>
                {this.state.bedFigs.map((fig, index) => {
                    return (
                        <Tooltip
                            key={index}
                            title={fig.title}
                            placement="top"
                        >
                            <Button
                                size="small"
                                variant="contained"
                                style={{ padding: 5, margin: 5 }}
                                onClick={() => {
                                    this.figTypeClicked(
                                        fig.id,
                                        fig.title
                                    );
                                }}
                            >
                                {fig.id}
                            </Button>
                        </Tooltip>
                    )
                })}
            </div>
        )
    }

    render() {
        return (
            <div>
                <div>
                    {this.state.pageSize !== -1 ? (
                        <MaterialTable
                            title=""
                            columns={this.getColumns(this.state.hideCol)}
                            // {this.state.tableColumns} // <-- Set the columns on the table
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
                                            <Button size="small" variant="contained" style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.setState(
                                                        { hideCol: '_frequency' }
                                                    );
                                                }}
                                            >
                                                show percentage
                                            </Button>
                                            <Button size="small" variant="contained" style={{ padding: 5, margin: 5 }}
                                                onClick={() => {
                                                    this.setState(
                                                        { hideCol: '_percentage' }
                                                    );
                                                }}
                                            >
                                                show frequency
                                            </Button>
                                        </div>
                                    </div>
                                ),
                            }}
                            localization={{ 
                                body:{ 
                                    emptyDataSourceMessage:< div style={{position: "absolute", top:'5%', left:'50%'}}>
                                    <Spinner animation="border" size="sm" style={{color:'lightgray'}} />
                                    <p style={{color:'lightgray'}}>Loading data </p> 
                                    </div>
                                } 
                            }}
                        />) : null}
                </div>

                <div style={{ padding: "10px 10px" }}>
                    {this.state.showFig ? (
                        <>
                            <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
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
                                <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='orange' ribbon>
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

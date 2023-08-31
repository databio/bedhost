import React from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import bedhost_api_url from "../const/server";
import axios from "axios";


const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class DownloadBedSetDialog extends React.Component {

    constructor(props) {
        super();
        this.state = {
            request: {},
            open: false,
            type: ""
        };
    }

    getBedIdx() {
        const lst = JSON.parse(localStorage.getItem('myBedSet'))
        let id_list = []
        id_list.push(
            lst.map((bed) => {
                return bed.md5sum;
            })
        )
        let request = { md5sums: id_list[0] }
        this.setState({
            request: request
        })
        this.forceUpdate();
    }

    handleClickOpen() {
        this.setState({
            open: true
        });
        this.getBedIdx()
    };

    handleClose() {
        this.setState({
            open: false
        });
    };

    async handleClick(e) {
        this.setState({ type: e.target.id })
        await api.post(`/api/bedset/my_bedset/file_paths?remoteClass=${e.target.id}`, this.state.request)
            .then(res => {
                var data = new Blob([res.data], { type: 'text/csv' });
                var url = window.URL.createObjectURL(data);
                var a = document.createElement('a');
                a.href = url;
                a.setAttribute('download', 'mybedsetlist.txt');
                a.click();
            })
            .catch(error => {
                console.error(error);
            });
    }

    render() {
        return (
            <div className="float-left" onClick={this.props.onClick}>
                <button
                    className="btn btn-search"
                    style={{ marginRight: "5px" }}
                    onClick={this.handleClickOpen.bind(this)}
                >
                    {this.props.btn}
                </button>
                <Dialog
                    open={this.state.open}
                    onClose={this.handleClose.bind(this)}
                    aria-labelledby="responsive-dialog-title"
                >
                    <DialogTitle id="responsive-dialog-title">{this.props.btn}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            <span style={{ fontSize: "12pt" }}>
                                <p style={{ color: "red", fontSize: "9pt" }}>
                                    * This function is still under development.
                                    Here is the temporary instructions on "My BED set" downloading.
                                </p>
                                <p>
                                    {"Download from http with command "}
                                    <span style={{ fontWeight: 'bold' }}>
                                        {"wget -i my_bedset_http.txt"}
                                    </span>
                                </p>
                                <p>
                                    {"Download from s3 with command "}
                                    <span style={{ fontWeight: 'bold' }}>
                                        {"cat my_bedset_s3.txt | parallel aws s3 cp {} <output_dir>"}
                                    </span>
                                </p>
                            </span>
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <button
                            id='http'
                            onClick={this.handleClick.bind(this)}
                            className="btn btn-sm btn-search"
                            style={{ width: "30px", padding: "2px" }}
                        >
                            http
                        </button>
                        <button
                            id='s3'
                            onClick={this.handleClick.bind(this)}
                            className="btn btn-sm btn-search"
                            style={{ width: "30px", padding: "2px" }}
                        >
                            s3
                        </button>
                        <button
                            autoFocus
                            onClick={this.handleClose.bind(this)}
                            className="btn btn-sm btn-search"
                            style={{ padding: "2px" }}
                        >
                            Cancel
                        </button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

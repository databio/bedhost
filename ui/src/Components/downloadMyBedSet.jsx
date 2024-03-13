import React, { useState, useEffect } from "react";
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

export default function DownloadBedSetDialog(props) {
    const [state, setState] = useState({
        request: {},
        open: false,
        type: ""
    });

    useEffect(() => {
        if (state.open) {
            getBedIdx();
        }
    }, [state.open]);

    const getBedIdx = () => {
        const lst = JSON.parse(localStorage.getItem('myBedSet'))
        let id_list = lst.map((bed) => bed.md5sum);
        let request = { md5sums: id_list };
        setState({
            ...state,
            request: request
        });
    }

    const handleClickOpen = () => {
        setState({
            ...state,
            open: true
        });
    };

    const handleClose = () => {
        setState({
            ...state,
            open: false
        });
    };

    const handleClick = async (e) => {
        setState({
            ...state,
            type: e.target.id
        });

        try {
            const res = await api.post(`/bedset/my_bedset/file_paths?remoteClass=${e.target.id}`, state.request);
            var data = new Blob([res.data], { type: 'text/csv' });
            var url = window.URL.createObjectURL(data);
            var a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', 'mybedsetlist.txt');
            a.click();
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="float-left" onClick={props.onClick}>
            <button
                className="btn btn-search"
                style={{ marginRight: "5px" }}
                onClick={handleClickOpen}
            >
                {props.btn}
            </button>
            <Dialog
                open={state.open}
                onClose={handleClose}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogTitle id="responsive-dialog-title">{props.btn}</DialogTitle>
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
                        onClick={handleClick}
                        className="btn btn-sm btn-search"
                        style={{ width: "30px", padding: "2px" }}
                    >
                        http
                    </button>
                    <button
                        id='s3'
                        onClick={handleClick}
                        className="btn btn-sm btn-search"
                        style={{ width: "30px", padding: "2px" }}
                    >
                        s3
                    </button>
                    <button
                        autoFocus
                        onClick={handleClose}
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



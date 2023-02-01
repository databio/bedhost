import React from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    useMediaQuery
} from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import copy from "copy-to-clipboard";
import bedhost_api_url from "../const/server";

export default function DownloadBedSetDialog(props) {

    const [open, setOpen] = React.useState(false);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleClickCopy = () => {
        copy(props.message);
    };

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
                fullScreen={fullScreen}
                open={open}
                onClose={handleClose}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogTitle id="responsive-dialog-title">{props.btn}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <span style={{ fontSize: "12pt" }}>
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
                    <a
                        href={`${bedhost_api_url}/api/bedset/my_bedset/file_paths/${props.bedfiles}?remoteClass=http`}
                        className="home-link"
                        style={{
                            fontSize: "10pt",
                            fontWeight: "bold",
                        }}
                        download="my_bedset_http.txt"
                    >
                        <button
                            onClick={handleClickCopy}
                            className="btn btn-sm btn-search"
                            style={{ width: "30px", padding: "2px" }}
                        >
                            http
                        </button>
                    </a>
                    <a
                        href={`${bedhost_api_url}/api/bedset/my_bedset/file_paths/${props.bedfiles}?remoteClass=s3`}
                        className="home-link"
                        style={{
                            fontSize: "10pt",
                            fontWeight: "bold",
                        }}
                        download="my_bedset_s3.txt"
                    >
                        <button
                            onClick={handleClickCopy}
                            className="btn btn-sm btn-search"
                            style={{ width: "30px", padding: "2px" }}
                        >
                            s3
                        </button>
                    </a>

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

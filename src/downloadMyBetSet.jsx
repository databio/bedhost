import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import copy from "copy-to-clipboard";
import bedhost_api_url from "./const/server";

export default function ResponsiveDialog(props) {
    console.log("here:", props.bedfiles)

    const [open, setOpen] = React.useState(false);
    // const [idx, setIdx] = React.useState(idx_list);
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
                className="btn btn-sm my-btn"
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
                        href={bedhost_api_url + "/api/bedset/my_bedset/file_paths/" + props.bedfiles + "?remoteClass=http"}
                        className="home-link"
                        style={{
                            marginLeft: "15px",
                            fontSize: "10pt",
                            fontWeight: "bold",
                        }}
                        download="my_bedset_http.txt"
                    >
                        <button
                            onClick={handleClickCopy}
                            className="btn btn-sm my-btn"
                            style={{ marginRight: "5px" }}
                        >
                            http
                        </button>
                    </a>
                    <a
                        href={bedhost_api_url + "/api/bedset/my_bedset/file_paths/" + props.bedfiles + "?remoteClass=s3"}
                        className="home-link"
                        style={{
                            marginLeft: "15px",
                            fontSize: "10pt",
                            fontWeight: "bold",
                        }}
                        download="my_bedset_s3.txt"
                    >
                        <button
                            onClick={handleClickCopy}
                            className="btn btn-sm my-btn"
                            style={{ marginRight: "5px" }}
                        >
                            s3
                        </button>
                    </a>

                    <button
                        autoFocus
                        onClick={handleClose}
                        className="btn btn-sm my-btn"
                        style={{ marginRight: "5px" }}
                    >
                        Cancel
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

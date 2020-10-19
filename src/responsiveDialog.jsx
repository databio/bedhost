import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';
import copy from 'copy-to-clipboard';

export default function ResponsiveDialog(props) {
    const [open, setOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCopied(false)
    };

    const handleClickCopy = () => {
        copy(props.message);
        setCopied(true);
    };

    return (
        <div className="float-left" onClick={props.onClick}>
            <button className='btn btn-sm my-btn' style={{ marginRight: '5px' }} onClick={handleClickOpen}>
                SQL
      </button>
            <Dialog
                fullScreen={fullScreen}
                open={open}
                onClose={handleClose}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogTitle id="responsive-dialog-title">{"SQL"}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {props.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    {copied ? <span style={{ color: 'red' }}>Copied.</span> : null}
                    <button onClick={handleClickCopy} className='btn btn-sm my-btn' style={{ marginRight: '5px'  }}>
                        Copy
                    </button>
                    <button autoFocus onClick={handleClose} className='btn btn-sm my-btn' style={{ marginRight: '5px'}}>
                        Cancel
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
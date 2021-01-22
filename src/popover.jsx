import React from 'react';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import { FaQuestionCircle } from "react-icons/fa";


export default function SimplePopover(props) {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    return (
        <div style={{ display: 'inline' }} onClick={props.onClick}>
            <FaQuestionCircle onClick={handleClick} style={{ marginBottom: "3px", marginLeft: '10px', fontSize: '12px' }} color='white' />
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                style={{ width: "700px", height: "400px" }}
            >
                <Typography className={'new-line'} style={{ margin: "15px", fontSize: '12px', color: "#e76f51" }}>{props.message}</Typography>
            </Popover>
        </div>
    );
}

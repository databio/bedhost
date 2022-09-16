import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import ModalImage from "./modalImage";
import Tooltip from "@material-ui/core/Tooltip";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
  }
}));

export default function ImgGrid(props) {
  const classes = useStyles();
  const gridWidth = (props.page === "bed") ? 1000 : 1575;
  const cellHeight = (props.page === "bed") ? 250 : 350;

  return (
    <div className={classes.root}>
      <GridList style={{ width: gridWidth }} cellHeight={cellHeight} spacing={25} cols={5}>
        {props.imgList.map((image, index) => {
          return (
            <GridListTile key={index}>
              <ModalImage image={image} page={props.page} />
              <Tooltip title={image.title} ><p><b>Fig. {index + 1}: </b> {image.title}</p></Tooltip>
            </GridListTile>
          );
        })}
      </GridList>

    </div>
  )
}

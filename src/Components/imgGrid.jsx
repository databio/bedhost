import React from "react";
import { ImageList, ImageListItem, Tooltip } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ModalImage from "./modalImage";

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
  const gridWidth = 1000;
  const rowHeight = (props.page === "bed") ? 215 : 350;
  const gridCols = 3;
  const style = (props.page === "bed") ? { height: "650px" } : { height: "700px", overflow: "scroll" }

  return (
    <div className={classes.root} style={style}>
      < ImageList component="span" style={{ width: gridWidth }} rowHeight={rowHeight} cols={gridCols}>
        {props.imgList.map((image, index) => {
          return (
            < ImageListItem key={index}>
              <ModalImage image={image} page={props.page} />
              <Tooltip title={image.title} ><p><b>Fig. {index + 1}: </b> {image.title}</p></Tooltip>
            </ ImageListItem>
          );
        })}
      </ ImageList>
    </div>
  )
}

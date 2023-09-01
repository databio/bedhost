import React from "react";
import { ImageList, ImageListItem, Tooltip } from "@mui/material";
import { styled } from "@mui/system"
import ModalImage from "./modalImage";

const useStyles = styled({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden"
  }
});

export default function ImgGrid(props) {
  const classes = useStyles;
  const rowHeight = (props.page === "bed") ? 210 : 350;
  const gridCols = 3;
  const style = (props.page === "bed") ? { height: "650px" } : { height: "700px", overflow: "scroll" }

  return (
    <div className={classes.root} style={style}>
      < ImageList component="span" style={{ width: '100%', height: '100%' }} rowHeight={rowHeight} cols={gridCols}>
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

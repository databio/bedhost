import React from "react";
import { GridList, GridListTile, Tooltip } from "@material-ui/core";
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
  const gridWidth = (props.page === "bed") ? 1000 : 1575;
  const cellHeight = (props.page === "bed") ? 200 : 350;

  return (
    <div className={classes.root}>
      <GridList style={{ width: gridWidth }} cellHeight={cellHeight} spacing={10} cols={3}>
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

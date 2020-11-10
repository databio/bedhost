import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
// import GridListTileBar from "@material-ui/core/GridListTileBar";
import ModalImage from "./modalImage";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
  },
  imgSize: {
    height: 300,
    width: 300
  },
}));

export default function ImgGrid(props) {
  const classes = useStyles();
  // console.log("Img List: ", props.imgList)

  return (
    <div className={classes.root}>
      <GridList style={{ width: props.cols * 300 }} cellHeight={350} spacing={30} cols={props.cols}>
        {props.imgList.map((image, index) => {
          return (
            <GridListTile key={index}>
              <ModalImage image={image} />
              <p> <b>Fig. {index + 1} :</b> {image.caption}</p>
              {/* <GridListTileBar title={image.caption} /> */}
            </GridListTile>
          );
        })}
      </GridList>

    </div>
  )
}

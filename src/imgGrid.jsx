import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
  },
  gridList: {
    width: 2000,
  },
  imgSize: {
    height: 300,
    width: 300
  },
}));

export default function ImgGrid(props) {
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <GridList cellHeight={350} className={classes.gridList} cols={5}>
              {props.imgList.map((image) => {
                return (
                  <GridListTile key={image.id}>
                    <img
                      className={classes.imgSize}
                      src={require(image.src + ".png")}
                      alt={image.name}
                    />
                    <a href={require(image.src + ".pdf")}>
                      <GridListTileBar title={image.caption} />
                    </a>
                  </GridListTile>
                );
              })}
            </GridList>
          </div>
    )
}

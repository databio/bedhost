import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import ListSubheader from "@material-ui/core/ListSubheader";
import IconButton from "@material-ui/core/IconButton";
import InfoIcon from "@material-ui/icons/Info";
import "./index.css";

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
    height: 400,
  },
}));

export default function ShowFig(props) {
  const classes = useStyles();
  const [figList, setFigList] = useState([]);

  const getFig = () => {
    if (figList != 0) {
      console.log("clear");
      setFigList([]);
    }
    for (var i = 0; i < props.bedIds.length; i++) {
      console.log("push");
      figList.push({
        id: i + 1,
        name: props.bedNames[i],
        src:
          // "/static/react-front-end/public/bedstat_output/" + // use this line if start with bedhost serve
          "./outputs/bedstat_output/" + // use this line if start react app on separete port with (npm run dev)
          props.bedIds[i] +
          "/" +
          props.bedNames[i] +
          "_" +
          props.figType[0],
      });
    }
  };

  getFig();
  console.log(props.bedIds);
  console.log(figList);
  return (
    <div>
      {props.bedIds.length === 0 ? (
        <h2>Please select a bedfile.</h2>
      ) : (
        <div>
          <h2>{props.figType[1]}</h2>
          <div className={classes.root}>
            <GridList cellHeight={450} className={classes.gridList} cols={4}>
              {figList.map((image) => {
                return (
                  <GridListTile key={image.id}>
                    <img
                      className={classes.imgSize}
                      src={require(image.src + ".png")}
                      alt={image.name}
                    />
                    <a href={require(image.src + ".pdf")}>
                      <GridListTileBar title={image.name} />
                    </a>
                  </GridListTile>
                );
              })}
            </GridList>
          </div>
        </div>
      )}
    </div>
  );
}
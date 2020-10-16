import React, { useState } from "react";
import ImgGrid from "./imgGrid";

export default function ShowFig(props) {
  const [figList, setFigList] = useState([]);

  const getFig = () => {
    if (figList.length !== 0) {
      console.log("CLEAR image list");
      setFigList([]);
    }
    for (var i = 0; i < props.bedIds.length; i++) {
      console.log("PUSH to image list");
      figList.push({
        id: i + 1,
        caption: props.bedNames[i],
        src:
          "./outputs/bedstat_output/" + 
          props.bedIds[i] +
          "/" +
          props.bedNames[i] +
          "_" +
          props.figType[0],
      });
    }
  };

  getFig();

  return (
    <div>
      {props.bedIds.length === 0 ? (
        <h2>Please select a bedfile.</h2>
      ) : (
          <div>
            <h2>{props.figType[1]}</h2>
            <ImgGrid imgList={figList} />
          </div>
        )}
    </div>
  );
}
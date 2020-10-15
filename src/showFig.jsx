import React, { useState } from "react";
import ImgGrid from "./imgGrid";

export default function ShowFig(props) {
  const [figList, setFigList] = useState([]);

  const getFig = () => {
    if (figList.length !== 0) {
      console.log("clear");
      setFigList([]);
    }
    for (var i = 0; i < props.bedIds.length; i++) {
      console.log("push");
      figList.push({
        id: i + 1,
        caption: props.bedNames[i],
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
            <ImgGrid imgList={figList} />
          </div>
        )}
    </div>
  );
}
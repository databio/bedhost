import React, { useState } from "react";
import ImgGrid from "./imgGrid";
import bedhost_api_url from "../const/server";

import { Label } from 'semantic-ui-react'; //

export default function ShowFig(props) {
  const [figList, setFigList] = useState([]);

  const getFig = () => {
    if (figList.length !== 0) {
      setFigList([]);
    }
    for (var i = 0; i < props.bedIds.length; i++) {
      figList.push({
        id: props.figType[0],
        title: props.bedNames[i],
        src_pdf: `${bedhost_api_url}/api/bed/${props.bedIds[i]}/img/${props.figType[1]}?format=pdf`,
        src_png: `${bedhost_api_url}/api/bed/${props.bedIds[i]}/img/${props.figType[1]}?format=png`
      });
    }
  };

  getFig();

  return (
    <div style={{ marginLeft: "10px" }}>
      {props.bedIds.length === 0 ? (
        <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} color='orange' ribbon>
          Please select a bed file.
        </Label>
      ) : (
        <div>
          <ImgGrid imgList={figList} page="bedset" />
        </div>
      )}
    </div>
  );
}
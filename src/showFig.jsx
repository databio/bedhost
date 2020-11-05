import React, { useState } from "react";
import ImgGrid from "./imgGrid";
import bedhost_api_url from "./const";
import { Label } from 'semantic-ui-react';

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
        src_pdf: bedhost_api_url + "/api/img/bedfiles/" + props.bedIds[i] + "/" + props.figType[0] + "/pdf",
        src_png: bedhost_api_url + "/api/img/bedfiles/" + props.bedIds[i] + "/" + props.figType[0] + "/png"
      });
    }
  };

  getFig();

  return (
    <div style={{ marginLeft: "10px" }}>
      {props.bedIds.length === 0 ? (
        <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='orange' ribbon>
          Please select a bedfile.
        </Label>
      ) : (
          <div>
            <Label style={{ marginLeft: '15px', fontSize: '15px', padding: "6px 20px 6px 30px" }} as='a' color='teal' ribbon>
              {props.figType[1]}
            </Label>
            <ImgGrid imgList={figList} cols={5}/>
          </div>
        )}
    </div>
  );
}
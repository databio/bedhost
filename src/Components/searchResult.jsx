import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Row, Spinner } from "react-bootstrap";
import MaterialTable from "@material-table/core";
import { Paper, TablePagination } from "@mui/material";
import { FaMinus } from "react-icons/fa";
import { BsFolderPlus } from "react-icons/bs";
import { tableIcons } from "./tableIcons";
import axios from "axios";
import bedhost_api_url from "../const/server";

const api = axios.create({
  baseURL: bedhost_api_url,
});


export default function ResultsBed(props) {
  const [bedData, setBedData] = useState([]);
  const [pageSize, setPageSize] = useState(-1);
  const [pageSizeOptions, setPageSizeOptions] = useState([]);
  const [myBedSet, setMyBedSet] = useState(JSON.parse(localStorage.getItem('myBedSet')) || []);
  const [term, setTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      await getBedBySearchTerms();
    };
    fetchData();
  }, [props.terms]);

  useEffect(() => {
    if (props.terms !== term) {
      getBedBySearchTerms();
      setTerm(props.terms);
    }
  }, [props.terms, term]);

  const getBedBySearchTerms = async () => {
    let res = await api.get(`/search/bed/${props.terms}`).then(({ data }) => data);

    setBedData(res);

    if (res.length >= 50) {
      setPageSize(50);
      setPageSizeOptions([50, 100, 150]);
    } else {
      setPageSize(res.length);
      setPageSizeOptions([res.length]);
    }

    props.setSearchingFalse(false);
  };

  const getColumns = () => {
    let tableColumns = [];
    let cols = ["name", "scores", "BEDbaseDB"];

    for (var i = 0; i < cols.length; i++) {
      if (cols[i] === "name") {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
          cellStyle: {
            width: 600,
            maxWidth: 600,
          },
          headerStyle: {
            width: 600,
            maxWidth: 600,
          },
        });
      } else {
        tableColumns.push({
          title: cols[i],
          field: cols[i],
        });
      }
    }
    return tableColumns;
  };

  const getData = () => {
    return bedData.map((bed) => {
      let BEDbaseDB = "";
      let name = "";
      let id = "";

      if (bed.metadata) {
        name = bed.metadata.name;
        BEDbaseDB = "available";
        id = bed.metadata.record_identifier;
      } else if (typeof bed.metadata === "undefined") {
        name = "";
        BEDbaseDB = "not available";
        id = bed.id;
      }

      let row = {
        name: addLink(id, name, BEDbaseDB),
        md5sum: id,
        scores: getRelevance(bed.score),
        BEDbaseDB: BEDbaseDB,
      };
      return row;
    });
  };

  const perc2Color = (perc) => {
    const gradient = [
      [209, 14, 0],
      [255, 215, 0],
      [0, 161, 5],
    ];
    if (perc < 0) {
      var color1 = gradient[1];
      var color2 = gradient[0];
      var upper = 0;
      var lower = -1;
    } else {
      color1 = gradient[2];
      color2 = gradient[1];
      upper = 1;
      lower = 0;
    }
    var firstcolor_x = lower;
    var secondcolor_x = upper - firstcolor_x;
    var slider_x = perc - firstcolor_x;
    var ratio = slider_x / secondcolor_x;

    var w = ratio * 2 - 1;
    var w1 = (w / 1 + 1) / 2;
    var w2 = 1 - w1;
    var rgb = [
      Math.round(color1[0] * w1 + color2[0] * w2),
      Math.round(color1[1] * w1 + color2[1] * w2),
      Math.round(color1[2] * w1 + color2[2] * w2),
    ];
    return rgb;
  };

  const getRelevance = (score) => {
    let color = perc2Color(score);
    return (
      <p>
        <FaMinus
          style={{ marginRight: "5px", fontSize: "20px" }}
          color={"rgb(" + color.join() + ")"}
        />
        {score}
      </p>
    );
  };

  const addLink = (id, name, bedbasedb) => {
    if (bedbasedb === "available") {
      return (
        <Link
          className="home-link"
          to={{
            pathname: `/bed/${id}`,
          }}
        >
          {name}
        </Link>
      );
    } else {
      return <>{name}</>;
    }
  };

  const addtoBedSet = (data) => {
    alert(`You added ${data.name.props.children} to your BED set.`);
    setMyBedSet([...myBedSet, { name: data.name.props.children, md5sum: data.md5sum }]);
    localStorage.setItem('myBedSet', JSON.stringify([...myBedSet, { name: data.name.props.children, md5sum: data.md5sum }]));
  };

  return (
    (props.md5sum === bedData.md5sum ||
      props.term === term ||
      bedData) && (
      pageSize !== -1 ? (
        <div style={{ marginTop: "20px" }}>
          <MaterialTable
            icons={tableIcons}
            columns={getColumns()}
            data={getData()}
            actions={[
              {
                icon: () => < BsFolderPlus className="my-icon" />,
                tooltip: 'add to your BED set',
                onClick: (event, rowData) => addtoBedSet(rowData),
              },
            ]}
            title=""
            options={{
              headerStyle: {
                backgroundColor: "#264653",
                color: "#FFF",
                fontWeight: "bold",
              },
              paging: true,
              pageSize: pageSize,
              pageSizeOptions: pageSizeOptions,
              search: false,
              toolbar: false,
              idSynonym: 'record_indentifier',
            }}
            components={{
              Container: (props) => <Paper {...props} elevation={0} />,
              Pagination: (props) => (
                <Row className="justify-content-end">
                  <TablePagination component="div" {...props} />
                </Row>
              ),
            }}
            localization={{
              body: {
                emptyDataSourceMessage: (
                  <div style={{ position: "absolute", top: "5%", left: "50%" }}>
                    <Spinner
                      animation="border"
                      size="sm"
                      style={{ marginRight: "5px", color: "lightgray" }}
                    />
                    <p style={{ color: "lightgray " }}>Loading data </p>
                  </div>
                ),
              },
            }}
          />
        </div>
      ) : (
        <div>
          <Spinner
            animation="border"
            size="sm"
            style={{ marginRight: "5px", color: "lightgray" }}
          />
          <p style={{ color: "lightgray" }}>Loading data </p>
        </div>
      )
    )
  );
};


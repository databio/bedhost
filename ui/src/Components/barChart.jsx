import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
} from "recharts";

export default function BedSetBarChart(props) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      let dataValue = Object.entries(await props.stats).map(
        ([key, value], index) => {
          return {
            name: key,
            value: Number((value[0] * 100).toFixed(2)),
            std: [
              Number((value[0] * 100).toFixed(2)) -
              Number((value[1] * 100).toFixed(2)),
              Number((value[0] * 100).toFixed(2)) +
              Number((value[1] * 100).toFixed(2)),
            ],
          };
        }
      );
      setData(dataValue);
    };

    fetchData();
  }, [props.stats]);

  return (
    <div>
      {console.log("BED set stats: ", data)}
      <span style={{ marginLeft: "20px" }}>
        Mean Regional Distribution of the BED Set
      </span>
      <BarChart
        width={380}
        height={250}
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 20,
          bottom: 35,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" interval={0} angle="-45" textAnchor="end" />
        <YAxis
          label={{
            value: "Frequency (%)",
            angle: -90,
            position: "insideLeft",
            dy: 50,
          }}
        />
        <Tooltip />
        <Bar dataKey="value" fill="teal">
          <ErrorBar
            dataKey="std"
            width={2}
            strokeWidth={1}
            stroke="black"
            direction="y"
          />
        </Bar>
      </BarChart>
    </div>
  );
}



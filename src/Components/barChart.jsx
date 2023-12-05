import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
} from "recharts";

export default class BedSetBarChart extends React.Component {

  constructor(props) {
    super();
    this.state = {
      data: [],
    };
  }

  async componentDidMount() {
    let data_value = Object.entries(await this.props.stats).map(
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
    this.setState({ data: data_value });
  }

  render() {
    return (
      <div >

        {console.log("BED set stats: ", this.state.data)}
        <span style={{ marginLeft: "20px" }}>
          Mean Regional Distribution of the BED Set
        </span>
        <BarChart
          width={380}
          height={250}
          data={this.state.data}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 35,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" interval={0} angle= "-45" textAnchor= "end"/>
          <YAxis
            label={{
              value: "Frequency (%)",
              angle: -90,
              position: "insideLeft",
              dy: 50
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
}

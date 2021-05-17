import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ErrorBar
} from 'recharts';

export default class Example extends React.Component {
  // static jsfiddleUrl = 'https://jsfiddle.net/alidingling/30763kr7/';

  constructor(props) {
    super();
    this.state = {
      data: [],
    };
  }

  async componentDidMount() {
    let data_value = []
    Object.entries(await this.props.stats).map(([key, value], index) => 
      data_value.push({ name: key, 
                        value: Number((value[0] * 100).toFixed(2)), 
                        std:[Number((value[0] * 100).toFixed(2))-Number((value[1] * 100).toFixed(2)),
                        Number((value[0] * 100).toFixed(2))+Number((value[1] * 100).toFixed(2))
                      ] 
                    }))
    console.log("BED set stats: ", data_value)
    this.setState({ data: data_value })
  }

  render() {
    return (
      <div style={{ marginTop: "20px" }}>
        <span style={{marginLeft: "80px" }}>Mean Regional Distribution of the BED Set</span>
        <BarChart
          width={400}
          height={300}
          data={this.state.data}
          margin={{
            top: 15, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft', offset: 10 }} />
          <Tooltip />
          <Bar dataKey="value" fill="teal" >
            <ErrorBar
              dataKey="std"
              width={2}
              strokeWidth={1}
              stroke="black"
              direction="y" />
          </Bar>
        </BarChart>
      </div>

    );
  }
}
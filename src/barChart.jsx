// import React from "react";

// function BarGroup(props) {
//     let barPadding = 2
//     let barColour = 'teal'
//     let widthScale = d => d * 10

//     let width = widthScale(props.d.value )
//     let yMid = props.barHeight * 0.5

//     return <g className="bar-group">
//       <text className="name-label" x="-6" y={yMid} alignmentBaseline="middle" >{props.d.name}</text>
//       <rect y={barPadding * 0.5} width={width} height={props.barHeight - barPadding} fill={barColour} />
//       <text className="value-label" x={width+40} y={yMid} alignmentBaseline="middle" >{props.d.value + "%"}</text>
//     </g>
//   }

//   export default class BarChart extends React.Component {
//     constructor(props) {
//         super();
//         this.state = {
//           data: [],
//         };
//       }

//     async componentDidMount(){
//           let data_value = []
//           console.log(await this.props.stats)
//           Object.entries(await this.props.stats).map(([key, value], index) => data_value.push({ name: key.match(/^[a-z0-9]+/), value: Number((value.Mean*100).toFixed(2)) }))
//           console.log(data_value)
//           this.setState({data:data_value})

//       }

//     render() {
//       let barHeight = 40

//       let barGroups = this.state.data.map((d, i) => <g transform={`translate(0, ${i * barHeight})`}>
//                                                       <BarGroup d={d} barHeight={barHeight} />
//                                                     </g>)                         

//       return <svg width="700" height="300" >
//         <g className="container">
//           <text className="title" x="20" y="15">Mean Regional Distribution of the BED Set</text>
//           <g className="chart" transform="translate(100,60)">
//             {barGroups}
//           </g>
//         </g>
//       </svg>
//     }
//   }

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
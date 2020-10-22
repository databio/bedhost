import React from "react";

function BarGroup(props) {
    let barPadding = 2
    let barColour = 'teal'
    let widthScale = d => d * 10
  
    let width = widthScale(props.d.value )
    let yMid = props.barHeight * 0.5
    
    return <g className="bar-group">
      <text className="name-label" x="-6" y={yMid} alignmentBaseline="middle" >{props.d.name}</text>
      <rect y={barPadding * 0.5} width={width} height={props.barHeight - barPadding} fill={barColour} />
      <text className="value-label" x={width+40} y={yMid} alignmentBaseline="middle" >{props.d.value + "%"}</text>
    </g>
  }
  
  export default class BarChart extends React.Component {
    constructor(props) {
        super();
        this.state = {
          data: [],
        };
      }
  
    async componentDidMount(){
          let data_value = []
          console.log(await this.props.stats)
          Object.entries(await this.props.stats).map(([key, value], index) => data_value.push({ name: key.match(/^[a-z0-9]+/), value: Number((value.Mean*100).toFixed(2)) }))
          console.log(data_value)
          this.setState({data:data_value})

      }

    render() {
      let barHeight = 40
          
      let barGroups = this.state.data.map((d, i) => <g transform={`translate(0, ${i * barHeight})`}>
                                                      <BarGroup d={d} barHeight={barHeight} />
                                                    </g>)                         
      
      return <svg width="700" height="300" >
        <g className="container">
          <text className="title" x="20" y="15">Mean Regional Distribution of the BED Set</text>
          <g className="chart" transform="translate(100,60)">
            {barGroups}
          </g>
        </g>
      </svg>
    }
  }
  
  
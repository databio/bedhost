import { useEffect, useRef } from 'react';
import embed from 'vega-embed';


export type MetricPlotType = 'bar' | 'pie';

type Props = {
  type: MetricPlotType;
  data: [string, number][];
  xlab?: string;
  ylab?: string;
  height?: number;
  color?: number;
};

const baseColors = [
  'rgb(94, 79, 162)',
  'rgb(67, 143, 180)',
  'rgb(119, 198, 167)',
  'rgb(190, 229, 160)',
  'rgb(240, 248, 169)',
  'rgb(254, 237, 161)',
  'rgb(253, 190, 112)',
  'rgb(244, 125, 77)',
  'rgb(214, 66, 75)',
  'rgb(158, 1, 66)'
];

// // Function to generate a color palette with the same length as the data
// const generateColorPalette = (dataLength: number): string[] => {

//   let colorPalette = [];

//   // If we need more colors than in our base palette,
//   // we'll cycle through with different opacities
//   const cycles = Math.ceil((dataLength - colorPalette.length) / baseColors.length);

//   for (let cycle = 0; cycle < cycles; cycle++) {
//     // For each cycle, adjust opacity slightly
//     const opacity = 0.6 - (cycle * 0.1);

//     for (let i = 0; i < baseColors.length; i++) {
//       if (colorPalette.length >= dataLength) break;

//       // Create a new color with adjusted opacity
//       const baseColor = baseColors[i];
//       const rgbPart = baseColor.substring(0, baseColor.lastIndexOf(','));
//       const newColor = `${rgbPart}, ${opacity})`;

//       colorPalette.push(newColor);
//     }
//   }

//   return colorPalette;
// };

// const ensureColorPalette = (data: [string, number][]): string[] => {
//   return generateColorPalette(data.length);
// };

const maxLength = 14; 

const barSpec = (data: any, xlab: string = '', ylab: string = '', height: number = 250, color = 0) => {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: {values: data.map((x: string[]) => ({
      label: x[0],
      value: x[1]
    }))},
    layer: [
      {
        mark: {type: "bar", cornerRadiusTopLeft: 1.5, cornerRadiusTopRight: 1.5},
        encoding: {
          x: {
            field: "label",
            type: "nominal",
            title: xlab,
            axis: {
              labelAngle: 33,
              labelExpr: `length(datum.value) > ${maxLength} ? substring(datum.value, 0, ${maxLength}) + '...' : datum.value`
            },
            sort: null
          },
          y: {
            field: "value",
            type: "quantitative",
            title: ylab,
            sort: null
          },
          color: {
            value: baseColors[color],
          },
          opacity: {value: 0.75},
          tooltip: [
            {field: "label", type: "nominal", title: xlab},
            {field: "value", type: "quantitative", title: ylab}
          ]
        },
      },
      {
        mark: {type: "text", dy: -7, fontSize: 8.5},
        encoding: {
          text: {
            field: "value",
            type: "quantitative",
            sort: null
          },
          x: {
            field: "label",
            type: "nominal",
            sort: null
          },
          y: {
            field: "value",
            type: "quantitative",
            sort: null
          },
          opacity: {value: 0.75},
        },
      }
    ],
    width: "container",
    height: height,
    config: {
      view: {
        cursor: "inherit"
      }
    }
  };
}


const pieSpec = (data: any, xlab: string = '', ylab: string = '', height: number = 222) => {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: {values: data.map((x: string[]) => ({
      label: x[0],
      value: x[1]
    }))},
    encoding: {
      theta: {
        field: "value",
        type: "quantitative",
        title: ylab, 
        sort: null,
        stack: true
      },
    },
    layer: [
      {
        mark: "arc",
        encoding: {
          color: {
            field: "label",
            type: "nominal",
            title: xlab,
            sort: null,
            scale: {
              scheme: "spectral",
              reverse: true
            },
          },
          order: {field: "value", type: "quantitative"},
          opacity: {value: 0.75},
          tooltip: [
            {field: "label", type: "nominal", title: xlab},
            {field: "value", type: "quantitative", title: ylab}
          ]
        },
      },
      {
        mark: {type: "text", fontSize: 8.5, radius: height/3},
        encoding: {
          text: {
            field: "value",
            type: "quantitative",
            sort: null
          },
          order: {field: "value", type: "quantitative"},
          opacity: {value: 0.75},
        },
      }
    ],
    width: "container",
    height: height,
    config: {
      view: {
        cursor: "inherit"
      }
    }
  };
}

export const MetricPlot = (props: Props) => {
  const { type, data, xlab, ylab, height, color } = props;

  const plotRef = useRef<HTMLDivElement>(null);
  const spec = type == 'bar' ? barSpec(data, xlab, ylab, height, color) : pieSpec(data, xlab, ylab, height)

  useEffect(() => {
    if (plotRef.current && spec) {   
      try {
        // @ts-ignore vega lite spec is fine
        embed(plotRef.current, spec)
        .catch(error => {
          console.error('Embed error after parsing:', error);
        });
      } catch (error) {
        console.error(error);
      }
    }
    
    return () => {
      if (plotRef.current) {
        plotRef.current.innerHTML = '';
      }
    };
  }, [spec]);


  return (
    <div className='w-100' ref={plotRef} />
  )
};

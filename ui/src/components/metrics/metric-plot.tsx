import { useEffect, useRef } from 'react';
import embed from 'vega-embed';


export type MetricPlotType = 'bar' | 'pie';

type Props = {
  type: MetricPlotType;
  data: [string, number][];
  xlab?: string;
  ylab?: string;
  height?: number;
};

const maxLength = 14; 

const barSpec = (data: any, xlab: string = '', ylab: string = '', height: number = 250) => {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: {values: data.map((x: string[]) => ({
      label: x[0],
      label_disp: x[0].length > maxLength ? x[0].substring(0, maxLength) + '...' : x[0],
      value: x[1]
    }))},
    layer: [
      {
        mark: {type: "bar", cornerRadiusTopLeft: 3, cornerRadiusTopRight: 3},
        encoding: {
          x: {
            field: "label_disp",
            type: "nominal",
            title: xlab,
            axis: {
              labelAngle: 33
            },
            sort: null
          },
          y: {
            field: "value",
            type: "quantitative",
            title: ylab,
            sort: null
          },
          opacity: {value: 0.88},
          tooltip: [
            {field: "label", type: "nominal", title: xlab},
            {field: "value", type: "quantitative", title: ylab}
          ]
        },
      },
      {
        mark: {type: "text", dy: 3},
        encoding: {
          text: {
            field: "value",
            type: "quantitative"
          },
          opacity: {value: 0.88},
        },
      }
    ],
    width: "container",
    height: height,
  };
}


const pieSpec = (data: any, xlab: string = '', ylab: string = '', height: number = 222) => {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: {values: data.map((x: string[]) => ({
      label: x[0],
      label_disp: x[0].length > maxLength ? x[0].substring(0, maxLength) + '...' : x[0],
      value: x[1]
    }))},
    layer: [
      {
        mark: "arc",
        encoding: {
          color: {
            field: "label",
            type: "nominal",
          },
          theta: {
            field: "value",
            type: "quantitative",
            title: ylab
          },
          opacity: {value: 0.88},
          tooltip: [
            {field: "label", type: "nominal", title: xlab},
            {field: "value", type: "quantitative", title: ylab}
          ]
        },
      },
      {
        mark: {type: "text"},
        encoding: {
          text: {
            field: "value",
            type: "quantitative"
          },
          opacity: {value: 0.88},
        },
      }
    ],
    width: "container",
    height: height,
  };
}

export const MetricPlot = (props: Props) => {
  const { type, data, xlab, ylab, height } = props;

  const plotRef = useRef<HTMLDivElement>(null);
  const spec = type == 'bar' ? barSpec(data, xlab, ylab, height) : pieSpec(data, xlab, ylab, height)

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

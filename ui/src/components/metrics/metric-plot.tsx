import { useEffect, useRef } from 'react';
import embed from 'vega-embed';

export type MetricPlotType = 'bar' | 'pie' | 'hist';

type Props = {
  type: MetricPlotType;
  data: [string, number][];
  median?: number;
  xlab?: string;
  ylab?: string;
  height?: number;
  color?: number;
  angle?: boolean;
  action?: boolean;
};

const baseColors = [
  'rgba(0, 128, 128,0.6)',
  'rgb(96,141,174)',  // dusty sky-blue
  'rgb(52,119,65)',  // Okabe-Ito “sky blue”✓
  'rgb(25,97,22)',  // Okabe-Ito “bluish green”✓
  'rgb(53,133,56)',  // soft teal
  'rgb( 84, 185, 147)',  // mint-teal
  'rgb(92,119,103)',
  'rgba(114,117,69,0.6)',// light sage
  'rgba(152,119,89,0.6)',
  'rgb(48,89,63)',  // pale moss
  'rgb(78,136,70)',  // misty mint-grey

];

const maxLength = 14;

const barSpec = (data: any, xlab: string = '', ylab: string = '', height: number = 250, color = 0, angle = true) => {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    data: {
      values: data.map((x: string[]) => ({
        label: x[0],
        value: x[1],
      })),
    },
    layer: [
      {
        mark: { type: 'bar', cornerRadiusTopLeft: 1.5, cornerRadiusTopRight: 1.5 },
        encoding: {
          x: {
            field: 'label',
            type: 'nominal',
            title: xlab,
            axis: {
              labelAngle: angle ? 33 : 90,
              labelExpr: `length(datum.value) > ${maxLength} ? substring(datum.value, 0, ${maxLength}) + '...' : datum.value`,
            },
            sort: null,
          },
          y: {
            field: 'value',
            type: 'quantitative',
            title: ylab,
            sort: null,
          },
          color: {
            value: baseColors[color],
          },
          opacity: { value: 0.75 },
          tooltip: [
            { field: 'label', type: 'nominal', title: xlab },
            { field: 'value', type: 'quantitative', title: ylab },
          ],
        },
      },
      {
        mark: { type: 'text', dy: -7, fontSize: 8.5 },
        encoding: {
          text: {
            field: 'value',
            type: 'quantitative',
            sort: null,
          },
          x: {
            field: 'label',
            type: 'nominal',
            sort: null,
          },
          y: {
            field: 'value',
            type: 'quantitative',
            sort: null,
          },
          opacity: { value: 0.75 },
        },
      },
    ],
    width: 'container',
    height: height,
    config: {
      view: {
        cursor: 'inherit',
      },
    },
  };
};

const pieSpec = (data: any, xlab: string = '', ylab: string = '', height: number = 222) => {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    data: {
      values: data.map((x: string[]) => ({
        label: x[0],
        value: x[1],
      })),
    },
    encoding: {
      theta: {
        field: 'value',
        type: 'quantitative',
        title: ylab,
        sort: null,
        stack: true,
      },
    },
    layer: [
      {
        mark: 'arc',
        encoding: {
          color: {
            field: 'label',
            type: 'nominal',
            title: xlab,
            sort: null,
            scale: {
              scheme: 'spectral',
              reverse: true,
            },
          },
          order: { field: 'value', type: 'quantitative' },
          opacity: { value: 0.75 },
          tooltip: [
            { field: 'label', type: 'nominal', title: xlab },
            { field: 'value', type: 'quantitative', title: ylab },
          ],
        },
      },
      {
        mark: { type: 'text', fontSize: 8.5, radius: height / 3 },
        encoding: {
          text: {
            field: 'value',
            type: 'quantitative',
            sort: null,
          },
          order: { field: 'value', type: 'quantitative' },
          opacity: { value: 0.75 },
        },
      },
    ],
    width: 'container',
    height: height,
    config: {
      view: {
        cursor: 'inherit',
      },
    },
  };
};

const histSpec = (data: any, median: number = 0, xlab: string = '', ylab: string = '', height: number = 250, color = 0, angle = true) => {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    data: {
      values: data.map((x: string[]) => ({
        label: x[0],
        value: x[1],
      })),
    },
    layer: [
      {
        mark: { type: 'bar', cornerRadiusTopLeft: 1.5, cornerRadiusTopRight: 1.5 },
        encoding: {
          x: {
            field: 'label',
            type: 'quantitative',
            title: xlab,
            axis: {
              labelAngle: angle ? 33 : 90,
              labelExpr: `length(datum.value) > ${maxLength} ? substring(datum.value, 0, ${maxLength}) + '...' : datum.value`,
            },
            sort: null,
            scale: { padding: 0 },
          },
          y: {
            field: 'value',
            type: 'quantitative',
            title: ylab,
            sort: null,
          },
          color: {
            value: baseColors[color],
          },
          opacity: { value: 0.75 },
          tooltip: [
            { field: 'label', type: 'quantitative', title: xlab },
            { field: 'value', type: 'quantitative', title: ylab },
          ],
        },
      },
      {
        mark: { type: 'rule', color: 'black' },
        encoding: {
          x: { datum: median },
        },
      },
      {
        mark: {
          type: 'text',
          dy: -20,
          // align: 'center',
          // baseline: 'bottom',
          // fontSize: 12,
          // color: 'black',
          // fontWeight: 'normal',
          // font: 'Arial, sans-serif'
        },
        encoding: {
          x: { datum: median },
          y: { value: 0 },
          text: { value: ['Median', '(' + median + ')'] },
        },
      },
      // {
      //   mark: {type: "text", dy: -7, fontSize: 8.5},
      //   encoding: {
      //     text: {
      //       field: "value",
      //       type: "quantitative",
      //       sort: null
      //     },
      //     x: {
      //       field: "label",
      //       type: "quantitative",
      //       sort: null
      //     },
      //     y: {
      //       field: "value",
      //       type: "quantitative",
      //       sort: null
      //     },
      //     opacity: {value: 0.75},
      //   },
      // }
    ],
    width: 'container',
    height: height,
    config: {
      view: {
        cursor: 'inherit',
      },
    },
  };
};

export const MetricPlot = (props: Props) => {
  const { type, data, median, xlab, ylab, height, color, angle, action } = props;

  const plotRef = useRef<HTMLDivElement>(null);
  const spec =
    type == 'bar' ? barSpec(data, xlab, ylab, height, color, angle) :
      type == 'pie' ? pieSpec(data, xlab, ylab, height) : histSpec(data, median, xlab, ylab, height, color, angle);


  useEffect(() => {
    if (plotRef.current && spec) {
      try {
        // @ts-ignore vega lite spec is fine
        embed(plotRef.current, spec, { 'actions': action })
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
    <div className="w-100" ref={plotRef} />
  );
};

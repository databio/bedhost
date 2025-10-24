import { useEffect, useRef } from 'react';
import embed from 'vega-embed';


interface Props {
  xlab?: string;
  ylab?: string;
  height?: number;
  color?: number;
  angle?: boolean;
  maxLength?: number;
}

const distributionSpec = (data: any, props: Props = {}) => {
  const { xlab = 'Label', ylab = 'Value', height = 300, color = 0, angle = false, maxLength = 15 } = props;

  // Transform data to match the new schema requirements
  const transformedData = data.map((item: any, index: number) => ({
    chr: item.chr,
    withinGroupID: item.rid,
    N: item.n,
    start: item.start,
    end: item.end,
  }));

  return {
    $schema: 'https://vega-github.io/schema/vega-lite/v6.json',
    config: {
      axis: {
        grid: false,
      },
      facet: {
        spacing: -1,
      },
      view: {
        continuousHeight: 300,
        continuousWidth: 300,
        strokeWidth: 0,
        cursor: 'inherit',
      },
    },
    data: {
      values: transformedData,
    },
    encoding: {
      row: {
        field: 'chr',
        header: {
          labelAlign: 'right',
          labelAngle: 0,
          labelOrient: 'right',
          labelPadding: 5,
        },
        sort: [
          'chr1', 'chr2', 'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8', 'chr9', 'chr10',
          'chr11', 'chr12', 'chr13', 'chr14', 'chr15', 'chr16', 'chr17', 'chr18', 'chr19', 'chr20',
          'chr21', 'chr22', 'chrX', 'chrY', 'chrM',
        ],
        title: 'Number of Regions',
        type: 'ordinal',
      },
      x: {
        axis: {
          // labelExpr: 'datum.value == 0 ? \'start\' : datum.value == 183 ? \'end\' : \'\'',
          values: [0, 300.0],
        },
        field: 'withinGroupID',
        scale: {
          domain: [0, 300.0],
        },
        title: 'Genome',
        type: 'quantitative',
      },
      y: {
        axis: {
          values: [10.0, 20.0, 30.0],
        },
        field: 'N',
        title: '',
        type: 'quantitative',
      },
    },
    height: 25,
    mark: {
      cornerRadiusEnd: 0.5,
      type: 'bar',
      width: 2.5,
    },
    width: 750,
  };
};

export const ChromosomeBarPlot = (props: Props) => {
  const { data, xlab, ylab, height, color, action } = props;

  const plotRef = useRef<HTMLDivElement>(null);
  const spec = distributionSpec(data, { xlab, ylab, height, color });

  useEffect(() => {
    if (plotRef.current && spec) {
      try {
        embed(plotRef.current as HTMLDivElement, spec as any, { 'actions': action })
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
  }, [spec, action]);

  return (
    <div className="w-100" ref={plotRef} />
  );
};

export default ChromosomeBarPlot;

import { useEffect, useRef } from 'react';
import embed from 'vega-embed';

interface Props {
  data?: any;
  xlab?: string;
  ylab?: string;
  height?: number;
  color?: any;
  maxLength?: any;
  action?: boolean;
}

const distributionSpec = (data: any, props: Props = {}) => {
  const { xlab = 'Label', ylab = 'Value', height = 1000, color = 'rgba(0, 128, 128, 0.6)', maxLength = 'container' } = props;

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
    title: {
      text: 'Region Distribution Plot',
      fontSize: 24,
      fontWeight: 'bold',
      anchor: 'middle',
      offset: 10,
    },
    config: {
      axis: {
        grid: false,
      },
      facet: {
        spacing: -1,
        labelFontSize: 12,
        titleFontSize: 12,
      },
      header: {
        labelFontSize: 12,
        titleFontSize: 16,
      },
      view: {
        continuousHeight: height,
        continuousWidth: 300,
        strokeWidth: 0,
        cursor: 'inherit',
      },
      bar: {
        continuousBandSize: 2.5,
      },
    },
    data: {
      values: transformedData,
    },
    encoding: {
      row: {
        field: 'chr',
        header: {
          labelAlign: 'left',
          labelAngle: 0,
          labelOrient: 'left',
          labelPadding: 10,
        },
        sort: [
          'chr1', 'chr2', 'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8', 'chr9', 'chr10',
          'chr11', 'chr12', 'chr13', 'chr14', 'chr15', 'chr16', 'chr17', 'chr18', 'chr19', 'chr20',
          'chr21', 'chr22', 'chrX', 'chrY', 'chrM',
        ],
        title: 'Number of Regions',
        type: 'ordinal',
        color: {
          value: color,
        },
      },
      x: {
        axis: {
          labelExpr: 'datum.value == 0 ? \'start\' : datum.value == 183 ? \'end\' : \'\'',
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
        axis: null,
        field: 'N',
        title: '',
        type: 'quantitative',
      },
    },
    height: 25,
    mark: {
      cornerRadiusEnd: -0.5,
      type: 'bar',
      width: 2.5,
      color: color,
    },
    width: maxLength,
    autosize: {
      type: 'fit',
      contains: 'padding'
    }
  };
};

export const RegionDistributionPlot = (props: Props) => {
  const { data, xlab, ylab, height = 1000, color, action } = props;

  const plotRef = useRef<HTMLDivElement>(null);
  const spec = distributionSpec(data, { xlab, ylab, height, color });

  useEffect(() => {
    const element = plotRef.current;
    if (element && spec) {
      try {
        embed(element, spec as any, { 'actions': action })
          .catch(error => {
            console.error('Embed error after parsing:', error);
          });
      } catch (error) {
        console.error(error);
      }
    }

    return () => {
      if (element) {
        element.innerHTML = '';
      }
    };
  }, [spec, action]);

  return (
    <div className="w-100" ref={plotRef} />
  );
};

export default RegionDistributionPlot;
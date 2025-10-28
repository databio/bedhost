import { useEffect, useRef } from 'react';
import embed from 'vega-embed';

const COLOR = 'rgba(0, 128, 128, 1)';

type DistributionSpecDataPoint = {
  chr: string;
  start: number;
  end: number;
  n: number;
  
}

interface BedPlotsProps {
  data: DistributionSpecDataPoint[];
}

const distributionSpec = (data: DistributionSpecDataPoint[]) => {

  // Transform data to match the new schema requirements
  const transformedData = data.map((item: DistributionSpecDataPoint, i: number) => ({
    chr: item.chr,
    withinGroupID: i,
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
        grid: true,
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
        title: "Chromosome",
        field: 'chr',
        header: {
          labelAlign: 'right',
          labelAngle: 0,
          labelOrient: 'right',
          labelPadding: 10,
        },
        sort: [
          'chr1', 'chr2', 'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8', 'chr9', 'chr10',
          'chr11', 'chr12', 'chr13', 'chr14', 'chr15', 'chr16', 'chr17', 'chr18', 'chr19', 'chr20',
          'chr21', 'chr22', 'chrX', 'chrY', 'chrM',
        ],
        type: 'ordinal',
        color: {
          value: COLOR,
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
        title: 'Chromosome',
        type: 'quantitative',
      },
    },
    height: 25,
    mark: {
      cornerRadiusEnd: -0.5,
      type: 'bar',
      width: 2.5,
      color: COLOR,
    },
    width: 'container',
    autosize: {
      type: 'fit',
      contains: 'padding',
    },
  };
};

export const RegionDistributionPlot = (props: BedPlotsProps) => {
  const { data } = props;

  const plotRef = useRef<HTMLDivElement>(null);
  const spec = distributionSpec(data);

  useEffect(() => {
    const element = plotRef.current;
    if (element && spec) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        embed(element, spec as any, {
          actions: { export: true, source: false, compiled: false },
          renderer: 'svg',
        })
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
  }, [spec]);

  return (
    <div className="d-flex w-100 border border-primary" style={{ overflow: 'auto', maxHeight: '800px' }}>
      <div className="mx-auto chrom-dist-plot-container pt-5" ref={plotRef} />
    </div>
  );
};

export default RegionDistributionPlot;
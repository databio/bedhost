import { useEffect, useRef, useState } from 'react';
import embed from 'vega-embed';

const COLOR = 'rgba(0, 128, 128, 1)';

type DistributionSpecDataPoint = {
  chr: string;
  start: number;
  end: number;
  n: number;
  rid: number;
};

interface BedPlotsProps {
  data: DistributionSpecDataPoint[];
}

const STANDARD_CHR_ORDER = [
  'chr1', 'chr2', 'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8', 'chr9', 'chr10',
  'chr11', 'chr12', 'chr13', 'chr14', 'chr15', 'chr16', 'chr17', 'chr18', 'chr19',
  'chr20', 'chr21', 'chr22', 'chrX', 'chrY', 'chrM',
];

const getChromosomeSort = (data: DistributionSpecDataPoint[]): string[] => {
  const uniqueChrs = [...new Set(data.map((d) => d.chr))];
  const standardSet = new Set(STANDARD_CHR_ORDER);

  // Separate known and unknown chromosomes
  const knownChrs = uniqueChrs.filter((chr) => standardSet.has(chr));
  const unknownChrs = uniqueChrs.filter((chr) => !standardSet.has(chr));

  // Sort known chromosomes by standard order
  knownChrs.sort((a, b) => STANDARD_CHR_ORDER.indexOf(a) - STANDARD_CHR_ORDER.indexOf(b));

  // Sort unknown chromosomes alphabetically with numeric awareness
  unknownChrs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  return [...knownChrs, ...unknownChrs];
};

const distributionSpec = (data: DistributionSpecDataPoint[]) => {
  const transformedData = data.map((item: DistributionSpecDataPoint) => ({
    chr: item.chr,
    withinGroupID: item.rid,
    N: item.n,
    start: item.start,
    end: item.end,
  }));
  const sortOrder = getChromosomeSort(data);
  return {
    $schema: 'https://vega-github.io/schema/vega-lite/v6.json',
    // title: {
    //   text: 'Region Distribution Plot',
    //   fontSize: 24,
    //   fontWeight: 'bold',
    //   anchor: 'middle',
    //   offset: 10,
    // },
    config: {
      axis: {
        grid: false,
      },
      facet: {
        spacing: -1,
      },
      view: {
        strokeWidth: 0,
        cursor: 'inherit',
      },
      // bar: {
      //   continuousBandSize: 2.5,
      // },
    },
    data: {
      values: transformedData,
    },
    encoding: {
      row: {
        title: 'Chromosome',
        field: 'chr',
        header: {
          labelAlign: 'left',
          labelAngle: 0,
          labelOrient: 'left',
          labelPadding: 5,
          labelBaseline: 'top',
          labelFontSize: 9,
        },
        sort: sortOrder,
        type: 'ordinal',
        color: {
          value: COLOR,
        },
      },
      x: {
        axis: {
          labelExpr: 'datum.value == 0 ? \'start\' : datum.value == 300 ? \'end\' : \'\'',
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
          labels: false,
          ticks: false,
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
      color: COLOR,
    },
  };
};

export const RegionDistributionPlot = (props: BedPlotsProps) => {
  const { data } = props;

  const plotRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (plotRef.current) {
        const width = plotRef.current.offsetWidth * 0.8;
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const element = plotRef.current;
    if (element && containerWidth > 0) {
      const spec = {
        ...distributionSpec(data),
        width: containerWidth,
      };

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        embed(element, spec as any, {
          actions: { export: true, source: false, compiled: false },
          renderer: 'svg',
        }).catch((error) => {
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
  }, [containerWidth, data]);

  return (
    <div
      className="d-flex w-100 border justify-content-between overflow-auto bg-white rounded"
      style={{ maxHeight: '800px', minWidth: 0 }}
    >
      <div className="my-3 mx-4 pt-4 pb-1 w-100" ref={plotRef} />
    </div>
  );
};

export default RegionDistributionPlot;

import { useEffect, useRef } from 'react';
import embed from 'vega-embed';

type StatsEntry = {
  chromosome: string;
  count: number;
  end: number;
  maximum: number;
  mean: string;
  median: string;
  minimum: number;
  start: number;
};

type Props = {
  statsEntries: StatsEntry[];
  width: number;
};

const COLOR = 'rgba(0, 128, 128, 1)';

const RegionCountsPlot = ({ statsEntries, width }: Props) => {
  const plotRef = useRef<HTMLDivElement | null>(null);

  const regionCountsSpec = (statsEntries: StatsEntry[]) => {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
      data: {
        values: statsEntries,
      },
      layer: [
        {
          mark: {
            type: 'bar',
            fill: COLOR,
            cornerRadiusEnd: 2,
            height: {
              band: 0.8,
            },
          },
          encoding: {
            x: {
              field: 'count',
              type: 'quantitative',
              title: 'Count',
              sort: false,
              axis: {
                orient: 'bottom',
              },
            },
            y: {
              field: 'chromosome',
              type: 'nominal',
              title: 'Chromosome',
              sort: [
                'chr1',
                'chr2',
                'chr3',
                'chr4',
                'chr5',
                'chr6',
                'chr7',
                'chr8',
                'chr9',
                'chr10',
                'chr11',
                'chr12',
                'chr13',
                'chr14',
                'chr15',
                'chr16',
                'chr17',
                'chr18',
                'chr19',
                'chr20',
                'chr21',
                'chr22',
                'chrX',
                'chrY',
                'chrM',
              ],
              axis: {
                labelFontSize: 9,
              },
            },
          },
        },
        {
          mark: {
            type: 'rule',
            opacity: 0,
          },
          encoding: {
            x: {
              field: 'count',
              type: 'quantitative',
              title: null,
              axis: {
                orient: 'top',
                labels: true,
                ticks: true,
                domain: true,
              },
            },
          },
        },
      ],
      width: width * 0.91,
      height: statsEntries.length * 11,
    };
  };

  useEffect(() => {
    if (plotRef.current && statsEntries) {
      const spec = regionCountsSpec(statsEntries);
      try {
        embed(plotRef.current, spec as any, {
          actions: true,
          config: {},
        }).catch((error) => {
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
  }, [statsEntries]);

  return <div className='w-100 pt-4' ref={plotRef} />;
};

export { RegionCountsPlot };

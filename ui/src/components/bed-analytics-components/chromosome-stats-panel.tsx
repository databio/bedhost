import { useState, useEffect, useRef } from 'react';
import { ChromosomeStatistics, RegionSet } from '@databio/gtars';
import { RegionCountsPlot } from './region-counts-plot';

interface Props {
  rs: RegionSet;
  selectedFile: File | undefined;
}

const ChromosomeStatsPanel = ({ rs, selectedFile }: Props) => {
  const calc = rs.chromosomeStatistics();
  if (!calc) return null;

  const plotRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (plotRef.current) {
        const width = plotRef.current.offsetWidth - 120;
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const statsEntries = Array.from(calc.entries()).map((entry) => {
    const [chrom, stats] = entry as [unknown, ChromosomeStatistics];
    const cs = stats as ChromosomeStatistics;
    const row = {
      chromosome: String(chrom),
      count: cs.number_of_regions,
      minimum: cs.minimum_region_length,
      maximum: cs.maximum_region_length,
      mean: cs.mean_region_length.toFixed(2),
      median: cs.median_region_length.toFixed(2),
      start: cs.start_nucleotide_position,
      end: cs.end_nucleotide_position,
    };
    try {
      (cs as unknown as { free?: () => void }).free?.();
    } catch (e) {
      /* ignore */
    }
    return row;
  });

  return (
    <div>
      <div className='mb-3 w-100'>
        <h6>Number of regions per chromosome: </h6>
        <div className='border rounded bg-white overflow-hidden w-100' ref={plotRef}>
          <div className='overflow-auto px-4 py-2 w-100' style={{ maxHeight: 400 }}>
            {containerWidth > 0 && <RegionCountsPlot statsEntries={statsEntries} width={containerWidth} />}
          </div>
        </div>
      </div>

      <div className='d-flex flex-column gap-2 overflow-auto'>
        <div className='d-flex justify-content-between align-items-end'>
          <h6 className='mb-0'>Chromosome regions statistics: </h6>
          <div>
            <button
              className='btn btn-sm btn-secondary'
              onClick={() => {
                const headers = [
                  'Chromosome name',
                  'number of regions',
                  'start position',
                  'end position',
                  'min region width',
                  'max region width',
                  'mean region width',
                  'median region width',
                ];
                const rows = statsEntries.map((s) => [
                  s.chromosome,
                  String(s.count),
                  String(s.start),
                  String(s.end),
                  String(s.minimum),
                  String(s.maximum),
                  String(s.mean),
                  String(s.median),
                ]);
                const csv = [headers, ...rows]
                  .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedFile?.name ?? 'regions'}-stats.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >
              Download CSV
            </button>
          </div>
        </div>
        <div className='p-0 border rounded bg-white overflow-hidden'>
          <div className='table-responsive overflow-auto' style={{ maxHeight: '500px' }}>
            <table className='table table-sm text-sm mb-2'>
              <thead>
                <tr>
                  <th className='text-nowrap'>Chromosome name</th>
                  <th className='text-nowrap'>Number of regions</th>
                  <th className='text-nowrap'>Start position</th>
                  <th className='text-nowrap'>End position</th>
                  <th className='text-nowrap'>Min length</th>
                  <th className='text-nowrap'>Max length</th>
                  <th className='text-nowrap'>Mean length</th>
                  <th className='text-nowrap'>Median length</th>
                </tr>
              </thead>
              <tbody>
                {statsEntries.map((s) => (
                  <tr key={s.chromosome}>
                    <th scope='row'>{s.chromosome}</th>
                    <td>{s.count}</td>
                    <td>{s.start}</td>
                    <td>{s.end}</td>
                    <td>{s.minimum}</td>
                    <td>{s.maximum}</td>
                    <td>{s.mean}</td>
                    <td>{s.median}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChromosomeStatsPanel;

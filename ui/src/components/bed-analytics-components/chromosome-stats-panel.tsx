import React from 'react';

// Type for pre-computed chromosome statistics from worker
interface ChromosomeStats {
  chromosome: string;
  number_of_regions: number;
  minimum_region_length: number;
  maximum_region_length: number;
  mean_region_length: number;
  median_region_length: number;
  start_nucleotide_position: number;
  end_nucleotide_position: number;
}

interface Props {
  chromosomeStatistics: Record<string, ChromosomeStats>;
  selectedFile: File | null;
}

const ChromosomeStatsPanel: React.FC<Props> = ({ chromosomeStatistics, selectedFile }) => {
  if (!chromosomeStatistics) return null;

  const statsEntries = Object.entries(chromosomeStatistics)
    .map(([chrom, stats]) => ({
      chromosome: chrom,
      count: stats.number_of_regions,
      minimum: stats.minimum_region_length,
      maximum: stats.maximum_region_length,
      mean: stats.mean_region_length.toFixed(2),
      median: stats.median_region_length.toFixed(2),
      start: stats.start_nucleotide_position,
      end: stats.end_nucleotide_position,
    }))
    .sort((a, b) =>
      a.chromosome.localeCompare(b.chromosome, undefined, { numeric: true, sensitivity: 'base' })
    );

  return (
    <div>
      <div className="p-3 border rounded bg-white shadow-sm" style={{ maxHeight: '500px', overflow: 'auto' }}>
        <div className="d-flex flex-column gap-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Chromosome regions statatistics</h5>
            <div>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  const headers = ['Chromosome name', 'number of regions', 'start position', 'end position', 'min region width', 'max region width', 'mean region width', 'median region width'];
                  const rows = statsEntries.map(s => [
                    s.chromosome,
                    String(s.count),
                    String(s.start),
                    String(s.end),
                    String(s.minimum),
                    String(s.maximum),
                    String(s.mean),
                    String(s.median),
                  ]);
                  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
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

          <table className="table table-sm small mb-0">
            <thead>
            <tr>
              <th>Chromosome name</th>
              <th>Number of regions</th>
              <th>Start position</th>
              <th>End position</th>
              <th>Min length</th>
              <th>Max length</th>
              <th>Mean length</th>
              <th>Median length</th>
            </tr>
            </thead>
            <tbody>
            {statsEntries.map((s) => (
              <tr key={s.chromosome}>
                <th scope="row">{s.chromosome}</th>
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
  );
};

export default ChromosomeStatsPanel;

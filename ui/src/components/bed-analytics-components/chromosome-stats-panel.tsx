import React from 'react';
import { ChromosomeStats, RegionSet } from '@databio/gtars';

interface Props {
  Rs: RegionSet;
  selectedFile: File | null;
}

const ChromosomeStatsPanel: React.FC<Props> = ({ Rs, selectedFile }) => {
  const calc = Rs.calculate_statistics?.();
  if (!calc) return null;

  const statsEntries = Array.from(calc.entries())
    .map(([chrom, stats]: [unknown, ChromosomeStats]) => {
      const cs = stats as ChromosomeStats;
      const row = {
        chromosome: String(chrom),
        count: cs.count,
        minimum: cs.minimum,
        maximum: cs.maximum,
        mean: cs.mean.toFixed(2),
        median: cs.median.toFixed(2),
        start: cs.start,
        end: cs.end,
      };
      try {
        (cs as unknown as { free?: () => void }).free?.();
      } catch (e) {
        /* ignore */
      }
      return row;
    })
    .sort((a, b) =>
      a.chromosome.localeCompare(b.chromosome, undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );

  return (
    <div>
      <div className="mb-3 w-100 overflow-auto">
        <h5>Number of regions per chromosome: </h5>
        <div className="d-inline-block">
          <svg
            width="100%"
            height="160"
            viewBox={`0 0 ${Math.max(300, statsEntries.length * 60)} 160`}
            preserveAspectRatio="xMidYMid meet"
          >
            {(() => {
              const barWidth = 36;
              const gap = 24;
              const maxCount = Math.max(...statsEntries.map(s => s.count), 1);
              const chartHeight = 100;
              return statsEntries.map((s, i) => {
                const x = i * (barWidth + gap) + 16;
                const barH = Math.round((s.count / maxCount) * chartHeight);
                const y = 20 + (chartHeight - barH);
                return (
                  <g key={s.chromosome}>
                    <rect x={x} y={y} width={barWidth} height={barH} rx={4} fill="#0d6efd" />
                    <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="10" fill="#000">
                      {s.count}
                    </text>
                    <text x={x + barWidth / 2} y={140} textAnchor="middle" fontSize="10" fill="#333">
                      {s.chromosome}
                    </text>
                  </g>
                );
              });
            })()}
            <line x1="8" y1="20" x2={Math.max(300, statsEntries.length * 60) - 8} y2="20" stroke="#e9ecef" />
          </svg>
        </div>
      </div>

      <div className="p-3 border rounded bg-white shadow-sm" style={{ maxHeight: '500px', overflow: 'auto' }}>
        <div className="d-flex flex-column gap-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Chromosome regions statatistics</h5>
            <div>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  const headers = ['chromosome', 'count', 'start', 'end', 'min', 'max', 'mean', 'median'];
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
              <th>Chromosome</th>
              <th>Count</th>
              <th>Start</th>
              <th>End</th>
              <th>Min</th>
              <th>Max</th>
              <th>Mean</th>
              <th>Median</th>
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
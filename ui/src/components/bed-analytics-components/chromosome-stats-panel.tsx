import React from 'react';
import { ChromosomeStats, RegionSet } from '@databio/gtars';

interface Props {
  rs: RegionSet;
  selectedFile: File | null;
}

const ChromosomeStatsPanel: React.FC<Props> = ({ rs, selectedFile }) => {
  const calc = rs.calculate_statistics?.();
  if (!calc) return null;

  const statsEntries = Array.from(calc.entries())
    .map(([chrom, stats]: [unknown, ChromosomeStats]) => {
      const cs = stats as ChromosomeStats;
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
    })
    .sort((a, b) =>
      a.chromosome.localeCompare(b.chromosome, undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );

  return (
    <div>
      {/*This section is AI rendered. It provides statistics on number of regions per chromosome.*/}
      <div className="mb-3 w-100">
        <h5>Number of regions per chromosome: </h5>
        <div className="border rounded p-2 bg-light" style={{ overflowX: 'auto'}}>
          <svg
            width={Math.max(400, statsEntries.length * 70)}
            height="180"
            viewBox={`0 0 ${Math.max(400, statsEntries.length * 70)} 180`}
            preserveAspectRatio="xMidYMid meet"
            style={{ minWidth: '400px' }}
          >
            {(() => {
              const barWidth = 40;
              const gap = 30;
              const maxCount = Math.max(...statsEntries.map(s => s.count), 1);
              const chartHeight = 120;
              const chartTop = 30;

              return (
                <g>
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                    <g key={ratio}>
                      <line
                        x1="15"
                        y1={chartTop + (1 - ratio) * chartHeight}
                        x2={Math.max(400, statsEntries.length * 70) - 15}
                        y2={chartTop + (1 - ratio) * chartHeight}
                        stroke="#e9ecef"
                        strokeDasharray={ratio === 0 ? 'none' : '2,2'}
                      />
                      <text
                        x="10"
                        y={chartTop + (1 - ratio) * chartHeight + 3}
                        textAnchor="end"
                        fontSize="9"
                        fill="#666"
                      >
                        {Math.round(maxCount * ratio)}
                      </text>
                    </g>
                  ))}

                  {/* Bars */}
                  {statsEntries.map((s, i) => {
                    const x = i * (barWidth + gap) + 40;
                    const barH = Math.max(2, Math.round((s.count / maxCount) * chartHeight));
                    const y = chartTop + (chartHeight - barH);

                    return (
                      <g key={s.chromosome}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barH}
                          rx={3}
                          fill="#0d6efd"
                          stroke="#0856d1"
                          strokeWidth="0.5"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#000"
                          fontWeight="500"
                        >
                          {s.count}
                        </text>
                        <text
                          x={x + barWidth / 2}
                          y={chartTop + chartHeight + 20}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#333"
                          fontWeight="500"
                        >
                          {s.chromosome}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
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
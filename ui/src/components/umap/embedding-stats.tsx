import { useEffect, useMemo, useState } from 'react';
import { useMosaicCoordinator } from '../../contexts/mosaic-coordinator-context';

type Props = {
  selectedPoints: any[];
  colorGrouping: string;
  legendItems: any[];
  filterSelection: any;
};

export const EmbeddingStats = (props: Props) => {
  const { selectedPoints, colorGrouping, legendItems, filterSelection } = props;
  const { coordinator } = useMosaicCoordinator();

  const [totalCounts, setTotalCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!coordinator || legendItems.length === 0) return;
    const query = `SELECT ${colorGrouping} as category, COUNT(*) as count FROM data GROUP BY ${colorGrouping}`;
    coordinator.query(query, { type: 'json' }).then((result: any) => {
      const map = new Map<string, number>();
      for (const row of result) {
        map.set(row.category, Number(row.count));
      }
      setTotalCounts(map);
    }).catch(() => {});
  }, [coordinator, colorGrouping, legendItems.length]);

  const hasSelection = selectedPoints.length > 0;

  const rows = useMemo(() => {
    if (hasSelection) {
      const counts = new Map<string, number>();
      for (const p of selectedPoints) {
        const cat = p[colorGrouping] ?? p.category;
        if (cat != null) {
          counts.set(cat, (counts.get(cat) || 0) + 1);
        }
      }
      return legendItems.map((item) => ({
        name: item.name,
        category: item.category,
        count: counts.get(item.category) || 0,
      }));
    }
    if (filterSelection) {
      return legendItems.map((item) => ({
        name: item.name,
        category: item.category,
        count: item.category === filterSelection.category ? (totalCounts.get(item.category) ?? 0) : 0,
      }));
    }
    return legendItems.map((item) => ({
      name: item.name,
      category: item.category,
      count: totalCounts.get(item.category) ?? 0,
    }));
  }, [selectedPoints, colorGrouping, legendItems, hasSelection, totalCounts, filterSelection]);

  const showBackground = hasSelection || !!filterSelection;
  const maxTotal = useMemo(() => Math.max(1, ...legendItems.map((item) => totalCounts.get(item.category) ?? 0)), [legendItems, totalCounts]);
  const maxRows = useMemo(() => Math.max(1, ...rows.map((r) => r.count)), [rows]);
  const maxCount = showBackground ? maxTotal : maxRows;

  return (
    <div className='border card bg-white'>
      <div className='card-header border-bottom text-xs fw-semibold bg-white'>
        Selection Count
      </div>
      <div className='card-body' style={{ padding: '12px 12px 12px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rows.map((row) => {
            const total = totalCounts.get(row.category) ?? 0;
            return (
              <div
                key={row.category}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 20 }}
              >
                <span
                  style={{
                    width: 80,
                    flexShrink: 0,
                    fontSize: 11,
                    textAlign: 'right',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={row.name}
                >
                  {row.name}
                </span>
                <div style={{ flex: 1, height: 16, position: 'relative' }}>
                  {showBackground && total > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        width: `${(total / maxTotal) * 100}%`,
                        height: '100%',
                        backgroundColor: 'steelblue',
                        opacity: 0.15,
                        borderRadius: 2.2,
                      }}
                    />
                  )}
                  {row.count > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        width: `${(row.count / maxCount) * 100}%`,
                        height: '100%',
                        backgroundColor: 'steelblue',
                        borderRadius: 2.2,
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 10,
                    color: '#6c757d',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.count} / {total}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

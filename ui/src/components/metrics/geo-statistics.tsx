import { MetricPlot, MetricPlotType } from './metric-plot.tsx';

interface GeoStatisticsProps {
  detailedStats: any;
  onMetricModalOpen: (props: {
    title: string;
    type: MetricPlotType;
    data: [string, number][];
    median?: number;
    xlab?: string;
    ylab?: string;
    height?: number;
    color?: number;
    angle?: boolean;
  }) => void;
}

const transformHistogramData = (bins: (string | number)[], counts: number[]): [string, number][] => {
  return counts.map((count, index) => {
    const binLabel = typeof bins[index] === 'number' ? String(bins[index]) : '';
    return [binLabel, Number(count)];
  });
};

export const GeoStatistics = ({ detailedStats, onMetricModalOpen }: GeoStatisticsProps) => {
  return (
    <>
      <div className='row mt-2'>
        <h4 className='fw-semibold'>GEO Statistics</h4>
      </div>

      {detailedStats && (
        <div className='row h-100 g-2'>
          <div className='col-sm-12 col-md-6 d-flex flex-column gap-2'>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'Cumulative BED File Count in GEO',
                  type: 'bar',
                  data: Object.entries(detailedStats?.geo?.cumulative_number_of_files || {}),
                  xlab: 'Year',
                  ylab: 'Number of BED Files',
                  color: 4,
                })
              }
            >
              <h6 className='fw-semibold'>Cumulative BED File Count in GEO</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(detailedStats?.geo?.cumulative_number_of_files || {})}
                xlab='Year'
                ylab='Number of BED Files'
                color={4}
                action={false}
              />
            </div>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED file Size in GEO',
                  type: 'hist',
                  data: transformHistogramData(
                    Array.isArray(detailedStats?.geo?.file_sizes?.bins) ? detailedStats?.geo?.file_sizes?.bins : [],
                    Array.isArray(detailedStats?.geo?.file_sizes?.counts) ? detailedStats?.geo?.file_sizes?.counts : [],
                  ),
                  xlab: 'File Size (MB)',
                  ylab: 'Counts',
                  color: 8,
                  angle: false,
                })
              }
            >
              <h6 className='fw-semibold'>BED File Size in GEO</h6>
              <MetricPlot
                type='hist'
                data={transformHistogramData(
                  Array.isArray(detailedStats?.geo?.file_sizes?.bins) ? detailedStats?.geo?.file_sizes?.bins : [],
                  Array.isArray(detailedStats?.geo?.file_sizes?.counts) ? detailedStats?.geo?.file_sizes?.counts : [],
                )}
                xlab='File Size (MB)'
                ylab='Counts'
                color={8}
                angle={false}
                action={false}
              />
            </div>
          </div>

          <div className='col-sm-12 col-md-6 d-flex flex-column gap-2'>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED File Count in GEO',
                  type: 'bar',
                  data: Object.entries(detailedStats?.geo?.number_of_files || {}),
                  xlab: 'Year',
                  ylab: 'Number of BED Files',
                  color: 1,
                })
              }
            >
              <h6 className='fw-semibold'>BED File Count in GEO</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(detailedStats?.geo?.number_of_files || {})}
                xlab='Year'
                ylab='Number of BED Files'
                color={1}
                action={false}
              />
            </div>
          </div>

          <div className='col-sm-12 col-md-12 mt-4 text-sm'>
            <i className='text-primary bi bi-info-circle-fill '></i>
            <i> Some small inconsistencies in GEO data may occur due to the way BEDbase is processing GEO data.</i>
          </div>
        </div>
      )}
    </>
  );
};

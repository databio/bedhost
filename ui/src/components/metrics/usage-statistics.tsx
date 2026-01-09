import { MetricPlot, MetricPlotType } from './metric-plot.tsx';

interface UsageStatisticsProps {
  usageStats: any;
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

export const UsageStatistics = ({ usageStats, onMetricModalOpen }: UsageStatisticsProps) => {
  return (
    <>
      <div className='row mt-2'>
        <h4 className='fw-semibold'>BEDbase Usage Statistics</h4>
      </div>

      {usageStats && (
        <div className='row h-100 g-2'>
          <div className='col-sm-12 col-md-6 d-flex flex-column gap-2'>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED Files Popularity',
                  type: 'bar',
                  data: Object.entries(usageStats?.bed_metadata || {}),
                  xlab: 'BED ID',
                  ylab: 'Times Accessed',
                  color: 3,
                })
              }
            >
              <h6 className='fw-semibold'>BED File Popularity</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(usageStats?.bed_metadata || {})}
                xlab='BED ID'
                ylab='Times Accessed'
                color={3}
                action={false}
              />
            </div>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED Search Terms',
                  type: 'bar',
                  data: Object.entries(usageStats?.bed_search_terms || {}),
                  xlab: 'BED Search Query',
                  ylab: 'Number of BED Files',
                  color: 8,
                })
              }
            >
              <h6 className='fw-semibold'>BED Search Terms</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(usageStats?.bed_search_terms || {})}
                xlab='BED Search Query'
                ylab='Number of Searches'
                color={8}
                action={false}
              />
            </div>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED file downloads',
                  type: 'bar',
                  data: Object.entries(usageStats?.bed_downloads || {}),
                  xlab: 'BED file id',
                  ylab: 'Number of Downloads',
                  color: 2,
                })
              }
            >
              <h6 className='fw-semibold'>BED file downloads</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(usageStats?.bed_downloads || {})}
                xlab='BED file id'
                ylab='Number of Downloads'
                color={2}
                action={false}
              />
            </div>
          </div>

          <div className='col-sm-12 col-md-6 d-flex flex-column gap-2'>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BEDset Popularity',
                  type: 'bar',
                  data: Object.entries(usageStats?.bedset_metadata || {}),
                  xlab: 'BEDset ID',
                  ylab: 'Number of BED Files',
                  color: 7,
                })
              }
            >
              <h6 className='fw-semibold'>BEDset Popularity</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(usageStats?.bedset_metadata || {})}
                xlab='BEDset ID'
                ylab='Times Accessed'
                color={7}
                action={false}
              />
            </div>

            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BEDset Search Term',
                  type: 'bar',
                  data: Object.entries(usageStats?.bedset_search_terms || {}),
                  xlab: 'BEDset Search Query',
                  ylab: 'Number of BED Files',
                  color: 9,
                })
              }
            >
              <h6 className='fw-semibold'>BEDset Search Terms</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(usageStats?.bedset_search_terms || {})}
                xlab='BEDset Search Query'
                ylab='Number of Searches'
                color={9}
                action={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

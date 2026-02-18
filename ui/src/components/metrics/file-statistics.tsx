import { MetricPlot, MetricPlotType } from './metric-plot.tsx';

interface FileStatisticsProps {
  bedbaseStats: any;
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

export const FileStatistics = ({ bedbaseStats, detailedStats, onMetricModalOpen }: FileStatisticsProps) => {
  return (
    <>
      <div className='row mt-2 mb-2'>
        <h4 className='fw-semibold'>BEDbase File Statistics</h4>
        <div className='col-sm-12 col-md-12'>
          <ul className='list-group w-100'>
            <li className='list-group-item d-flex justify-content-between align-items-center'>
              Number of bed files available:
              <span className='badge bg-primary rounded-pill'>
                {(bedbaseStats?.bedfiles_number || 0).toLocaleString()}
              </span>
            </li>
            <li className='list-group-item d-flex justify-content-between align-items-center'>
              Number of bed sets available:
              <span className='badge bg-success rounded-pill'>
                {(bedbaseStats?.bedsets_number || 0).toLocaleString()}
              </span>
            </li>
            <li className='list-group-item d-flex justify-content-between align-items-center'>
              Number of genomes available:
              <span className='badge bg-info rounded-pill'>{(bedbaseStats?.genomes_number || 0).toLocaleString()}</span>
            </li>
          </ul>
        </div>
      </div>

      {detailedStats && (
        <div className='row h-100 g-2'>
          <div className='col-sm-12 col-md-6 d-flex flex-column gap-2'>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED Files by Genome',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_genome || {}),
                  xlab: 'Reference Genome',
                  ylab: 'Number of BED Files',
                  color: 0,
                })
              }
            >
              <h6 className='fw-semibold'>BED Files by Genome</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(detailedStats?.file_genome || {})}
                xlab='Reference Genome'
                ylab='Number of BED Files'
                color={0}
                action={false}
              />
            </div>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED Files by BED Compliance',
                  type: 'bar',
                  data: Object.entries(detailedStats?.bed_compliance || {}),
                  xlab: 'Compliance Type',
                  ylab: 'Number of BED Files',
                  color: 2,
                })
              }
            >
              <h6 className='fw-semibold'>BED Files by BED Compliance</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(detailedStats?.bed_compliance || {})}
                xlab='Compliance Type'
                ylab='Number of BED Files'
                color={2}
                action={false}
              />
            </div>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED Files by Assay Type',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_assay || {}),
                  xlab: 'Assay Type',
                  ylab: 'Number of BED Files',
                  color: 3,
                })
              }
            >
              <h6 className='fw-semibold'>BED Files by Assay Type</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(detailedStats?.file_assay || {})}
                xlab='Assay Type'
                ylab='Number of BED Files'
                color={6}
                action={false}
              />
            </div>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED Comments',
                  type: 'pie',
                  data: Object.entries(detailedStats?.bed_comments || {}),
                  xlab: 'Comment Type',
                  ylab: 'Number of BED Files',
                  color: 4,
                })
              }
            >
              <h6 className='fw-semibold'>BED Files by BED Comments</h6>
              <MetricPlot
                type='pie'
                data={Object.entries(detailedStats?.bed_comments || {})}
                xlab='Comment Type'
                ylab='Number of BED Files'
                color={4}
                action={false}
                height={300}
              />
            </div>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED File Size Histogram',
                  type: 'hist',
                  data: transformHistogramData(
                    Array.isArray(detailedStats?.file_size?.bins) ? detailedStats.file_size.bins : [],
                    Array.isArray(detailedStats?.file_size?.counts) ? detailedStats.file_size.counts : [],
                  ),
                  median: detailedStats?.file_size?.median,
                  xlab: 'File Size (MB)',
                  ylab: 'Counts',
                  color: 6,
                  angle: false,
                })
              }
            >
              <h6 className='fw-semibold'>BED File Size Histogram</h6>
              <MetricPlot
                type='hist'
                data={transformHistogramData(
                  Array.isArray(detailedStats?.file_size?.bins) ? detailedStats.file_size.bins : [],
                  Array.isArray(detailedStats?.file_size?.counts) ? detailedStats.file_size.counts : [],
                )}
                median={detailedStats?.file_size?.median}
                xlab='File Size (MB)'
                ylab='Counts'
                color={6}
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
                  title: 'BED Files by Data Format',
                  type: 'pie',
                  data: Object.entries(detailedStats?.data_format || {}),
                  xlab: 'Data Format',
                  ylab: 'Number of BED Files',
                  color: 1,
                })
              }
            >
              <h6 className='fw-semibold'>BED Files by Data Format</h6>
              <MetricPlot
                type='pie'
                data={Object.entries(detailedStats?.data_format || {})}
                xlab='Data Format'
                ylab='Number of BED Files'
                color={1}
                action={false}
                height={300}
              />
            </div>

            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED Files by Organism',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_organism || {}),
                  xlab: 'Organism',
                  ylab: 'Number of BED Files',
                  color: 3,
                })
              }
            >
              <h6 className='fw-semibold'>BED Files by Organism</h6>
              <MetricPlot
                type='bar'
                data={Object.entries(detailedStats?.file_organism || {})}
                xlab='Organism'
                ylab='Number of BED Files'
                color={3}
                action={false}
              />
            </div>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED GEO Processing Status',
                  type: 'pie',
                  data: Object.entries(detailedStats?.geo_status || {}),
                  xlab: 'BED GEO processing status',
                  ylab: 'Number of BED Files',
                  color: 5,
                })
              }
            >
              <h6 className='fw-semibold'>BED GEO Processing Status</h6>
              <MetricPlot
                type='pie'
                data={Object.entries(detailedStats?.geo_status || {})}
                xlab='BED GEO Processing Status'
                ylab='Number of BED Files'
                color={5}
                action={false}
                height={300}
              />
            </div>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED Number of Regions Histogram',
                  type: 'hist',
                  data: transformHistogramData(
                    Array.isArray(detailedStats?.number_of_regions?.bins) ? detailedStats.number_of_regions.bins : [],
                    Array.isArray(detailedStats?.number_of_regions?.counts)
                      ? detailedStats.number_of_regions.counts
                      : [],
                  ),
                  median: detailedStats?.number_of_regions?.median,
                  xlab: 'Number of Regions',
                  ylab: 'Counts',
                  color: 7,
                  angle: false,
                })
              }
            >
              <h6 className='fw-semibold'>BED Number of Regions Histogram</h6>
              <MetricPlot
                type='hist'
                data={transformHistogramData(
                  Array.isArray(detailedStats?.number_of_regions?.bins) ? detailedStats.number_of_regions.bins : [],
                  Array.isArray(detailedStats?.number_of_regions?.counts) ? detailedStats.number_of_regions.counts : [],
                )}
                median={detailedStats?.number_of_regions?.median}
                xlab='Number of Regions'
                ylab='Counts'
                color={7}
                angle={false}
                action={false}
              />
            </div>
            <div
              className='border rounded genome-card cursor-pointer p-3 metric-plot-height bg-white'
              onClick={() =>
                onMetricModalOpen({
                  title: 'BED Mean Region Width Histogram',
                  type: 'hist',
                  data: transformHistogramData(
                    Array.isArray(detailedStats?.mean_region_width?.bins) ? detailedStats.mean_region_width.bins : [],
                    Array.isArray(detailedStats?.mean_region_width?.counts)
                      ? detailedStats.mean_region_width.counts
                      : [],
                  ),
                  median: detailedStats?.mean_region_width?.median,
                  xlab: 'Mean Region Width',
                  ylab: 'Counts',
                  color: 8,
                  angle: false,
                })
              }
            >
              <h6 className='fw-semibold'>BED Mean Region Width Histogram</h6>
              <MetricPlot
                type='hist'
                data={transformHistogramData(
                  Array.isArray(detailedStats?.mean_region_width?.bins) ? detailedStats.mean_region_width.bins : [],
                  Array.isArray(detailedStats?.mean_region_width?.counts) ? detailedStats.mean_region_width.counts : [],
                )}
                median={detailedStats?.mean_region_width?.median}
                xlab='Mean Region Width'
                ylab='Counts'
                color={8}
                angle={false}
                action={false}
              />
            </div>
          </div>

          <div className='col-sm-12 col-md-12 mt-4 text-sm'>
            <i className='text-primary bi bi-info-circle-fill '></i>
            <i>
              {' '}
              Data Format and BED compliance are calculated based on BED classification pipeline.
              <br />
              BED compliance refers to the representation of a BED file as `bedn+m`.
              <br />
              Data Format is assignment of region set files to one of the formats: `bed`, `narrow_peak`, `broadpeak` and
              others`.
              <br />
              More information: <a href={'https://docs.bedbase.org/bedbase/user/bed_classification/'}> BEDbase Docs </a>
            </i>
          </div>
        </div>
      )}
    </>
  );
};

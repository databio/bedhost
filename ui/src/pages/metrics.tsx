import { useState } from 'react';
import { Layout } from '../components/layout.tsx';
import { Col, Row, Container } from 'react-bootstrap';

import { useStats } from '../queries/useStats.ts';
import { useDetailedStats } from '../queries/useDetailedStats.ts';
import { useDetailedUsage } from '../queries/useDetailedUsage.ts';
import { MetricPlot, MetricPlotType } from '../components/metrics/metric-plot.tsx';
import { MetricModal } from '../components/modals/metric-modal.tsx';
import { CardSkeleton } from '../components/skeletons/card-skeleton';
import { EndpointsModal } from '../components/modals/endpoints-modal.tsx';

const API_BASE = import.meta.env.VITE_API_BASE || '';
export const PRIMARY_COLOR = 'rgba(0, 128, 128,0.6)';

interface MetricModalProps {
  title: string;
  type: MetricPlotType;
  data: [string, number][];
  median?: number;
  xlab?: string;
  ylab?: string;
  height?: number;
  color?: number;
  angle?: boolean;
}

const transformHistogramData = (bins: (string | number)[], counts: number[]): [string, number][] => {
  return counts.map((count, index) => {
    const binLabel = typeof bins[index] === 'number' ? String(bins[index]) : '';
    return [binLabel, Number(count)];
  });
};

export const Metrics = () => {
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [metricModalTitle, setMetricModalTitle] = useState('');
  const [metricModalType, setMetricModalType] = useState<MetricPlotType>('bar');
  const [metricModalData, setMetricModalData] = useState<[string, number][]>([]);
  const [metricModalMedian, setMetricModalMedian] = useState(0);
  const [metricModalXlab, setMetricModalXlab] = useState('');
  const [metricModalYlab, setMetricModalYlab] = useState('');
  const [metricModalHeight, setMetricModalHeight] = useState(400);
  const [metricModalColor, setMetricModalColor] = useState(1);
  const [metricModalAngle, setMetricModalAngle] = useState(true);
  const [endpointsModalShow, setEndpointsModalShow] = useState(false);

  const setMetricModalProps = ({
                                 title,
                                 type,
                                 data,
                                 median = 0,
                                 xlab = '',
                                 ylab = '',
                                 height = 400,
                                 color = 1,
                                 angle = true,
                               }: MetricModalProps): void => {
    setMetricModalTitle(title);
    setMetricModalType(type);
    setMetricModalData(data);
    setMetricModalMedian(median);
    setMetricModalXlab(xlab);
    setMetricModalYlab(ylab);
    setMetricModalHeight(height);
    setMetricModalColor(color);
    setMetricModalAngle(angle);
    setShowMetricModal(true);
  };


  const { data: bedbaseStats } = useStats();
  const { data: detailedStats, isLoading: statsIsLoading } = useDetailedStats();
  const { data: usageStats, isLoading: usageIsLoading } = useDetailedUsage();

  if (statsIsLoading || usageIsLoading) {
    return (
      <Layout title="BEDbase" footer>
        <div className="my-2">
          <Row>
            <Col sm={12} md={12}>
              <div className="mb-2">
                <CardSkeleton height="200px" />
              </div>
            </Col>
          </Row>
          <Row>
            <Col sm={5} md={5}>
              <div className="mb-2">
                <CardSkeleton height="300px" />
              </div>
              <div className="mb-2">
                <CardSkeleton height="300px" />
              </div>
            </Col>
            <Col sm={7} md={7}>
              <CardSkeleton height="100%" />
            </Col>
          </Row>
        </div>
      </Layout>
    );
  }
  ;

  return (
    <Layout footer title="BEDbase" fullHeight>
      <Container fluid>
        <Row className="mt-3">
          <Col sm={12} md={6}>
            <h3 className="fw-bold">Metrics</h3>
          </Col>
          <Col sm={12} md={6} className="d-flex justify-content-end">
            <span>
              <button className="btn btn-outline-primary btn-sm" onClick={() => setEndpointsModalShow(true)}>
                <i className="bi bi-info-circle me-1" />
                API
              </button>
            </span>
          </Col>
        </Row>

        <Row className="mt-3">
          <h4 className="fw-semibold">BEDbase File Statistics</h4>
          <Col sm={12} md={12}>
            <ul className="list-group w-100 shadow-sm">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                Number of bed files available:
                <span
                  className="badge bg-primary rounded-pill">{(bedbaseStats?.bedfiles_number || 0).toLocaleString()}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                Number of bed sets available:
                <span
                  className="badge bg-success rounded-pill">{(bedbaseStats?.bedsets_number || 0).toLocaleString()}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                Number of genomes available:
                <span
                  className="badge bg-info rounded-pill">{(bedbaseStats?.genomes_number || 0).toLocaleString()}</span>
              </li>
            </ul>
          </Col>
        </Row>

        {detailedStats && (
          <Row className="h-100 mt-1 g-2">
            <Col sm={12} md={6} className="d-flex flex-column gap-2">
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Genome',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_genome || {}),
                  xlab: 'Reference Genome',
                  ylab: 'Number of BED Files',
                  color: 0,
                })}
              >
                <h6 className="fw-semibold">BED Files by Genome</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.file_genome || {})}
                  xlab="Reference Genome"
                  ylab="Number of BED Files"
                  color={0}
                  action={false}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED Files by BED Compliance',
                  type: 'bar',
                  data: Object.entries(detailedStats?.bed_compliance || {}),
                  xlab: 'Compliance Type',
                  ylab: 'Number of BED Files',
                  color: 2,
                })}
              >
                <h6 className="fw-semibold">BED Files by BED Compliance</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.bed_compliance || {})}
                  xlab="Compliance Type"
                  ylab="Number of BED Files"
                  color={2}
                  action={false}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Assay Type',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_assay || {}),
                  xlab: 'Assay Type',
                  ylab: 'Number of BED Files',
                  color: 3,
                })}
              >
                <h6 className="fw-semibold">BED Files by Assay Type</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.file_assay || {})}
                  xlab="Assay Type"
                  ylab="Number of BED Files"
                  color={6}
                  action={false}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED Comments',
                  type: 'bar',
                  data: Object.entries(detailedStats?.bed_comments || {}),
                  xlab: 'Comment Type',
                  ylab: 'Number of BED Files',
                  color: 4,
                })}
              >
                <h6 className="fw-semibold">BED Files by BED Comments</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.bed_comments || {})}
                  xlab="Comment Type"
                  ylab="Number of BED Files"
                  color={4}
                  action={false}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
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
                })}
              >
                <h6 className="fw-semibold">BED File Size Histogram</h6>
                <MetricPlot
                  type="hist"
                  data={transformHistogramData(
                    Array.isArray(detailedStats?.file_size?.bins) ? detailedStats.file_size.bins : [],
                    Array.isArray(detailedStats?.file_size?.counts) ? detailedStats.file_size.counts : [],
                  )}
                  median={detailedStats?.file_size?.median}
                  xlab="File Size (MB)"
                  ylab="Counts"
                  color={6}
                  angle={false}
                  action={false}
                />
              </div>

            </Col>

            <Col sm={12} md={6} className="d-flex flex-column gap-2">
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Data Format',
                  type: 'pie',
                  data: Object.entries(detailedStats?.data_format || {}),
                  xlab: 'Data Format',
                  ylab: 'Number of BED Files',
                  color: 1,
                })}
              >
                <h6 className="fw-semibold">BED Files by Data Format</h6>
                <MetricPlot
                  type="pie"
                  data={Object.entries(detailedStats?.data_format || {})}
                  xlab="Data Format"
                  ylab="Number of BED Files"
                  color={1}
                  action={false}
                  height={375}
                />
              </div>

              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Organism',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_organism || {}),
                  xlab: 'Organism',
                  ylab: 'Number of BED Files',
                  color: 3,
                })}
              >
                <h6 className="fw-semibold">BED Files by Organism</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.file_organism || {})}
                  xlab="Organism"
                  ylab="Number of BED Files"
                  color={3}
                  action={false}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED GEO processing status',
                  type: 'bar',
                  data: Object.entries(detailedStats?.geo_status || {}),
                  xlab: 'BED GEO processing status',
                  ylab: 'Number of BED Files',
                  color: 5,
                })}
              >
                <h6 className="fw-semibold">BED GEO processing status</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.geo_status || {})}
                  xlab="BED GEO processing status"
                  ylab="Number of BED Files"
                  color={5}
                  action={false}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED Number of Regions Histogram',
                  type: 'hist',
                  data: transformHistogramData(
                    Array.isArray(detailedStats?.number_of_regions?.bins) ? detailedStats.number_of_regions.bins : [],
                    Array.isArray(detailedStats?.number_of_regions?.counts) ? detailedStats.number_of_regions.counts : [],
                  ),
                  median: detailedStats?.number_of_regions?.median,
                  xlab: 'Number of Regions',
                  ylab: 'Counts',
                  color: 7,
                  angle: false,
                })}
              >
                <h6 className="fw-semibold">BED Number of Regions Histogram</h6>
                <MetricPlot
                  type="hist"
                  data={transformHistogramData(
                    Array.isArray(detailedStats?.number_of_regions?.bins) ? detailedStats.number_of_regions.bins : [],
                    Array.isArray(detailedStats?.number_of_regions?.counts) ? detailedStats.number_of_regions.counts : [],
                  )}
                  median={detailedStats?.number_of_regions?.median}
                  xlab="Number of Regions"
                  ylab="Counts"
                  color={7}
                  angle={false}
                  action={false}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED Mean Region Width Histogram',
                  type: 'hist',
                  data: transformHistogramData(
                    Array.isArray(detailedStats?.mean_region_width?.bins) ? detailedStats.mean_region_width.bins : [],
                    Array.isArray(detailedStats?.mean_region_width?.counts) ? detailedStats.mean_region_width.counts : [],
                  ),
                  median: detailedStats?.mean_region_width?.median,
                  xlab: 'Mean Region Width',
                  ylab: 'Counts',
                  color: 8,
                  angle: false,
                })}
              >
                <h6 className="fw-semibold">BED Mean Region Width Histogram</h6>
                <MetricPlot
                  type="hist"
                  data={transformHistogramData(
                    Array.isArray(detailedStats?.mean_region_width?.bins) ? detailedStats.mean_region_width.bins : [],
                    Array.isArray(detailedStats?.mean_region_width?.counts) ? detailedStats.mean_region_width.counts : [],
                  )}
                  median={detailedStats?.mean_region_width?.median}
                  xlab="Mean Region Width"
                  ylab="Counts"
                  color={8}
                  angle={false}
                  action={false}
                />
              </div>
            </Col>
            <Col sm={12} md={12} className="mt-2 text-s">
              <i className="text-primary bi bi-info-circle-fill "></i>
              <i> Data Format and BED compliance are calculated based on BED classification pipeline.
                <br />BED compliance refers to the representation of a BED file as `bedn+m`.
                <br />Data Format is assignment of region set files to one of the formats: `bed`, `narrow_peak`,
                `broadpeak
                and others`.
                <br />More information: <a href={'https://docs.bedbase.org/bedbase/user/bed_classification/'}> BEDbase
                  Docs </a>
              </i>
            </Col>
            <hr />
            <h4 className="fw-semibold mb-0">GEO statistics</h4>

            <Col sm={12} md={6} className="d-flex flex-column gap-2">

              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'Cumulative number of bed files in GEO',
                  type: 'bar',
                  data: Object.entries(detailedStats?.geo?.cumulative_number_of_files || {}),
                  xlab: 'Year',
                  ylab: 'Number of BED Files',
                  color: 4,
                })}
              >
                <h6 className="fw-semibold">Cumulative number of bed files in GEO</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.geo?.cumulative_number_of_files || {})}
                  xlab="Year"
                  ylab="Number of BED Files"
                  color={4}
                  action={false}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED file size in GEO',
                  type: 'hist',
                  data: transformHistogramData(
                    Array.isArray(detailedStats?.geo?.file_sizes?.bins) ? detailedStats?.geo?.file_sizes?.bins : [],
                    Array.isArray(detailedStats?.geo?.file_sizes?.counts) ? detailedStats?.geo?.file_sizes?.counts : [],
                  ),
                  // median: detailedStats?.geo?.file_sizes?.median, // median is too big
                  xlab: 'File Size (MB)',
                  ylab: 'Counts',
                  color: 8,
                  angle: false,
                })}
              >
                <h6 className="fw-semibold">BED File size in GEO</h6>
                <MetricPlot
                  type="hist"
                  data={transformHistogramData(
                    Array.isArray(detailedStats?.geo?.file_sizes?.bins) ? detailedStats?.geo?.file_sizes?.bins : [],
                    Array.isArray(detailedStats?.geo?.file_sizes?.counts) ? detailedStats?.geo?.file_sizes?.counts : [],
                  )}
                  // median={detailedStats?.geo?.file_sizes?.median} // median is too big
                  xlab="File Size (MB)"
                  ylab="Counts"
                  color={8}
                  angle={false}
                  action={false}
                />
              </div>

            </Col>
            <Col sm={12} md={6} className="d-flex flex-column gap-2">

              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'Number of bed files in GEO',
                  type: 'bar',
                  data: Object.entries(detailedStats?.geo?.number_of_files || {}),
                  xlab: 'Year',
                  ylab: 'Number of BED Files',
                  color: 1,
                })}
              >
                <h6 className="fw-semibold">Number of bed files in GEO</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.geo?.number_of_files || {})}
                  xlab="Year"
                  ylab="Number of BED Files"
                  color={1}
                  action={false}
                />
              </div>
            </Col>
            <Col sm={12} md={12} className="mt-2 text-s">
              <i className="text-primary bi bi-info-circle-fill "></i>
              <i> Some small inconsistencies in GEO data may occur due to the way BEDbase is processing GEO data.
              </i>
            </Col>
          </Row>

        )}

        {usageStats && (
          <Row className="h-100 mt-4 pt-2 g-2 mb-5">
            <hr />
            <h4 className="fw-semibold mb-0">BEDbase Usage Statistics</h4>
            <Col sm={12} md={6} className="d-flex flex-column gap-2">
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED Files Popularity',
                  type: 'bar',
                  data: Object.entries(usageStats?.bed_metadata || {}),
                  xlab: 'BED ID',
                  ylab: 'Times Accessed',
                  color: 3,
                })}
              >
                <h6 className="fw-semibold">BED File Popularity</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(usageStats?.bed_metadata || {})}
                  xlab="BED ID"
                  ylab="Times Accessed"
                  color={3}
                  action={false}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED Search Terms',
                  type: 'bar',
                  data: Object.entries(usageStats?.bed_search_terms || {}),
                  xlab: 'BED Search Query',
                  ylab: 'Number of BED Files',
                  color: 8,
                })}
              >
                <h6 className="fw-semibold">BED Search Terms</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(usageStats?.bed_search_terms || {})}
                  xlab="BED Search Query"
                  ylab="Number of Searches"
                  color={8}
                  action={false}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BED file downloads',
                  type: 'bar',
                  data: Object.entries(usageStats?.bed_downloads || {}),
                  xlab: 'BED file id',
                  ylab: 'Number of Downloads',
                  color: 2,
                })}
              >
                <h6 className="fw-semibold">BED file downloads</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(usageStats?.bed_downloads || {})}
                  xlab="BED file id"
                  ylab="Number of Downloads"
                  color={2}
                  action={false}
                />
              </div>
            </Col>

            <Col sm={12} md={6} className="d-flex flex-column gap-2">
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BEDset Popularity',
                  type: 'bar',
                  data: Object.entries(usageStats?.bedset_metadata || {}),
                  xlab: 'BEDset ID',
                  ylab: 'Number of BED Files',
                  color: 7,
                })}
              >
                <h6 className="fw-semibold">BEDset Popularity</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(usageStats?.bedset_metadata || {})}
                  xlab="BEDset ID"
                  ylab="Times Accessed"
                  color={7}
                  action={false}
                />
              </div>

              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm metric-plot-height"
                onClick={() => setMetricModalProps({
                  title: 'BEDset Search Term',
                  type: 'bar',
                  data: Object.entries(usageStats?.bedset_search_terms || {}),
                  xlab: 'BEDset Search Query',
                  ylab: 'Number of BED Files',
                  color: 9,
                })}
              >
                <h6 className="fw-semibold">BEDset Search Terms</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(usageStats?.bedset_search_terms || {})}
                  xlab="BEDset Search Query"
                  ylab="Number of Searches"
                  color={9}
                  action={false}
                />
              </div>
            </Col>
          </Row>
        )}

        {showMetricModal && (
          <MetricModal
            title={metricModalTitle}
            type={metricModalType}
            data={metricModalData}
            median={metricModalMedian}
            xlab={metricModalXlab}
            ylab={metricModalYlab}
            height={metricModalHeight}
            color={metricModalColor}
            angle={metricModalAngle}
            show={showMetricModal}
            onHide={() => setShowMetricModal(false)}
          />
        )}

        <EndpointsModal
          titles={['Detailed Stats', 'Detailed Usage']}
          endpoints={[`${API_BASE}/detailed-stats`, `${API_BASE}/detailed-usage`]}
          show={endpointsModalShow}
          onHide={() => setEndpointsModalShow(false)}
        />

      </Container>
    </Layout>
  );
};

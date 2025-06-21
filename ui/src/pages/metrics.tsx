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
  xlab?: string;
  ylab?: string;
  height?: number;
  color?: number;
}

export const Metrics = () => {
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [metricModalTitle, setMetricModalTitle] = useState('');
  const [metricModalType, setMetricModalType] = useState<MetricPlotType>('bar');
  const [metricModalData, setMetricModalData] = useState<[string, number][]>([]);
  const [metricModalXlab, setMetricModalXlab] = useState('');
  const [metricModalYlab, setMetricModalYlab] = useState('');
  const [metricModalHeight, setMetricModalHeight] = useState(400);
  const [metricModalColor, setMetricModalColor] = useState(1);
  const [endpointsModalShow, setEndpointsModalShow] = useState(false);

  const setMetricModalProps = ({
                                 title,
                                 type,
                                 data,
                                 xlab = '',
                                 ylab = '',
                                 height = 400,
                                 color = 1,
                               }: MetricModalProps): void => {
    setMetricModalTitle(title);
    setMetricModalType(type);
    setMetricModalData(data);
    setMetricModalXlab(xlab);
    setMetricModalYlab(ylab);
    setMetricModalHeight(height);
    setMetricModalColor(color);
    setShowMetricModal(true);
  };

  const { data: bedbaseStats } = useStats();
  const { data: detailedStats, isLoading: statsIsLoading } = useDetailedStats();
  const { data: usageStats, isLoading: usageIsLoading} = useDetailedUsage();

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
          <h5 className="fw-semibold">BEDbase File Statistics</h5>
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
                className="border rounded genome-card cursor-pointer p-3 shadow-sm"
                style={{height: 400}}
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Genome',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_genome || {}),
                  xlab: 'Reference Genome',
                  ylab: 'Number of BED Files',
                  color: 0
                })}
              >
                <h6 className="fw-semibold">BED Files by Genome</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.file_genome || {})}
                  xlab="Reference Genome"
                  ylab="Number of BED Files"
                  color={0}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm"
                style={{height: 400}}
                onClick={() => setMetricModalProps({
                  title: 'BED Files by BED Compliance',
                  type: 'bar',
                  data: Object.entries(detailedStats?.bed_compliance || {}),
                  xlab: 'Compliance Type',
                  ylab: 'Number of BED Files',
                  color: 2
                })}
              >
                <h6 className="fw-semibold">BED Files by BED Compliance</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.bed_compliance || {})}
                  xlab="Compliance Type"
                  ylab="Number of BED Files"
                  color={2}
                />
              </div>
            </Col>

            <Col sm={12} md={6} className="d-flex flex-column gap-2">
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm"
                style={{height: 400}}
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Data Format',
                  type: 'bar',
                  data: Object.entries(detailedStats?.data_format || {}),
                  xlab: 'Data Format',
                  ylab: 'Number of BED Files',
                  color: 1
                })}
              >
                <h6 className="fw-semibold">BED Files by Data Format</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(detailedStats?.data_format || {})}
                  xlab="Data Format"
                  ylab="Number of BED Files"
                  color={1}
                />
              </div>

              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm"
                style={{height: 400}}
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Organism',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_organism || {}),
                  xlab: 'Organism',
                  ylab: 'Number of BED Files',
                  color: 3
                })}
              >
                <h6 className="fw-semibold">BED Files by Organism</h6>
                  <MetricPlot
                    type="bar"
                    data={Object.entries(detailedStats?.file_organism || {})}
                    xlab="Organism"
                    ylab="Number of BED Files"
                    color={3}
                  />
              </div>
            </Col>
          </Row>
        )}

        <Col sm={12} md={12} className="mt-2 text-xs">
          <i className="text-primary bi bi-info-circle-fill "></i>
          <i> Data Format and BED compliance are calculated based on BED classification pipeline.
            <br />BED compliance refers to the representation of a BED file as `bedn+m`.
            <br />Data Format is assignment of region set files to one of the formats: `bed`, `narrow_peak`, `broadpeak
            and others`.
            <br />More information: <a href={'https://docs.bedbase.org/bedbase/user/bed_classification/'}> BEDbase
              Docs </a>
          </i>

        </Col>

        {usageStats && (
          <Row className="h-100 mt-4 pt-2 g-2 mb-5">
            <h5 className="fw-semibold mb-0">BEDbase Usage Statistics</h5>
            <Col sm={12} md={6} className="d-flex flex-column gap-2">
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm"
                style={{height: 400}}
                onClick={() => setMetricModalProps({
                  title: 'BED Files Popularity',
                  type: 'bar',
                  data: Object.entries(usageStats?.bed_metadata || {}),
                  xlab: 'BED ID',
                  ylab: 'Times Accessed',
                  color: 6
                })}
              >
                <h6 className="fw-semibold">BED File Popularity</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(usageStats?.bed_metadata || {})}
                  xlab='BED ID'
                  ylab="Times Accessed"
                  color={6}
                />
              </div>
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm"
                style={{height: 400}}
                onClick={() => setMetricModalProps({
                  title: 'BED Search Terms',
                  type: 'bar',
                  data: Object.entries(usageStats?.bed_search_terms || {}),
                  xlab: 'BED Search Query',
                  ylab: 'Number of BED Files',
                  color: 8
                })}
              >
                <h6 className="fw-semibold">BED Search Terms</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(usageStats?.bed_search_terms || {})}
                  xlab='BED Search Query'
                  ylab="Number of Searches"
                  color={8}
                />
              </div>
            </Col>

            <Col sm={12} md={6} className="d-flex flex-column gap-2">
              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm"
                style={{height: 400}}
                onClick={() => setMetricModalProps({
                  title: 'BEDset Popularity',
                  type: 'bar',
                  data: Object.entries(usageStats?.bedset_metadata || {}),
                  xlab: 'BEDset ID',
                  ylab: 'Number of BED Files',
                  color: 7
                })}
              >
                <h6 className="fw-semibold">BEDset Popularity</h6>
                <MetricPlot
                  type="bar"
                  data={Object.entries(usageStats?.bedset_metadata || {})}
                  xlab='BEDset ID'
                  ylab="Times Accessed"
                  color={7}
                />
              </div>

              <div
                className="border rounded genome-card cursor-pointer p-3 shadow-sm"
                style={{height: 400}}
                onClick={() => setMetricModalProps({
                  title: 'BEDset Search Term',
                  type: 'bar',
                  data: Object.entries(usageStats?.bedset_search_terms || {}),
                  xlab: 'BEDset Search Query',
                  ylab: 'Number of BED Files',
                  color: 9
                })}
              >
                <h6 className="fw-semibold">BEDset Search Terms</h6>
                  <MetricPlot
                    type="bar"
                    data={Object.entries(usageStats?.bedset_search_terms || {})}
                    xlab='BEDset Search Query'
                    ylab="Number of Searches"
                    color={9}
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
            xlab={metricModalXlab}
            ylab={metricModalYlab}
            height={metricModalHeight}
            color={metricModalColor}
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

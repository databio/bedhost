import { useState } from 'react';
import { Layout } from '../components/layout.tsx';
import { Col,  Row, Container } from 'react-bootstrap';

import { useStats } from '../queries/useStats.ts';
import { useDetailedStats } from '../queries/useDetailedStats.ts';
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
  dataLabel?: string;
  backgroundColor: string[];
  borderWidth: number;
  sliceIndex: number;
}

export const Metrics = () => {
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [metricModalTitle, setMetricModalTitle] = useState('');
  const [metricModalType, setMetricModalType] = useState<MetricPlotType>('bar');
  const [metricModalData, setMetricModalData] = useState<[string, number][]>([]);
  const [metricModalDataLabel, setMetricModalDataLabel] = useState('');
  const [metricModalBackgroundColor, setMetricModalBackgroundColor] = useState<string[]>([]);
  const [metricModalBorderWidth, setMetricModalBorderWidth] = useState(0);
  const [metricModalSliceIndex, setMetricModalSliceIndex] = useState(0);
  const [endpointsModalShow, setEndpointsModalShow] = useState(false);

  const setMetricModalProps = ({ title, type, data, dataLabel = '', backgroundColor, borderWidth, sliceIndex }: MetricModalProps): void => {
    setMetricModalTitle(title);
    setMetricModalType(type);
    setMetricModalData(data);
    setMetricModalDataLabel(dataLabel);
    setMetricModalBackgroundColor(backgroundColor);
    setMetricModalBorderWidth(borderWidth);
    setMetricModalSliceIndex(sliceIndex);
    setShowMetricModal(true);
  };

  const { data: bedbaseStats } = useStats();
  const { data: detailedStats, isLoading } = useDetailedStats();

  console.log(detailedStats)

  const sliceIndex = 5;

    if (isLoading) {
      return (
        <Layout title='BEDbase' footer>
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
    };

  return (
    <Layout footer title='BEDbase' fullHeight>
      <Container fluid>
        <Row className='mt-3'>
          <Col sm={12} md={6}>
            <h3 className='fw-bold'>Metrics</h3>
          </Col>
          <Col sm={12} md={6} className='d-flex justify-content-end'>
            <span>
              <button className="btn btn-outline-primary btn-sm" onClick={() => setEndpointsModalShow(true)}>
                <i className="bi bi-info-circle me-1" />
                API
              </button>
            </span>
          </Col>
        </Row>
        
        <Row className='mt-3'>
          <h5 className='fw-semibold'>BEDbase File Statistics</h5>
          <Col sm={12} md={12}>
            <ul className='list-group w-100 shadow-sm'>
              <li className='list-group-item d-flex justify-content-between align-items-center'>
                Number of bed files available:
                <span
                  className='badge bg-primary rounded-pill'>{(bedbaseStats?.bedfiles_number || 0).toLocaleString()}</span>
              </li>
              <li className='list-group-item d-flex justify-content-between align-items-center'>
                Number of bed sets available:
                <span
                  className='badge bg-success rounded-pill'>{(bedbaseStats?.bedsets_number || 0).toLocaleString()}</span>
              </li>
              <li className='list-group-item d-flex justify-content-between align-items-center'>
                Number of genomes available:
                <span
                  className='badge bg-info rounded-pill'>{(bedbaseStats?.genomes_number || 0).toLocaleString()}</span>
              </li>
            </ul>
          </Col>
        </Row>

        {detailedStats && (
          <Row className='h-100 mt-1 g-2'>
            <Col sm={12} md={6} className='d-flex flex-column gap-2'>
              <div 
                className='border rounded genome-card cursor-pointer p-3 shadow-sm' 
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Genome',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_genome || {}),
                  dataLabel: 'Number of BED files',
                  backgroundColor: [PRIMARY_COLOR],

                  borderWidth: 1,
                  sliceIndex: Object.entries(detailedStats?.file_genome || {}).length
                })}
              >
                <h6 className='fw-semibold'>BED Files by Genome</h6>
                <MetricPlot 
                  type='bar' 
                  data={Object.entries(detailedStats?.file_genome || {})} 
                  dataLabel='Number of BED files'
                  backgroundColor={[PRIMARY_COLOR]}
                  borderWidth={1} 
                  sliceIndex={sliceIndex}
                />
              </div>
              <div 
                className='border rounded genome-card cursor-pointer p-3 shadow-sm'
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Type',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_type || {}),
                  dataLabel: 'Number of BED files',
                  backgroundColor: [PRIMARY_COLOR],
                  borderWidth: 1,
                  sliceIndex: Object.entries(detailedStats?.file_type || {}).length
                })}
              >
                <h6 className='fw-semibold'>BED Files by Type</h6>
                <MetricPlot 
                  type='bar' 
                  data={Object.entries(detailedStats?.file_type || {})} 
                  dataLabel='Number of BED files'
                  backgroundColor={[PRIMARY_COLOR]}
                  borderWidth={1} 
                  sliceIndex={sliceIndex}
                />
              </div>
            </Col>

            <Col sm={12} md={6}>
              <div 
                className='h-100 border rounded genome-card cursor-pointer p-3 shadow-sm'
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Format',
                  type: 'pie',
                  data: Object.entries(detailedStats?.file_format || {}),
                  dataLabel: 'Number of BED files',
                  backgroundColor: [PRIMARY_COLOR],
                  borderWidth: 1,
                  sliceIndex: Object.entries(detailedStats?.file_format || {}).length
                })}
              >
              <h6 className='fw-semibold'>BED Files by Format</h6>
              <div className='p-5'>
                <MetricPlot 
                  type='pie' 
                  data={Object.entries(detailedStats?.file_format || {})} 
                  dataLabel='Number of BED files'
                  backgroundColor={[PRIMARY_COLOR]}
                  borderWidth={1} 
                  sliceIndex={sliceIndex}
                />
                </div>
              </div>
            </Col>

            <Col sm={12} md={12}>
              <div 
                className='h-100 border rounded genome-card cursor-pointer p-3 shadow-sm'
                onClick={() => setMetricModalProps({
                  title: 'BED Files by Organism',
                  type: 'bar',
                  data: Object.entries(detailedStats?.file_organism || {}),
                  dataLabel: 'Number of BED files',
                  backgroundColor: [PRIMARY_COLOR],
                  borderWidth: 1,
                  sliceIndex: Object.entries(detailedStats?.file_organism || {}).length
                })}
              >
              <h6 className='fw-semibold'>BED Files by Organism</h6>
              <div className='p-1' style={{height: 360}}>
                <MetricPlot 
                  type='bar' 
                  data={Object.entries(detailedStats?.file_organism || {})} 
                  dataLabel='Number of BED files'
                  backgroundColor={[PRIMARY_COLOR]}
                  borderWidth={1} 
                  sliceIndex={sliceIndex * 2}
                  useAspectRatio={false}
                />
                </div>
              </div>
            </Col>
          </Row>
        )}

        <Row className='mt-4 pt-2'>
          <h5 className='fw-semibold'>BEDbase Usage Statistics</h5>
          <Col sm={12} md={12}>
            <p className='text-xs'>Coming Soon..</p>
          </Col>
        </Row>

      {showMetricModal && (
        <MetricModal
          title={metricModalTitle}
          type={metricModalType}
          data={metricModalData}
          dataLabel={metricModalDataLabel}
          backgroundColor={metricModalBackgroundColor}
          borderWidth={metricModalBorderWidth}
          sliceIndex={metricModalSliceIndex}
          show={showMetricModal}
          onHide={() => setShowMetricModal(false)}
        />
      )}

      <EndpointsModal
        titles = {['Detailed Stats']}
        endpoints = {[`${API_BASE}/detailed-stats`]}
        show = {endpointsModalShow}
        onHide = {() => setEndpointsModalShow(false)}
      />

      </Container>
    </Layout>
  );
};

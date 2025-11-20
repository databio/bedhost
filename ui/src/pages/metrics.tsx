import { useState } from 'react';
import { Layout } from '../components/layout.tsx';

import { useStats } from '../queries/useStats.ts';
import { useDetailedStats } from '../queries/useDetailedStats.ts';
import { useDetailedUsage } from '../queries/useDetailedUsage.ts';
import { MetricPlotType } from '../components/metrics/metric-plot.tsx';
import { MetricModal } from '../components/modals/metric-modal.tsx';
import { CardSkeleton } from '../components/skeletons/card-skeleton';
import { EndpointsModal } from '../components/modals/endpoints-modal.tsx';
import { MetricsSelector } from '../components/metrics/metrics-selector.tsx';
import { FileStatistics } from '../components/metrics/file-statistics.tsx';
import { GeoStatistics } from '../components/metrics/geo-statistics.tsx';
import { UsageStatistics } from '../components/metrics/usage-statistics.tsx';

type MetricsView = 'file' | 'geo' | 'usage';

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

export const Metrics = () => {
  const [metricsView, setMetricsView] = useState<MetricsView>('file');
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
      <Layout title='BEDbase' footer>
        <div className='my-2'>
          <div className='row'>
            <div className='col-sm-12 col-md-12'>
              <div className='mb-2'>
                <CardSkeleton height='200px' />
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='col-sm-5 col-md-5'>
              <div className='mb-2'>
                <CardSkeleton height='300px' />
              </div>
              <div className='mb-2'>
                <CardSkeleton height='300px' />
              </div>
            </div>
            <div className='col-sm-7 col-md-7'>
              <CardSkeleton height='100%' />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout footer title='BEDbase' fullHeight>
      <div className='container-fluid'>
        <div className='row'>
          <div className='col-12'>
            <div className='d-flex align-items-center justify-content-between'>
              <button
                className='btn btn-outline-primary btn-sm opacity-0'
                disabled
                onClick={() => setEndpointsModalShow(true)}
              >
                <i className='bi bi-info-circle me-1' />
                API
              </button>
              <MetricsSelector view={metricsView} setView={setMetricsView} />
              <button className='btn btn-outline-primary btn-sm' onClick={() => setEndpointsModalShow(true)}>
                <i className='bi bi-info-circle me-1' />
                API
              </button>
            </div>
          </div>
        </div>

        {metricsView === 'file' && (
          <FileStatistics
            bedbaseStats={bedbaseStats}
            detailedStats={detailedStats}
            onMetricModalOpen={setMetricModalProps}
          />
        )}

        {metricsView === 'geo' && (
          <GeoStatistics detailedStats={detailedStats} onMetricModalOpen={setMetricModalProps} />
        )}

        {metricsView === 'usage' && <UsageStatistics usageStats={usageStats} onMetricModalOpen={setMetricModalProps} />}

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
      </div>
    </Layout>
  );
};

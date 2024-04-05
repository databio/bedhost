import { useParams } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Col, Row } from 'react-bootstrap';
import { useBedsetMetadata } from '../queries/useBedsetMetadata';
import { CardSkeleton } from '../components/skeletons/card-skeleton';
import { ErrorPage } from '../components/common/error-page';
import { BedsetSplashHeader } from '../components/bedset-splash-components/header';
import { MeanRegionWidthCard } from '../components/bedset-splash-components/cards/median-region-width';
import { MedianTssDistCard } from '../components/bedset-splash-components/cards/median-tss-distance';
import { GenomicFeatureBar } from '../components/bedset-splash-components/charts/genomic-feature-bar';
import { Plots } from '../components/bedset-splash-components/plots';
import { GCContentCard } from '../components/bedset-splash-components/cards/gc-content-card';

export const BedsetSplash = () => {
  const params = useParams();
  const bedsetId = params.id;

  const {
    isLoading,
    data: metadata,
    error,
  } = useBedsetMetadata({
    md5: bedsetId,
    autoRun: true,
  });

  if (isLoading) {
    return (
      <Layout title={`BEDbase | ${bedsetId}`} footer>
        <div className="my-2">
          <Row>
            <Col sm={12} md={12}>
              <div className="mb-2">
                <CardSkeleton height="100px" />
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
  } else if (error) {
    return <ErrorPage title={`BEDbase | ${bedsetId}`} error={error} />;
  } else {
    return (
      <Layout title={`BEDbase | ${bedsetId}`}>
        <div className="my-2">
          <Row className="mb-2">
            <Col sm={12} md={12}>
              {metadata !== undefined ? <BedsetSplashHeader metadata={metadata} /> : null}
            </Col>
          </Row>
          <h2 className="fw-bold">Statistics</h2>
          {metadata && (
            <Row>
              <Col sm={12} md={4} className="d-flex flex-column gap-2 px-1 justify-content-between">
                <MeanRegionWidthCard metadata={metadata} />
                <MedianTssDistCard metadata={metadata} />
                <GCContentCard metadata={metadata} />
              </Col>
              <Col sm={12} md={8} className="h-100 align-items-stretch">
                <GenomicFeatureBar metadata={metadata!} />
              </Col>
            </Row>
          )}

          <h2 className="fw-bold">Plots</h2>
          <Plots metadata={metadata!} />
        </div>
      </Layout>
    );
  }
};

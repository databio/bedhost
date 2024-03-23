import { useParams } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Col, Row } from 'react-bootstrap';
import { useBedsetMetadata } from '../queries/useBedsetMetadata';
import { CardSkeleton } from '../components/skeletons/card-skeleton';
import { ErrorPage } from '../components/common/error-page';
import { BedsetSplashHeader } from '../components/bedset-splash-components/header';
import { Fragment } from 'react/jsx-runtime';
import { MeanRegionWidthCard } from '../components/bedset-splash-components/cards/median-region-width';
import { MedianTssDistCard } from '../components/bedset-splash-components/cards/median-tss-distance';
import { GenomicFeatureBar } from '../components/bedset-splash-components/charts/genomic-feature-bar';
import { PromoterAnalysisBar } from '../components/bedset-splash-components/charts/promoter-analysis';

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
      <Layout title={`Bedbase | ${bedsetId}`} footer>
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
    return <ErrorPage title={`Bedbase | ${bedsetId}`} error={error} />;
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
          <Row className="">
            {metadata && (
              <Fragment>
                <Col sm={12} md={6} className="h-100 align-items-stretch p-1">
                  <MeanRegionWidthCard metadata={metadata} />
                </Col>
                <Col sm={12} md={6} className="h-100 align-items-stretch p-1">
                  <MedianTssDistCard metadata={metadata} />
                </Col>
              </Fragment>
            )}
          </Row>
          <Row className="h-100 mb-2">
            <Col sm={12} md={6} className="h-100 p-1">
              <GenomicFeatureBar metadata={metadata!} />
            </Col>
            <Col sm={12} md={6} className="h-100 p-1">
              <PromoterAnalysisBar metadata={metadata!} />
            </Col>
          </Row>
        </div>
      </Layout>
    );
  }
};

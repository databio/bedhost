import { useParams } from 'react-router-dom';
import { useBedMetadata } from '../../queries/useBedMetadata';
import { Layout } from '../layout';
import { Col, Row } from 'react-bootstrap';
import { BedSplashHeader } from '../bed-splash-components/bed-splash-header';
import { CardSkeleton } from '../skeletons/card-skeleton';
import { ErrorPage } from '../common/error-page';
import { Fragment } from 'react/jsx-runtime';
import { NoRegionsCard } from '../bed-splash-components/no-regions-card';
import { MedianTssDistCard } from '../bed-splash-components/median-tss-dist-card';
import { MeanRegionWidthCard } from '../bed-splash-components/mean-region-width-card';
import { GenomicFeatureBar } from '../bed-splash-components/charts/genomic-feature-bar';
import { PromoterAnalysisBar } from '../bed-splash-components/charts/promoter-analysis';
import { Plots } from '../bed-splash-components/plots';

export const BedSplash = () => {
  const params = useParams();
  const bedId = params.id;

  const {
    isLoading,
    data: metadata,
    error,
  } = useBedMetadata({
    md5: bedId,
    autoRun: true,
    full: true,
  });

  if (isLoading) {
    return (
      <Layout title={`Bedbase | ${bedId}`} footer>
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
    return <ErrorPage title={`Bedbase | ${bedId}`} error={error} />;
  } else {
    return (
      <Layout title={`Bedbase | ${bedId}`} footer fullHeight>
        <div className="my-2">
          <Row className="mb-2">
            <Col sm={12} md={12}>
              {metadata !== undefined ? <BedSplashHeader metadata={metadata} record_identifier={bedId} /> : null}
            </Col>
          </Row>
          <h2 className="fw-bold">Statistics</h2>
          <Row className="">
            {metadata && (
              <Fragment>
                <Col sm={12} md={4} className="h-100 align-items-stretch p-1">
                  <NoRegionsCard metadata={metadata} />
                </Col>
                <Col sm={12} md={4} className="h-100 align-items-stretch p-1">
                  <MedianTssDistCard metadata={metadata} />
                </Col>
                <Col sm={12} md={4} className="h-100 align-items-stretch p-1">
                  <MeanRegionWidthCard metadata={metadata} />
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
          <h2 className="fw-bold">Plots</h2>
          <Plots metadata={metadata!} />
        </div>
      </Layout>
    );
  }
};

import { useParams } from 'react-router-dom';
import { useBedMetadata } from '../queries/useBedMetadata';
import { Layout } from '../components/layout';
import { Col, Row } from 'react-bootstrap';
import { BedSplashHeader } from '../components/bed-splash-components/header';
import { CardSkeleton } from '../components/skeletons/card-skeleton';
import { ErrorPage } from '../components/common/error-page';
import { Fragment } from 'react/jsx-runtime';
import { NoRegionsCard } from '../components/bed-splash-components/cards/no-regions-card';
import { MedianTssDistCard } from '../components/bed-splash-components/cards/median-tss-dist-card';
import { MeanRegionWidthCard } from '../components/bed-splash-components/cards/mean-region-width-card';
import { GenomicFeatureBar } from '../components/bed-splash-components/charts/genomic-feature-bar';
import { PromoterAnalysisBar } from '../components/bed-splash-components/charts/promoter-analysis';
import { Plots } from '../components/bed-splash-components/plots';
import { AxiosError } from 'axios';

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
      <Layout title={`BEDbase | ${bedId}`} footer>
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
    if ((error as AxiosError)?.response?.status === 404) {
      return (
        <Layout title={`BEDbase | ${bedId}`}>
          <div
            className="mt-5 w-100 d-flex flex-column align-items-center justify-content-center"
            style={{ height: '50vh' }}
          >
            <h1 className="fw-bold text-center mb-3">Oh no!</h1>
            <div className="d-flex flex-row align-items-center w-100 justify-content-center">
              <h2 className="text-2xl text-center">
                We could not find BED with record identifier: <br />
                <span className="fw-bold">{bedId}</span>
              </h2>
            </div>
            <div className="w-50">
              <p className="fst-italic text-center mt-3">
                Are you sure you have the correct record identifier? If you believe this is an error, please open an
                issue: <a href="https://github.com/databio/bedhost/issues">on GitHub</a>
              </p>
            </div>
            <div className="d-flex flex-row align-items-center justify-content-center">
              <a href="/">
                <button className="btn btn-primary">
                  <i className="bi bi-house me-1"></i>
                  Home
                </button>
              </a>
              <a href="https://github.com/databio/bedhost/issues">
                <button className="btn btn-primary ms-2">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Report issue
                </button>
              </a>
            </div>
          </div>
        </Layout>
      );
    } else {
      return <ErrorPage title={`BEDbase | ${bedId}`} error={error} />;
    }
  } else {
    return (
      <Layout title={`BEDbase | ${bedId}`} footer fullHeight>
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
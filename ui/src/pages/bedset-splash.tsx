import { useParams } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Col, Container, Row } from 'react-bootstrap';
import { useBedsetMetadata } from '../queries/useBedsetMetadata';
import { CardSkeleton } from '../components/skeletons/card-skeleton';
import { BedsetSplashHeader } from '../components/bedset-splash-components/header';
import { MeanRegionWidthCard } from '../components/bedset-splash-components/cards/median-region-width';
import { MedianTssDistCard } from '../components/bedset-splash-components/cards/median-tss-distance';
import { GenomicFeatureBar } from '../components/bedset-splash-components/charts/genomic-feature-bar';
import { Plots } from '../components/bedset-splash-components/plots';
import { GCContentCard } from '../components/bedset-splash-components/cards/gc-content-card';
import { BedsTable } from '../components/bedset-splash-components/beds-table';
import { AxiosError } from 'axios';
import { useBedsetBedfiles } from '../queries/useBedSetBedfiles';

export const BedsetSplash = () => {
  const params = useParams();
  const bedsetId = params.id;

  const {
    isFetching: isLoadingMetadata,
    data: metadata,
    error,
  } = useBedsetMetadata({
    md5: bedsetId,
    autoRun: true,
  });

  const { isFetching: isLoadingBedfiles, data: bedfiles } = useBedsetBedfiles({
    id: bedsetId,
    autoRun: true,
  });

  if (isLoadingMetadata) {
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
    if ((error as AxiosError)?.response?.status === 404) {
      return (
        <Layout title={`BEDbase | ${bedsetId}`} footer>
          <div
            className="mt-5 w-100 d-flex flex-column align-items-center justify-content-center"
            style={{ height: '50vh' }}
          >
            <h1 className="fw-bold text-center mb-3">Oh no!</h1>
            <div className="d-flex flex-row align-items-center w-100 justify-content-center">
              <h4 className="text-2xl text-center">
                We could not find BEDset with record identifier: <br />
                <span className="fw-bold">{bedsetId}</span>
              </h4>
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
    }
  } else {
    return (
      <Layout title={`BEDbase | ${bedsetId}`} footer fullHeight>
        <Container className="my-2">
          <Row className="mb-2">
            <Col sm={12}>{metadata !== undefined ? <BedsetSplashHeader metadata={metadata} /> : null}</Col>
          </Row>

          <Row className="mb-2 g-2">
            <h4 className="fw-bold">Statistics</h4>
            {metadata && (
              <Col sm={12} md={4} className="d-flex flex-column mt-0 gap-2">
                <MeanRegionWidthCard metadata={metadata} />
                <MedianTssDistCard metadata={metadata} />
                <GCContentCard metadata={metadata} />
              </Col>
            )}
            <Col sm={12} md={8} className="h-100 align-items-stretch mt-2 mt-md-0">
              <GenomicFeatureBar metadata={metadata!} />
            </Col>
          </Row>

          <Row className="mb-2">
            <Col sm={12}>
              <h4 className="fw-bold">Plots</h4>
              <Plots metadata={metadata!} />
            </Col>
          </Row>

          <Row className="mb-2">
            <h4 className="fw-bold">Constituent BED Files</h4>
            <Col sm={12}>
              {isLoadingBedfiles ? (
                <div className="mt-2 mb-5">
                  <CardSkeleton height="100px" />
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="mb-2">
                      <CardSkeleton height="15px" />
                    </div>
                  ))}
                </div>
              ) : (
                bedfiles && <BedsTable beds={bedfiles.results} />
              )}
            </Col>
          </Row>
        </Container>
      </Layout>
    );
  }
};

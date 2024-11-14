import { useParams } from 'react-router-dom';
import { useBedMetadata } from '../queries/useBedMetadata';
import { Layout } from '../components/layout';
import { Col, Row } from 'react-bootstrap';
import { BedSplashHeader } from '../components/bed-splash-components/header';
import { CardSkeleton } from '../components/skeletons/card-skeleton';
import { ErrorPage } from '../components/common/error-page';
import { NoRegionsCard } from '../components/bed-splash-components/cards/no-regions-card';
import { MedianTssDistCard } from '../components/bed-splash-components/cards/median-tss-dist-card';
import { MeanRegionWidthCard } from '../components/bed-splash-components/cards/mean-region-width-card';
import { GenomicFeatureBar } from '../components/bed-splash-components/charts/genomic-feature-bar';
import { Plots } from '../components/bed-splash-components/plots';
import { AxiosError } from 'axios';
import { GCContentCard } from '../components/bed-splash-components/cards/gc-content-card';
import { snakeToTitleCase } from '../utils';

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
              <h3 className="text-2xl text-center">
                We could not find BED with record identifier: <br />
                <span className="fw-bold">{bedId}</span>
              </h3>
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
      return <ErrorPage title={`BEDbase | ${bedId}`} error={error as AxiosError} />;
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
          <Row className="mb-2 g-3">
            <Col sm={12} md={6}>
              <h3 className="fw-bold">Overview</h3>
              <div className="border rounded p-1 shadow-sm">
                <table className="table table-sm rounded text-truncate text-sm">
                  <thead>
                    <tr>
                      <th scope="col">Key</th>
                      <th scope="col">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {Object.keys(metadata?.annotation || {}).map((k) => {
                      if (k === 'input_file' || k === 'file_name' || k === 'sample_name') {
                        return null;
                        // @ts-expect-error wants to get mad because it could be an object and React cant render that (it wont be)
                      } else if (!metadata?.annotation[k]) {
                        return null;
                      } else {
                        return (
                          <tr key={k}>
                            <td style={{ maxWidth: '50px' }} className="fst-italic">
                              {snakeToTitleCase(k)}
                            </td>

                            <td style={{ maxWidth: '120px' }} className="truncate">
                              {/* @ts-expect-error wants to get mad because it could be an object and React cant render that (it wont be) */}
                              {metadata?.annotation[k] || 'N/A'}
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>
            </Col>
            <Col sm={12} md={6}>
              <h3 className="fw-bold">BED Sets</h3>
              <div className="border rounded p-1 shadow-sm h-80">
                <table className="table table-sm rounded text-truncate text-sm">
                  <thead>
                    <tr>
                      <th scope="col">BED set ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Description</th>
                      <th scope="col">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metadata?.bedsets?.map((bedset) => (
                      <tr key={bedset.id} className="truncate">
                        <td className="truncate" style={{ maxWidth: '150px' }}>
                          {bedset.id}
                        </td>
                        <td className="truncate" style={{ maxWidth: '100px' }}>
                          {bedset.name || 'No name'}
                        </td>
                        <td className="truncate" style={{ maxWidth: '300px' }}>
                          {bedset.description || 'No description'}
                        </td>
                        <td>
                          <a href={`/bedset/${bedset.id}`}>View</a>
                        </td>
                      </tr>
                    )) || 'N/A'}
                  </tbody>
                </table>
              </div>
            </Col>
          </Row>
          
          <Row className="mb-2 g-2">
            <h3 className="fw-bold">Statistics</h3>
            {metadata && (
              <Col sm={12} md={4} className="d-flex flex-column justify-content-between mt-0">
                <NoRegionsCard metadata={metadata} />
                <MedianTssDistCard metadata={metadata} />
                <MeanRegionWidthCard metadata={metadata} />
                <GCContentCard metadata={metadata} />
              </Col>
            )}
            <Col sm={12} md={8} className="d-flex flex-column mt-0">
              <GenomicFeatureBar metadata={metadata!} />
              {/* <PromoterAnalysisBar metadata={metadata!} /> */}
            </Col>
          </Row>
          <Row className="mb-2">
            <Col sm={12}>
              <h3 className="fw-bold">Plots</h3>
              <Plots metadata={metadata!} />
            </Col>
          </Row>

          <Row className="mb-2 g-2">
            <h3 className="fw-bold">Similar BED Files</h3>
            {metadata && (
              <Col sm={12} md={4} className="d-flex flex-column justify-content-between mt-0">
                <NoRegionsCard metadata={metadata} />
                <MedianTssDistCard metadata={metadata} />
                <MeanRegionWidthCard metadata={metadata} />
                <GCContentCard metadata={metadata} />
              </Col>
            )}
            <Col sm={12} md={8} className="d-flex flex-column mt-0">
              <GenomicFeatureBar metadata={metadata!} />
              {/* <PromoterAnalysisBar metadata={metadata!} /> */}
            </Col>
          </Row>

        </div>
      </Layout>
    );
  }
};

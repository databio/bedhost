import { useParams } from 'react-router-dom';
import { useBedMetadata } from '../queries/useBedMetadata';
import { useBedGenomeStats } from '../queries/useBedGenomeStats';
import { Layout } from '../components/layout';
import { Col, Container, Row } from 'react-bootstrap';
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
import { Text2BedSearchResultsTable } from '../components/search/text2bed/t2b-search-results-table';
import { useBedNeighbours } from '../queries/useBedNeighbours';
import type { components } from '../../bedbase-types.d.ts';

// Use the response type to properly type the metadata
type BedMetadata = components['schemas']['BedMetadataAll'];

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

  const {
    data: genomeStats,
  } = useBedGenomeStats({
    md5: bedId,
  });

  const { data: neighbours } = useBedNeighbours({
    md5: bedId,
    limit: 10,
    offset: 0,
  });

  // Helper function to safely type the annotation keys
  const getAnnotationValue = (data: BedMetadata | undefined, key: string) => {
    if (!data?.annotation) return null;
    return (data.annotation as Record<string, string | string[] | null>)[key];
  };

  // Helper function to get filtered keys
  const getFilteredKeys = (data: BedMetadata | undefined) => {
    if (!data?.annotation) return [];
    return Object.keys(data.annotation).filter(
      (k) => k !== 'input_file' && k !== 'file_name' && k !== 'sample_name' && getAnnotationValue(data, k),
    );
  };

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
    if ((error as AxiosError)?.response?.status || 200 in [404, 422]) {
      return (
        <Layout title={`BEDbase | ${bedId}`}>
          <div
            className="mt-5 w-100 d-flex flex-column align-items-center justify-content-center"
            style={{ height: '50vh' }}
          >
            <h1 className="fw-bold text-center mb-3">Oh no!</h1>
            <div className="d-flex flex-row align-items-center w-100 justify-content-center">
              <h5 className="text-2xl text-center">
                We could not find BED with record identifier: <br />
                <span className="fw-bold">{bedId}</span>
              </h5>
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
        <Container className="my-2">
          <Row className="mb-2">
            <Col sm={12} md={12}>
              {metadata !== undefined ? <BedSplashHeader metadata={metadata} record_identifier={bedId} genomeStats={genomeStats}/> : null}
            </Col>
          </Row>
          <Row className="mt-3 mb-4 g-3">
            <Col sm={12} md={6} className='mt-0'>
              <h5 className="fw-bold">Overview</h5>
              <div className="border rounded px-0 pt-1 shadow-sm">
                <div className="table-responsive">
                  <table className="table table-sm table-striped text-truncate text-sm">
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
                        }

                        const value = getAnnotationValue(metadata, k);
                        if (!value) {
                          return null;
                        }

                        return (
                          <tr key={k}>
                            <td style={{ maxWidth: '50px' }} className="fst-italic">
                              {snakeToTitleCase(k)}
                            </td>
                            <td style={{ maxWidth: '120px' }} className="truncate">
                              { k === 'global_sample_id' ?
                              (Array.isArray(value) && value.length > 0)
                              ? value.map((v, i) => (
                                  v.includes('encode:')
                                    ? <a key={i} href={'https://www.encodeproject.org/files/' + v.replace('encode:', '')}>{v}</a>
                                    : v.includes('geo:')
                                      ? <a key={i} href={'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' + v.replace('geo:', '')}>{v}</a>
                                      : v ?? 'N/A'
                                )).reduce((prev, curr) => <>{prev}, {curr}</>)
                              : value ?? 'N/A'
                              :
                                k === 'global_experiment_id' ?
                                (Array.isArray(value) && value.length > 0) ? value.map((v, i) => (
                                  v.includes('encode') ? <a key={i} href={'https://www.encodeproject.org'}>{v}</a> :
                                  v.includes('geo:') ? <a key={i} href={'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' + v.replace('geo:', '')}>{v}</a> :
                                  v ?? 'N/A'
                                )).reduce((prev, curr) => <>{prev}, {curr}</>) : value ?? 'N/A'
                              :
                                value ?? 'N/A'
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Col>
            <Col sm={12} md={6} className='mt-2 mt-md-0'>
              <h5 className="fw-bold">BEDsets</h5>
              <div className="border rounded px-0 pt-1 shadow-sm">
                <div className="table-responsive">
                  <table className="table table-sm table-striped text-truncate text-sm">
                    <thead>
                    <tr>
                      <th scope="col">BEDset ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Description</th>
                      <th scope="col">View</th>
                    </tr>
                    </thead>
                    <tbody>
                    {[
                      ...(metadata?.bedsets || []).map((bedset) => (
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
                      )),
                      ...Array(Math.max(0, getFilteredKeys(metadata).length - (metadata?.bedsets?.length || 0)))
                        .fill(null)
                        .map((_, index) => (
                          <tr key={`empty-${index}`}>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                          </tr>
                        )),
                    ]}
                    </tbody>
                  </table>
                </div>
              </div>
            </Col>
          </Row>

          <Row className="mb-4 g-2">
            <h5 className="fw-bold">Statistics</h5>
            {metadata && (
              <Col sm={12} md={3} className="d-flex flex-column mt-0 gap-2">
                <NoRegionsCard metadata={metadata} />
                <MedianTssDistCard metadata={metadata} />
                <MeanRegionWidthCard metadata={metadata} />
                <GCContentCard metadata={metadata} />
              </Col>
            )}
            <Col sm={12} md={9} className="d-flex flex-column mt-2 mt-md-0">
              <GenomicFeatureBar metadata={metadata!} />
            </Col>
          </Row>

          <Row className="mb-4">
            <h5 className="fw-bold">Plots</h5>
            <Col sm={12}>
              <Plots metadata={metadata!} />
            </Col>
          </Row>

          {neighbours && (
            <Row className="mb-4 mx-0">
              <h5 className="fw-bold px-0">Similar BED Files</h5>
              <Col sm={12} className="d-flex flex-column mt-0 border rounded rounded-2 shadow-sm px-0 pt-1 pb-0">
                <Text2BedSearchResultsTable results={neighbours} />
              </Col>
            </Row>
          )}
        </Container>
      </Layout>
    );
  }
};

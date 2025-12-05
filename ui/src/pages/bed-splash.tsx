import { useParams } from 'react-router-dom';
import { useBedMetadata } from '../queries/useBedMetadata';
import { useBedGenomeStats } from '../queries/useBedGenomeStats';
import { Layout } from '../components/layout';
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
import { snakeToTitleCase, formatDateTime } from '../utils';
import { Text2BedSearchResultsTable } from '../components/search/text2bed/t2b-search-results-table';
import { useBedNeighbours } from '../queries/useBedNeighbours';
import type { components } from '../../bedbase-types.d.ts';
// import { BEDEmbeddingView } from '../components/umap/bed-embedding-view.tsx';
// import { useState } from 'react';
import { SearchBedSetResultTable } from '../components/search/text2bedset/t2bs-search-results-table.tsx';
import { EmbeddingContainer } from '../components/umap/embedding-container.tsx';

// Use the response type to properly type the metadata
type BedMetadata = components['schemas']['BedMetadataAll'];

export const BedSplash = () => {
  const params = useParams();
  const bedId = params.id;

  // const [showNeighbors, setShowNeighbors] = useState(false);

  const {
    isLoading,
    data: metadata,
    error,
  } = useBedMetadata({
    md5: bedId,
    autoRun: true,
    full: true,
  });

  const { data: genomeStats } = useBedGenomeStats({
    md5: bedId,
  });

  const { data: neighbours } = useBedNeighbours({
    md5: bedId,
    limit: 5,
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

  const filteredKeys = getFilteredKeys(metadata);
  // Add created and updated at the end
  const allKeys = [...filteredKeys, '_created', '_updated'];
  const midpoint = Math.ceil(allKeys.length / 2);
  const leftKeys = allKeys.slice(0, midpoint);
  const rightKeys = allKeys.slice(midpoint);

  const metadataRow = (k: string) => {
    if (k === '_created') {
      return (
        <tr key={k}>
          <td style={{ width: '200px' }} className='fst-italic text-muted p-0 pb-1'>
            File Created
          </td>
          <td className='py-0'>{metadata?.submission_date ? formatDateTime(metadata?.submission_date) : 'N/A'}</td>
        </tr>
      );
    }

    if (k === '_updated') {
      return (
        <tr key={k}>
          <td style={{ width: '200px' }} className='fst-italic text-muted p-0 pb-1'>
            File Updated
          </td>
          <td className='pt-0 pb-1'>
            {metadata?.last_update_date ? formatDateTime(metadata?.last_update_date) : 'N/A'}
          </td>
        </tr>
      );
    }

    const value = getAnnotationValue(metadata, k);
    if (!value) return null;

    return (
      <tr key={k}>
        <td style={{ width: '200px' }} className='fst-italic text-muted p-0 pb-1'>
          {snakeToTitleCase(k)}
        </td>
        <td
          style={{ maxWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          className='pt-0 pb-1'
        >
          {k === 'global_sample_id'
            ? Array.isArray(value) && value.length > 0
              ? value
                  .map((v, i) =>
                    v.includes('encode:') ? (
                      <a key={i} href={'https://www.encodeproject.org/files/' + v.replace('encode:', '')}>
                        {v}
                      </a>
                    ) : v.includes('geo:') ? (
                      <a key={i} href={'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' + v.replace('geo:', '')}>
                        {v}
                      </a>
                    ) : (
                      (v ?? 'N/A')
                    ),
                  )
                  .reduce((prev, curr) => (
                    <>
                      {prev}, {curr}
                    </>
                  ))
              : (value ?? 'N/A')
            : k === 'global_experiment_id'
              ? Array.isArray(value) && value.length > 0
                ? value
                    .map((v, i) =>
                      v.includes('encode') ? (
                        <a key={i} href={'https://www.encodeproject.org'}>
                          {v}
                        </a>
                      ) : v.includes('geo:') ? (
                        <a key={i} href={'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' + v.replace('geo:', '')}>
                          {v}
                        </a>
                      ) : (
                        (v ?? 'N/A')
                      ),
                    )
                    .reduce((prev, curr) => (
                      <>
                        {prev}, {curr}
                      </>
                    ))
                : (value ?? 'N/A')
              : (value ?? 'N/A')}
        </td>
      </tr>
    );
  };

  if (isLoading) {
    return (
      <Layout title={`BEDbase | ${bedId}`} footer>
        <div className='my-2'>
          <div className='row'>
            <div className='col-sm-12 col-md-12'>
              <div className='mb-2'>
                <CardSkeleton height='100px' />
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
  } else if (error) {
    if ((error as AxiosError)?.response?.status || 200 in [404, 422]) {
      return (
        <Layout title={`BEDbase | ${bedId}`}>
          <div
            className='mt-5 w-100 d-flex flex-column align-items-center justify-content-center'
            style={{ height: '50vh' }}
          >
            <h1 className='fw-bold text-center mb-3'>Oh no!</h1>
            <div className='d-flex flex-row align-items-center w-100 justify-content-center'>
              <h5 className='text-2xl text-center'>
                We could not find BED with record identifier: <br />
                <span className='fw-bold'>{bedId}</span>
              </h5>
            </div>
            <div className='w-50'>
              <p className='fst-italic text-center mt-3'>
                Are you sure you have the correct record identifier? If you believe this is an error, please open an
                issue: <a href='https://github.com/databio/bedhost/issues'>on GitHub</a>
              </p>
            </div>
            <div className='d-flex flex-row align-items-center justify-content-center'>
              <a href='/'>
                <button className='btn btn-primary'>
                  <i className='bi bi-house me-1'></i>
                  Home
                </button>
              </a>
              <a href='https://github.com/databio/bedhost/issues'>
                <button className='btn btn-primary ms-2'>
                  <i className='bi bi-exclamation-triangle me-1'></i>
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
        <div className='container my-2'>
          <div className='row mb-2'>
            <div className='col-12'>
              {metadata !== undefined ? (
                <BedSplashHeader metadata={metadata} record_identifier={bedId} genomeStats={genomeStats} />
              ) : null}
            </div>
          </div>
          <div className='row mt-1 mb-3 g-2'>
            <div className='col-12'>
              <h5 className='fw-bold'>Metadata</h5>
              <div className='row'>
                <div className='col-12 col-xl-6 mt-0 ps-4'>
                  <div className='text-sm'>
                    <table className='table table-sm table-borderless table-transparent mb-0'>
                      <tbody>{leftKeys.map(metadataRow)}</tbody>
                    </table>
                  </div>
                </div>
                <div className='col-12 col-xl-6 mt-0 ps-4'>
                  <div className='text-sm'>
                    <table className='table table-sm table-borderless table-transparent mb-0'>
                      <tbody>{rightKeys.map(metadataRow)}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='row mb-4 g-2'>
            <h5 className='fw-bold'>Statistics</h5>
            {metadata && (
              <div className='col-sm-12 col-md-3 d-flex flex-column mt-0 gap-2'>
                <NoRegionsCard metadata={metadata} />
                <MedianTssDistCard metadata={metadata} />
                <MeanRegionWidthCard metadata={metadata} />
                <GCContentCard metadata={metadata} />
              </div>
            )}
            <div className='col-sm-12 col-md-9 d-flex flex-column mt-2 mt-md-0'>
              <GenomicFeatureBar metadata={metadata!} />
            </div>
          </div>

          <div className='row mb-4'>
            <h5 className='fw-bold'>Plots</h5>
            <div className='col-sm-12'>
              <Plots metadata={metadata!} />
            </div>
          </div>

          {bedId && metadata?.name?.includes('encode') && (
            <div className='row mb-3'>
              <div className='col-12'>
                <h5 className='fw-bold'>Region Embedding Map</h5>
                <div className='rounded border embedding-card transition-all'>
                  <EmbeddingContainer bedIds={[bedId]} height={330} preselectPoint={true} centerInitial={true} tooltipInitial={true} simpleTooltip={true} blockCompact={true} showBorder={false} />
                </div>
              </div>
            </div>
          )}

          {metadata?.bedsets && metadata.bedsets.length > 0 && (
            <div className='row mb-3'>
              <div className='col-12'>
                <h5 className='fw-bold'>BEDsets</h5>
                <SearchBedSetResultTable
                  results={{
                    count: metadata.bedsets.length,
                    limit: metadata.bedsets.length,
                    offset: 0,
                    results: metadata.bedsets.map((bedset) => ({
                      id: bedset.id,
                      name: bedset.name || '',
                      description: bedset.description || '',
                      md5sum: '',
                      bed_ids: [],
                    })),
                  }}
                  showBEDCount={false}
                />
              </div>
            </div>
          )}

          {neighbours && (
            <div className='row mb-3'>
              <div className='col-12'>
                <div className='d-flex justify-content-between align-items-center px-0'>
                  <h5 className='fw-bold px-0'>Similar BED Files</h5>
                  {/* <div className='form-check form-switch form-switch-sm'>
                    <input
                      className='form-check-input'
                      type='checkbox'
                      checked={showNeighbors}
                      id='showNeighbors'
                      onChange={() => setShowNeighbors(!showNeighbors)}
                    />
                    <label
                      className='form-check-label fw-medium text-sm'
                      htmlFor='showNeighbors'
                    >
                      Show in Atlas
                    </label>
                  </div> */}
                </div>
                <Text2BedSearchResultsTable results={neighbours} />
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }
};

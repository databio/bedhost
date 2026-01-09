import { useParams } from 'react-router-dom';
import { useBedMetadata } from '../queries/useBedMetadata';
import { useBedGenomeStats } from '../queries/useBedGenomeStats';
import { Layout } from '../components/layout';
import { BedSplashHeader } from '../components/bed-splash-components/header';
import { CardSkeleton } from '../components/skeletons/card-skeleton';
import { ErrorPage } from '../components/common/error-page';
import { Plots } from '../components/bed-splash-components/plots';
import { AxiosError } from 'axios';
import { snakeToTitleCase } from '../utils';
import { Text2BedSearchResultsTable } from '../components/search/text2bed/t2b-search-results-table';
import { useBedNeighbours } from '../queries/useBedNeighbours';
import type { components } from '../../bedbase-types.d.ts';
import { SearchBedSetResultTable } from '../components/search/text2bedset/t2bs-search-results-table.tsx';
import { EmbeddingContainer } from '../components/umap/embedding-container.tsx';
import { useState, useRef } from 'react';
import type { EmbeddingContainerRef } from '../components/umap/embedding-container.tsx';
import { Text2BedSearchResultsCards } from '../components/search/text2bed/t2b-search-results-cards.tsx';
import { SearchBedSetResultCards } from '../components/search/text2bedset/t2bs-search-results-cards.tsx';

type BedMetadata = components['schemas']['BedMetadataAll'];

export const BedSplash = () => {
  const params = useParams();
  const bedId = params.id;

  const [similarTabular, setSimilarTabular] = useState(true);
  const [bedsetsTabular, setBedsetsTabular] = useState(true);
  const embeddingPlotRef = useRef<EmbeddingContainerRef>(null);

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
    limit: 9,
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

  const metadataRow = (k: string) => {
    const value = getAnnotationValue(metadata, k);
    if (!value) return null;

    return (
      <tr key={k}>
        <td style={{ width: '200px' }} className='text-muted p-0 pb-1'>
        {/* <td style={{ width: '200px' }} className='fst-italic text-muted p-0 pb-1 text-end'> */}
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
                      <a 
                        className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover fw-medium fst-italic' 
                        key={i} 
                        href={'https://www.encodeproject.org/files/' + v.replace('encode:', '')}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {v}
                      </a>
                    ) : v.includes('geo:') ? (
                      <a 
                        className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover fw-medium fst-italic'
                        key={i} 
                        href={'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' + v.replace('geo:', '')}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
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
                        <a 
                          className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover fw-medium fst-italic'
                          key={i} 
                          href={'https://www.encodeproject.org'}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {v}
                        </a>
                      ) : v.includes('geo:') ? (
                        <a 
                          className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover fw-medium fst-italic'
                          key={i} 
                          href={'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' + v.replace('geo:', '')}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
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
            <div className='col-12 col-xl-6'>
              <h5 className='fw-bold'>Overview</h5>
              <div className='row'>
                <div className='col-12 mt-0'>
                  <div className='text-sm'>
                    <table className='table table-sm table-borderless table-transparent mb-0'>
                      <tbody>{filteredKeys.map(metadataRow)}</tbody>
                    </table>
                  </div>
                </div>
                
              </div>
            </div>
            {bedId && metadata?.name?.includes('encode') && (
              <div className='col-md-6 gap-2'>
                <div className='border rounded bg-white overflow-hidden embedding-card'>
                  <EmbeddingContainer 
                    ref={embeddingPlotRef}
                    bedIds={[bedId]} 
                    height={filteredKeys.length * 24} 
                    preselectPoint={true} 
                    centerInitial={true} 
                    tooltipInitial={true} 
                    simpleTooltip={true} 
                    blockCompact={true} 
                    showBorder={false} 
                  />
                  <div className='text-center'>
                    <p className='fw-medium text-xs bg-body-secondary border-top p-2 mb-0'>Region Embeddings Location</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className='row mb-0 g-2'>
            <div className='d-flex flex-row gap-4 justify-content-center mt-5 mb-4 pb-2 text-muted'>
              <span>
                <strong className='text-primary'>{(metadata?.stats?.number_of_regions || 0).toLocaleString()}</strong> regions
              </span>
              <span>•</span>
              <span>
                <strong className='text-success'>{(metadata?.stats?.median_tss_dist  || 0).toLocaleString()} bp</strong> median TSS distance
              </span>
              <span>•</span>
              <span>
                <strong className='text-info'>{(metadata?.stats?.mean_region_width  || 0).toLocaleString()} bp</strong> mean region width
              </span>
              <span>•</span>
              <span>
                <strong className='text-secondary'>{(metadata?.stats?.gc_content  || 0).toLocaleString()}</strong> GC content
              </span>
            </div>
            
          </div>

          <div className='row mb-4'>
            <h5 className='fw-bold'>Plots</h5>
            <div className='col-sm-12'>
              <Plots metadata={metadata!} />
            </div>
          </div>

          {metadata?.bedsets && metadata.bedsets.length > 0 && (
            <div className={`row ${bedsetsTabular ? 'mb-4' : 'mb-3'}`}>
              <div className='col-12'>
                <div className='d-flex justify-content-between align-items-center px-0'>
                  <h5 className='fw-bold px-0'>BEDsets</h5>
                  <div className='form-check form-switch form-switch-sm'>
                    <input
                      className='form-check-input'
                      type='checkbox'
                      checked={bedsetsTabular}
                      id='bedsetsTabular'
                      onChange={() => setBedsetsTabular(!bedsetsTabular)}
                    />
                    <label
                      className='form-check-label fw-medium text-sm'
                      htmlFor='bedsetsTabular'
                    >
                      Tabular View
                    </label>
                  </div>
                </div>
                {bedsetsTabular ? (
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
                  />
                ) : (
                  <SearchBedSetResultCards
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
                    showBEDCount={true}
                  />
                )}
              </div>
            </div>
          )}

          {neighbours && (
            <div className={`row ${similarTabular ? 'mb-4' : 'mb-3'}`}>
              <div className='col-12'>
                <div className='d-flex justify-content-between align-items-center px-0'>
                  <h5 className='fw-bold px-0'>Similar BED Files</h5>
                  <div className='form-check form-switch form-switch-sm'>
                    <input
                      className='form-check-input'
                      type='checkbox'
                      checked={similarTabular}
                      id='similarTabular'
                      onChange={() => setSimilarTabular(!similarTabular)}
                    />
                    <label
                      className='form-check-label fw-medium text-sm'
                      htmlFor='similarTabular'
                    >
                      Tabular View
                    </label>
                  </div>
                </div>
                {similarTabular ? (
                  <Text2BedSearchResultsTable results={neighbours} />
                ) : (
                  <Text2BedSearchResultsCards results={neighbours} />
                )}
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }
};

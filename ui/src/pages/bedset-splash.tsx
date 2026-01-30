import { useParams } from 'react-router-dom';
import { Layout } from '../components/layout';
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
        <div className='my-2'>
          <div className='row'>
            <div className='col-12'>
              <div className='mb-2'>
                <CardSkeleton height='100px' />
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='col-12 col-md-5'>
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
            <div className='col-12 col-md-7'>
              <CardSkeleton height='100%' />
            </div>
          </div>
        </div>
      </Layout>
    );
  } else if (error) {
    if ((error as AxiosError)?.response?.status || 200 in [404, 422]) {
      return (
        <Layout title={`BEDbase | ${bedsetId}`} footer>
          <div
            className='mt-5 w-100 d-flex flex-column align-items-center justify-content-center'
            style={{ height: '50vh' }}
          >
            <h1 className='fw-bold text-center mb-3'>Oh no!</h1>
            <div className='d-flex flex-row align-items-center w-100 justify-content-center'>
              <h5 className='text-2xl text-center'>
                We could not find BEDset with record identifier: <br />
                <span className='fw-bold'>{bedsetId}</span>
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
    }
  } else {
    return (
      <Layout title={`BEDbase | ${bedsetId}`} footer fullHeight>
        <div className='container my-2'>
          <div className='row mb-2'>
            <div className='col-12'>
              {metadata !== undefined && bedfiles ? (
                <BedsetSplashHeader metadata={metadata} beds={bedfiles.results} />
              ) : null}
            </div>
          </div>

          <div className='row mt-3 mb-4 g-2'>
            <h5 className='fw-bold mt-0'>Statistics</h5>
            {metadata && (
              <div className='col-12 col-md-3 d-flex flex-column mt-0 gap-2'>
                <MeanRegionWidthCard metadata={metadata} />
                <MedianTssDistCard metadata={metadata} />
                <GCContentCard metadata={metadata} />
              </div>
            )}
            <div className='col-12 col-md-9 h-100 align-items-stretch mt-2 mt-md-0'>
              <GenomicFeatureBar metadata={metadata!} />
            </div>
          </div>

          <div className='row mb-4'>
            <div className='col-12'>
              <h5 className='fw-bold'>Plots</h5>
              <Plots metadata={metadata!} />
            </div>
          </div>

          <div className='row mb-4'>
            <h5 className='fw-bold'>Constituent BED Files</h5>
            <div className='col-12'>
              {isLoadingBedfiles ? (
                <div className='mt-2 mb-5'>
                  <CardSkeleton height='100px' />
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className='mb-2'>
                      <CardSkeleton height='15px' />
                    </div>
                  ))}
                </div>
              ) : (
                bedfiles && <BedsTable beds={bedfiles.results} />
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }
};

import { components } from '../../../../bedbase-types';
import { useNavigate } from 'react-router-dom';

type SearchResponse = components['schemas']['BedSetListResult'];

type Props = {
  results: SearchResponse;
  showBEDCount?: boolean;
};

export const SearchBedSetResultTable = (props: Props) => {
  const { results, showBEDCount } = props;
  const navigate = useNavigate();

  return (
    <>
      {results.results?.map((result) => (
        <div className='card bg-white border mb-2 overflow-hidden' key={result.id}>
          <div className='d-flex'>
            <div
              className='card-body position-relative flex-1 pt-2 mb-0 cursor-pointer btn-card btn-outline-primary border-0 rounded-0'
              onClick={() => navigate(`/bedset/${result.id}`)}
            >
              <div className='d-flex justify-content-between align-items-center mb-2 pt-1'>
                <div className='d-flex gap-2 align-items-center'>
                  <p className='fw-semibold mb-0 flex-grow-1'>{result?.name || 'No name'}</p>
                </div>

                {showBEDCount && (
                  <div className='d-flex align-items-center text-sm'>
                    <span className='badge bg-secondary'>{result?.bed_ids?.length || 0} BEDs</span>
                  </div>
                )}
              </div>
              <p className='text-xs text-muted fst-italic mb-0 pb-0 text-start'>
                {result?.description || 'No description'}
              </p>

              {/* <div className='d-flex flex-wrap gap-1 text-sm'>
                <span className='text-muted badge border fw-medium text-bg-light'>
                  <span className='text-body-tertiary'>ID:</span>{' '}{result?.id || 'N/A'}
                </span>
              </div> */}
            </div>

            <div className='d-flex flex-column border-start' style={{ width: '42px' }}>
              <button
                className='btn btn-outline-primary rounded-0 border-0 flex-fill'
                onClick={() => navigate(`/bedset/${result.id}`)}
              >
                <i className='bi bi-chevron-right'></i>
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

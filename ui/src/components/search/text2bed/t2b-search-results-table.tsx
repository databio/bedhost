// import { ProgressBar } from 'react-bootstrap';
import { components } from '../../../../bedbase-types';
import { roundToTwoDecimals } from '../../../utils';
import { useBedCart } from '../../../contexts/bedcart-context';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import toast from 'react-hot-toast';
import YAML from 'js-yaml';
import { useNavigate } from 'react-router-dom';

type SearchResponse = components['schemas']['BedListSearchResult'];
// type BedNeighboursResponse = components['schemas']['BedNeighboursResult'];

type Props = {
  results: SearchResponse;
  search_query?: string | undefined;
  onCardClick?: (bedId: string) => void;
};

const IsUnique = (found_id: string, search_id: string) => {
  if (found_id === search_id) {
    return (
      <div className='d-flex'>
        <OverlayTrigger
          placement='top'
          overlay={
            <div className='tooltip'>
              <div className='tooltip-inner'>Perfect match</div>
            </div>
          }
        >
          <i className='bi bi-check-all text-primary' />
        </OverlayTrigger>
      </div>
    );
  } else {
    return;
  }
};

export const Text2BedSearchResultsTable = (props: Props) => {
  const { results, search_query, onCardClick } = props;
  const { cart, addBedToCart, removeBedFromCart } = useBedCart();
  const navigate = useNavigate();

  return (
    <>
      {results.results?.map((result) => (
        <div className='card bg-white border mb-2 overflow-hidden' key={result.id}>
          <div className='d-flex'>
            <div
              className='card-body position-relative cursor-pointer flex-1'
              onClick={() => onCardClick?.(result.metadata?.id || '')}
            >
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <div className='d-flex gap-0 align-items-center'>
                  <p className='fs-6 fw-semibold mb-0 flex-grow-1 pe-2'>
                    {result?.metadata?.name || 'No name'}
                  </p>
                  <OverlayTrigger
                    placement='left'
                    overlay={
                      <Tooltip id={`tooltip-${result.id}`} className='moreinfo-tooltip'>
                        <pre className='text-start m-0' style={{ fontSize: '11px' }}>
                          {YAML.dump(result?.metadata, {
                            indent: 2,
                            noRefs: true,
                          }) || 'No metadata'}
                        </pre>
                      </Tooltip>
                    }
                  >
                    <i className='bi bi-three-dots cursor-pointer' onClick={(e) => e.stopPropagation()}></i>
                  </OverlayTrigger>
                </div>
                
                <div className='d-flex gap-1 align-items-center'>
                  {IsUnique(result.id, search_query || '')}
                  <OverlayTrigger
                    placement='top'
                    overlay={
                      <div className='tooltip'>
                        <div className='tooltip-inner'>Match score</div>
                      </div>
                    }
                  >
                    <span className='badge bg-primary' style={{ fontSize: '10px' }}>
                      {roundToTwoDecimals((result.score ?? 0) * 100)}%
                    </span>
                  </OverlayTrigger>
                </div>
              </div>
              <p className='text-xs text-muted fst-italic'>
                {result?.metadata?.description || 'No description'}
              </p>

              <div className={`d-flex flex-wrap gap-1`}>
                <span className='text-muted badge border fw-medium text-bg-light' style={{ fontSize: '10px' }}>
                  <span className='text-body-tertiary'>genome:</span>{' '}{result?.metadata?.genome_alias || 'N/A'}
                </span>
                <span className='text-muted badge border fw-medium text-bg-light' style={{ fontSize: '10px' }}>
                  <span className='text-body-tertiary'>tissue:</span>{' '}{result?.metadata?.annotation?.tissue || 'N/A'}
                </span>
                <span className='text-muted badge border fw-medium text-bg-light' style={{ fontSize: '10px' }}>
                  <span className='text-body-tertiary'>cell_line:</span>{' '}{result?.metadata?.annotation?.cell_line || 'N/A'}
                </span>
                <span className='text-muted badge border fw-medium text-bg-light' style={{ fontSize: '10px' }}>
                  <span className='text-body-tertiary'>cell_type:</span>{' '}{result?.metadata?.annotation?.cell_type || 'N/A'}
                </span>
                <span className='text-muted badge border fw-medium text-bg-light' style={{ fontSize: '10px' }}>
                  <span className='text-body-tertiary'>assay:</span>{' '}{result?.metadata?.annotation?.assay || 'N/A'}
                </span>
              </div>
            </div>

            <div className='d-flex flex-column border-start' style={{ width: '42px' }}>
              <button
                className='btn btn-outline-primary rounded-0 border-0 border-bottom flex-fill'
                onClick={() => navigate(`/bed/${result.metadata?.id}`)}
                style={{ borderBottom: '1px solid white' }}
              >
                <i className='bi bi-chevron-right'></i>
              </button>
              {cart[result?.metadata?.id || ''] ? (
                <button
                  className='btn btn-danger rounded-0 border-0 flex-fill'
                  onClick={(e) => {
                    e.stopPropagation();
                    if (result.metadata?.id === undefined) {
                      toast.error('No bed ID found', { position: 'top-center' });
                      return;
                    }
                    removeBedFromCart(result.metadata?.id);
                  }}
                >
                  <i className='bi bi-cart-dash'></i>
                </button>
              ) : (
                <button
                  className='btn btn-primary rounded-0 border-0 flex-fill'
                  onClick={(e) => {
                    e.stopPropagation();
                    if (result.metadata?.id === undefined) {
                      toast.error('No bed ID found', { position: 'top-center' });
                      return;
                    }
                    const bedItem = {
                      id: result.metadata.id,
                      name: result.metadata.name || 'No name',
                      genome: result.metadata.genome_alias || 'N/A',
                      tissue: result.metadata.annotation?.tissue || 'N/A',
                      cell_line: result.metadata.annotation?.cell_line || 'N/A',
                      cell_type: result.metadata.annotation?.cell_type || 'N/A',
                      description: result.metadata.description || '',
                      assay: result.metadata.annotation?.assay || 'N/A',
                    };
                    addBedToCart(bedItem);
                  }}
                >
                  <i className='bi bi-cart-plus'></i>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
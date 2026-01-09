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
  layout?: string;
  onCardClick?: (bedId: string) => void;
};

export const Text2BedSearchResultsCards = (props: Props) => {
  const { results, search_query, layout, onCardClick } = props;
  const { cart, addBedToCart, removeBedFromCart } = useBedCart();
  const navigate = useNavigate();

  return (
    <>
      {results.results?.map((result) => (
        <div className='card bg-white border mb-2 overflow-hidden' key={result.id}>
          <div className='d-flex'>
            <div
              className={`card-body position-relative flex-1 pt-2 mb-0 ${'cursor-pointer btn-card btn-outline-primary border-0 rounded-0'}`}
              onClick={() => {
                // if (layout === 'cards') {
                //   onCardClick?.(result.metadata?.id || '');
                //   return;
                // }
                navigate(`/bed/${result.metadata?.id}`);
              }}
            >
              <div className='d-flex align-items-center mb-2 pt-1'>
                <div className='d-flex gap-2 align-items-center'>
                  <p className='text-sm fw-semibold mb-0 flex-grow-1'>{result?.metadata?.name || 'No name'}</p>
                </div>
                <div className='d-flex gap-1 align-items-center text-sm ms-2'>
                  {result.id === (search_query || '') && <i className='bi bi-check-all text-primary' />}
                  <OverlayTrigger
                    placement='top'
                    overlay={
                      <Tooltip id={`tooltip-${result.score}`} className='moreinfo-tooltip text-xs'>
                        <pre className='mb-0'>Cosine similarity between files.</pre>
                        <pre className='mb-0'>Score is between 0 and 100,</pre>
                        <pre className='mb-0'>where 100 is a perfect match.</pre>
                      </Tooltip>
                    }
                  >
                    <span className={`badge ${(result.score ?? 0) > 0.5 ? 'bg-primary' : 'bg-secondary'}`}>
                      {roundToTwoDecimals((result.score ?? 0) * 100)}%
                    </span>
                  </OverlayTrigger>
                  <span className='text-muted badge border fw-medium text-bg-light'>
                    <span className='text-body-tertiary'>genome:</span> {result?.metadata?.genome_alias || 'N/A'}
                  </span>
                  <span className='text-muted badge border fw-medium text-bg-light'>
                    <span className='text-body-tertiary'>tissue:</span> {result?.metadata?.annotation?.tissue || 'N/A'}
                  </span>
                  <span className='text-muted badge border fw-medium text-bg-light'>
                    <span className='text-body-tertiary'>cell_line:</span>{' '}
                    {result?.metadata?.annotation?.cell_line || 'N/A'}
                  </span>
                  <span className='text-muted badge border fw-medium text-bg-light'>
                    <span className='text-body-tertiary'>cell_type:</span>{' '}
                    {result?.metadata?.annotation?.cell_type || 'N/A'}
                  </span>
                  <span className='text-muted badge border fw-medium text-bg-light'>
                    <span className='text-body-tertiary'>assay:</span> {result?.metadata?.annotation?.assay || 'N/A'}
                  </span>
                </div>
                <div className='d-flex gap-2 align-items-center ms-auto'>
                  <OverlayTrigger
                    placement={layout === 'cards' ? 'left' : 'left'}
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
                    <i className='bi bi-three-dots' onClick={(e) => e.stopPropagation()}></i>
                  </OverlayTrigger>
                </div>
              </div>
              <p className='text-xs text-muted fst-italic mb-0 text-start'>
                {result?.metadata?.description || 'No description'}
              </p>
            </div>

            <div className='d-flex flex-column border-start' style={{ width: '42px' }}>
              {!!onCardClick && (
                <button
                  className='btn btn-outline-primary rounded-0 border-0 border-bottom flex-fill'
                  onClick={() => onCardClick?.(result.metadata?.id || '')}
                  style={{ borderBottom: '1px solid white' }}
                  title='Locate in Embeddings'
                >
                  <i className='bi bi-pin-map'></i>
                </button>
              )}
              {cart[result?.metadata?.id || ''] ? (
                <button
                  className='btn btn-danger rounded-0 border-0 flex-fill'
                  title='Remove from Cart'
                  onClick={(e) => {
                    e.stopPropagation();
                    if (result.metadata?.id === undefined) {
                      toast.error('No bed ID found');
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
                  title='Add to Cart'
                  onClick={(e) => {
                    e.stopPropagation();
                    if (result.metadata?.id === undefined) {
                      toast.error('No bed ID found');
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

// import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { components } from '../../../../bedbase-types';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { roundToTwoDecimals } from '../../../utils';
import YAML from 'js-yaml';
import { useBedCart } from '../../../contexts/bedcart-context';
import toast from 'react-hot-toast';

type Bed = components['schemas']['QdrantSearchResult'];

type Props = {
  results: Bed[];
  layout?: string;
  onCardClick?: (bedId: string) => void;
};

export const Bed2BedSearchResultsCards = (props: Props) => {
  const { results, layout, onCardClick } = props;
  const { cart, addBedToCart, removeBedFromCart } = useBedCart();
  const navigate = useNavigate();

  // const [sorting, setSorting] = useState<SortingState>([]);
  // const [pagination, setPagination] = useState<PaginationState>({
  //   pageIndex: 0,
  //   pageSize: 20,
  // });

  return (
    <>
      {results?.map((result) => (
        <div className='card bg-white border mb-2 overflow-hidden' key={result.id}>
          <div className='d-flex'>
            <div
              className={`card-body position-relative flex-1 pt-2 mb-0 ${(layout === 'split') && 'cursor-pointer btn-card btn-outline-primary border-0 rounded-0'}`}
              onClick={() => {
                if (layout === 'split') {
                  onCardClick?.(result.metadata?.id || '')
                }
              }}
            >
              <div className='d-flex justify-content-between align-items-center mb-2 pt-1'>
                <div className='d-flex gap-2 align-items-center'>
                  <p className='fw-semibold mb-0 flex-grow-1'>
                    {result?.metadata?.name || 'No name'}
                  </p>
                  <OverlayTrigger
                    placement={layout === 'split' ? 'left' : 'right'}
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
                
                <div className='d-flex gap-1 align-items-center text-sm'>
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
                </div>
              </div>
              <p className='text-xs text-muted fst-italic mb-2 pb-1 text-start'>
                {result?.metadata?.description || 'No description'}
              </p>

              <div className='d-flex flex-wrap gap-1 text-sm'>
                <span className='text-muted badge border fw-medium text-bg-light'>
                  <span className='text-body-tertiary'>genome:</span>{' '}{result?.metadata?.genome_alias || 'N/A'}
                </span>
                <span className='text-muted badge border fw-medium text-bg-light'>
                  <span className='text-body-tertiary'>tissue:</span>{' '}{result?.metadata?.annotation?.tissue || 'N/A'}
                </span>
                <span className='text-muted badge border fw-medium text-bg-light'>
                  <span className='text-body-tertiary'>cell_line:</span>{' '}{result?.metadata?.annotation?.cell_line || 'N/A'}
                </span>
                <span className='text-muted badge border fw-medium text-bg-light'>
                  <span className='text-body-tertiary'>cell_type:</span>{' '}{result?.metadata?.annotation?.cell_type || 'N/A'}
                </span>
                <span className='text-muted badge border fw-medium text-bg-light'>
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

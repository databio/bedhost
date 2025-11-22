import { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { components } from '../../../bedbase-types';
import { useBedCart } from '../../contexts/bedcart-context';
import { DownloadBedSetModal } from '../modals/download-bedset-modal';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { formatDateTime } from '../../utils.ts';

type Bed = components['schemas']['BedSetBedFiles']['results'][number];

type BedSetMetadata = components['schemas']['BedSetMetadata'];
type Props = {
  metadata: BedSetMetadata;
  beds: Bed[];
};

const API_BASE = import.meta.env.VITE_API_BASE || '/';

export const BedsetSplashHeader = (props: Props) => {
  const { metadata, beds } = props;

  const [, copyToClipboard] = useCopyToClipboard();
  const { cart, addMultipleBedsToCart, removeMultipleBedsFromCart } = useBedCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  return (
    <div className='border-bottom py-2'>
      <div className='d-flex flex-column flex-lg-row align-items-start justify-content-lg-between mb-3 mb-lg-0'>
        <div className='d-flex align-items-center overflow-x-auto w-100 mb-3'>
          <h5 className='fw-bolder d-flex align-items-center flex-nowrap mb-0'>
            <span className='text-truncate'>{metadata?.id || 'No ID available'}</span>
            <button
              className='btn btn-sm btn-link text-primary mb-0'
              onClick={() => {
                copyToClipboard(metadata.id || '');
                setCopiedId(true);
                setTimeout(() => {
                  setCopiedId(false);
                }, 1000);
              }}
            >
              {copiedId ? <i className='bi bi-check me-1' /> : <i className='bi bi-clipboard me-1' />}
            </button>
          </h5>
        </div>
        <div className='d-flex flex-column flex-lg-row align-items-start align-items-lg-end gap-1 flex-shrink-0'>
          {/*  TODO: change hg38 on correct genome */}
          {/*<a href={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&hubUrl=https://api-dev.bedbase.org/v1/bedset/${metadata.id}/track_hub`}>*/}
          {(metadata.bed_ids?.length || 0) <= 20 && (
            <a
              href={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&hubUrl=${API_BASE}/bedset/${metadata.id}/track_hub`}
              target='_blank'
            >
              <button className='btn btn-outline-primary btn-sm'>
                <i className='bi bi-distribute-vertical me-1' />
                Genome Browser
              </button>
            </a>
          )}

          <a href={`${API_BASE}/bedset/${metadata.id}/metadata?full=true`}>
            <button className='btn btn-outline-primary btn-sm'>
              <i className='bi bi-info-circle me-1' />
              API
            </button>
          </a>
          {
            // cart includes all bed ids?
            metadata.bed_ids?.every((bedId) => cart[bedId]) && !addedToCart ? (
              <button
                onClick={() => removeMultipleBedsFromCart(metadata.bed_ids || [])}
                className='btn btn-outline-danger btn-sm'
              >
                <i className='bi bi-cart-x me-1' />
                Remove beds from cart
              </button>
            ) : (
              <button
                onClick={
                  metadata.bed_ids?.length === 0
                    ? undefined
                    : () => {
                        const bedItems = beds.map((bed) => ({
                          id: bed.id,
                          name: bed.name || 'No name',
                          genome: bed.genome_alias || 'N/A',
                          tissue: bed.annotation?.tissue || 'N/A',
                          cell_line: bed.annotation?.cell_line || 'N/A',
                          cell_type: bed.annotation?.cell_type || 'N/A',
                          description: bed.description || 'N/A',
                          assay: bed.annotation?.assay || 'N/A',
                        }));

                        addMultipleBedsToCart(bedItems);
                        setAddedToCart(true);
                        setTimeout(() => {
                          setAddedToCart(false);
                        }, 500);
                      }
                }
                disabled={metadata.bed_ids?.length === 0 || addedToCart}
                className='btn btn-primary btn-sm'
              >
                <i className='bi bi-cart-plus me-1' />
                {addedToCart ? 'Added files to cart!' : `Add ${metadata.bed_ids?.length || 0} BEDs to cart`}
              </button>
            )
          }

          <Dropdown>
            <Dropdown.Toggle variant='outline-primary' id='dropdown-basic' size='sm'>
              <i className='bi bi-download me-1' />
              Downloads
            </Dropdown.Toggle>
            <Dropdown.Menu className='border border-light-subtle'>
              <Dropdown.Item className='text-primary' onClick={() => setShowDownloadModal(true)}>
                Download BEDset
              </Dropdown.Item>
              <Dropdown.Item className='text-primary' href={`${API_BASE}/bedset/${metadata.id}/pep`}>
                Download PEP
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
      <div className='text-body-secondary fst-italic'>
        <p className='mb-0 text-sm'>{metadata?.description || 'No description available'}</p>
        <p className='mb-0 text-sm'>Author: {metadata?.author || 'None'}</p>
        <p className='text-sm'>Source: {metadata?.source || 'None'}</p>
      </div>
      <div className='d-flex flex-column flex-xl-row align-items-start align-items-xl-end justify-content-xl-between mt-2 overflow-x-auto'>
        <div className='d-flex flex-column flex-md-row gap-1 text-lg'>
          <p className='mb-0'>
            <div className='badge bg-primary'>
              <i className='bi bi-hash me-1' />
              {metadata.md5sum}
            </div>
          </p>
          {metadata.bed_ids && (
            <p className='mb-0'>
              <div className='badge bg-primary'>
                <i className='bi bi-file-earmark-text me-1' />
                {metadata.bed_ids?.length} BED files
              </div>
            </p>
          )}
        </div>

        <div className='d-flex flex-column flex-md-row justify-content-xl-between align-items-start align-items-xl-end text-sm'>
          <div className='d-flex flex-row text-muted'>
            <i className='bi bi-calendar4-event me-1' />
            <p className='mb-0'>
              <span>Created:</span>{' '}
              {metadata?.submission_date ? formatDateTime(metadata?.submission_date) : 'No date available'}
            </p>
          </div>

          <div className='d-flex flex-row text-muted ms-lg-4'>
            <i className='bi bi-calendar4-event me-1' />
            <p className='mb-0'>
              <span>Updated:</span>{' '}
              {metadata?.last_update_date ? formatDateTime(metadata?.last_update_date) : 'No date available'}
            </p>
          </div>
        </div>
      </div>
      <DownloadBedSetModal id={metadata.id} show={showDownloadModal} setShow={setShowDownloadModal} />
    </div>
  );
};

import { useBedCart } from '../../contexts/bedcart-context';
import toast from 'react-hot-toast';
import { Fragment, useState } from 'react';
import { components } from '../../../bedbase-types';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { bytesToSize } from '../../utils';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { RefGenomeModal } from './refgenome-modal';

const API_BASE = import.meta.env.VITE_API_BASE || '';

type BedMetadata = components['schemas']['BedMetadataAll'];
type BedGenomeStats = components['schemas']['RefGenValidReturnModel'];

type Props = {
  metadata: BedMetadata;
  record_identifier: string | undefined;
  genomeStats: BedGenomeStats | undefined;
};

export const BedSplashHeader = (props: Props) => {
  const { metadata, record_identifier, genomeStats } = props;

  const [, copyToClipboard] = useCopyToClipboard();
  const { cart, addBedToCart, removeBedFromCart } = useBedCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showRefGenomeModal, setShowRefGenomeModal] = useState(false);

  const noFilesToDownload = !metadata.files?.bed_file && !metadata.files?.bigbed_file;

  return (
    <div className='border-bottom py-2'>
      <div className='d-flex flex-column flex-lg-row align-items-start justify-content-lg-between mb-3 mb-lg-0'>
        <div className='d-flex align-items-center overflow-x-auto w-100 mb-3'>
          <h5 className='fw-light d-flex align-items-center flex-nowrap mb-0'>
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
        {!metadata?.processed && (
          <p className='text-warning text-nowrap me-1 btn btn-outline btn-sm transparent-btn'>
            <OverlayTrigger
              placement='top'
              overlay={
                <Tooltip id='tooltip-top'>This file has not been processed by the BedBoss pipeline yet.</Tooltip>
              }
            >
              <span>
                <i className='bi bi-exclamation-triangle-fill me-1'></i>
                Not Processed
              </span>
            </OverlayTrigger>
          </p>
        )}

        <div className='d-flex flex-col align-items-center gap-1 flex-shrink-0'>
          {metadata?.processed && metadata?.genome_alias == 'hg38' && (
            <a href={`/umap?searchId=${record_identifier}`}>
              <button className='btn btn-outline-primary btn-sm'>
                <i className='bi bi-pin-map me-1' />
                Embeddings
              </button>
            </a>
          )}
          <a href={`/analyze?bedUrl=${record_identifier}`}>
            <button className='btn btn-outline-primary btn-sm'>
              <i className='bi bi-bar-chart-steps me-1' />
              Analyze
            </button>
          </a>
          <a href={`${API_BASE}/bed/${record_identifier}/metadata?full=true`}>
            <button className='btn btn-outline-primary btn-sm'>
              <i className='bi bi-info-circle me-1' />
              API
            </button>
          </a>
          {!addedToCart && cart[record_identifier || ''] ? (
            <button
              className='btn btn-outline-danger btn-sm'
              onClick={() => {
                if (record_identifier == undefined || metadata === undefined) {
                  toast.error(
                    'This bed file does not have a record identifier... please contact the administrator to fix this issue.',
                  );
                  return;
                }
                removeBedFromCart(record_identifier);
              }}
            >
              <i className='bi bi-trash me-1' />
              Remove from cart
            </button>
          ) : (
            <button
              disabled={addedToCart}
              className='btn btn-primary btn-sm'
              onClick={() => {
                if (record_identifier === undefined || metadata === undefined) {
                  toast.error(
                    'This bed file does not have a record identifier... please contact the administrator to fix this issue.',
                  );
                  return;
                }

                // Create the bed item object with all required fields
                const bedItem = {
                  id: record_identifier,
                  name: metadata.name || 'No name',
                  genome: metadata.genome_alias || 'N/A',
                  tissue: metadata.annotation?.tissue || 'N/A',
                  cell_line: metadata.annotation?.cell_line || 'N/A',
                  cell_type: metadata.annotation?.cell_type || 'N/A',
                  description: metadata.description || '',
                  assay: metadata.annotation?.assay || 'N/A',
                };

                addBedToCart(bedItem);
                setAddedToCart(true);
                setTimeout(() => {
                  setAddedToCart(false);
                }, 500);
              }}
            >
              <i className='bi bi-cart-fill me-1' />
              {addedToCart ? 'Adding...' : 'Add to cart'}
            </button>
          )}
          <Dropdown>
            <Dropdown.Toggle variant='outline-primary' id='dropdown-basic' size='sm'>
              <i className='bi bi-download me-1' />
              Downloads
            </Dropdown.Toggle>
            {
              // If there are no files to download, disable the dropdown
              noFilesToDownload ? (
                <Dropdown.Menu className='border border-light-subtle'>
                  <Dropdown.Item disabled>There are no files to download</Dropdown.Item>
                </Dropdown.Menu>
              ) : (
                <Dropdown.Menu className='border border-light-subtle'>
                  {metadata.files?.bed_file && (
                    <Fragment>
                      {(metadata.files?.bed_file?.access_methods || []).map((method, index) => {
                        if (method.type === 'local' || method.type === 's3') {
                          return null;
                        }
                        return (
                          <Dropdown.Item className='text-primary' href={method.access_url?.url} key={index}>
                            {method.access_id ? 'BED file' : 'No download link available'} (
                            <span className='fw-bold'>{bytesToSize(metadata.files?.bed_file?.size || 0)}</span>)
                          </Dropdown.Item>
                        );
                      })}
                    </Fragment>
                  )}
                  {metadata.files?.bigbed_file && (
                    <Fragment>
                      {(metadata.files?.bigbed_file?.access_methods || []).map((method, index) => {
                        if (method.type === 'local' || method.type === 's3') {
                          return null;
                        }
                        return (
                          <Dropdown.Item className='text-primary' href={method.access_url?.url} key={index}>
                            {method.access_id ? 'BigBED file' : 'No download link available'} (
                            <span className='fw-bold'>{bytesToSize(metadata.files?.bigbed_file?.size || 0)}</span>)
                          </Dropdown.Item>
                        );
                      })}
                    </Fragment>
                  )}
                </Dropdown.Menu>
              )
            }
          </Dropdown>
        </div>
      </div>
      <div>
        <h5 className='mb-1 fw-bolder'>{metadata.name}</h5>
        <p className='text-muted fst-italic text-sm'>{metadata?.description || 'No description available'}</p>
      </div>
      <div className='d-flex flex-column flex-xl-row align-items-start align-items-xl-end justify-content-xl-between mt-2 overflow-x-auto'>
        <div className='d-md-flex flex-row gap-1 text-lg mb-2 mb-xl-0'>
          <div className='d-flex flex-row'>
            <div className='mb-0'>
              <OverlayTrigger
                placement='top'
                overlay={
                  <div className='tooltip'>
                    <div className='tooltip-arrow' />
                    <div className='tooltip-inner'>Genome assembly</div>
                  </div>
                }
              >
                {metadata?.genome_digest ? (
                  <>
                    <a
                      href={`http://refgenomes.databio.org/v3/genomes/splash/${metadata.genome_digest}`}
                      target='_blank'
                    >
                      <div
                        className={genomeStats?.compared_genome ? 'badge bg-primary rounded-end-0' : 'badge bg-primary'}
                      >
                        <i className='bi bi-database-fill me-2' />
                        {metadata.genome_alias || 'No assembly available'}
                      </div>
                    </a>
                  </>
                ) : (
                  <>
                    <div className='badge bg-primary rounded-end-0'>
                      <i className='bi bi-database-fill me-2' />
                      {metadata.genome_alias || 'No assembly available'}
                    </div>
                  </>
                )}
              </OverlayTrigger>
              {genomeStats?.compared_genome && (
                <OverlayTrigger
                  placement='top'
                  overlay={
                    <div className='tooltip'>
                      <div className='tooltip-arrow' />
                      <div className='tooltip-inner'>Genome compatibility details</div>
                    </div>
                  }
                >
                  <div
                    className='badge bg-primary border-start border-light rounded-start-0'
                    role='button'
                    onClick={() => {
                      if (showRefGenomeModal !== true) {
                        setShowRefGenomeModal(true);
                      }
                    }}
                  >
                    <i className='bi bi-info-circle-fill' />
                  </div>
                </OverlayTrigger>
              )}
            </div>
          </div>
          <div className='d-flex flex-row'>
            <div className='mb-0'>
              <OverlayTrigger
                placement='top'
                overlay={
                  <div className='tooltip'>
                    <div className='tooltip-arrow' />
                    <div className='tooltip-inner'>BED compliance</div>
                  </div>
                }
              >
                <div className='badge bg-primary'>
                  <i className='bi bi-file-earmark-text-fill me-1' />
                  {metadata?.bed_compliance || 'No compliance available'}
                </div>
              </OverlayTrigger>
            </div>
          </div>
          <div className='d-flex flex-row'>
            <div className='mb-0'>
              <OverlayTrigger
                placement='top'
                overlay={
                  <div className='tooltip'>
                    <div className='tooltip-arrow' />
                    <div className='tooltip-inner'>Data Format</div>
                  </div>
                }
              >
                <div className='badge bg-primary'>
                  <i className='bi bi-folder-fill me-1' />
                  {metadata?.data_format || 'No data format available'}
                </div>
              </OverlayTrigger>
            </div>
          </div>
          <div className='d-flex flex-row'>
            <div className='mb-0'>
              <a
                href={`http://purl.obolibrary.org/obo/${(metadata?.license_id || 'DUO:0000042').replace(/:/g, '_')}`}
                target='_blank'
              >
                <OverlayTrigger
                  placement='top'
                  overlay={
                    <div className='tooltip'>
                      <div className='tooltip-arrow' />
                      <div className='tooltip-inner'>License</div>
                    </div>
                  }
                >
                  <div className='badge bg-primary'>
                    <i className='bi bi-award-fill me-1' />
                    {metadata?.license_id || 'DUO:0000042'}
                  </div>
                </OverlayTrigger>
              </a>
            </div>
          </div>
          {metadata?.is_universe && (
            <div className='d-flex flex-row'>
              <div className='mb-0 cursor-default'>
                <OverlayTrigger
                  placement='top'
                  overlay={
                    <div className='tooltip'>
                      <div className='tooltip-arrow' />
                      <div className='tooltip-inner'>This BED file is part of the Universe</div>
                    </div>
                  }
                >
                  <div className='badge bg-secondary'>
                    <i className='bi bi bi-globe2 me-1' />
                    Universe
                  </div>
                </OverlayTrigger>
              </div>
            </div>
          )}
        </div>
      </div>
      {genomeStats?.compared_genome && (
        <RefGenomeModal
          show={showRefGenomeModal}
          onHide={() => {
            setShowRefGenomeModal(false);
          }}
          genomeStats={genomeStats}
        />
      )}
    </div>
  );
};

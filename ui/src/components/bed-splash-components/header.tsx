import { useBedCart } from '../../contexts/bedcart-context';
import toast from 'react-hot-toast';
import { Fragment, useState } from 'react';
import { components } from '../../../bedbase-types';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { bytesToSize, formatDateTime } from '../../utils';
import { Dropdown, OverlayTrigger } from 'react-bootstrap';

const API_BASE = import.meta.env.VITE_API_BASE || '';

type BedMetadata = components['schemas']['BedMetadataAll'];

type Props = {
  metadata: BedMetadata;
  record_identifier: string | undefined;
};

export const BedSplashHeader = (props: Props) => {
  const { metadata, record_identifier } = props;

  const [, copyToClipboard] = useCopyToClipboard();
  const { cart, addBedToCart, removeBedFromCart } = useBedCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const noFilesToDownload = !metadata.files?.bed_file && !metadata.files?.bigbed_file;

  return (
    <div className="border-bottom py-2">
      <div className="d-flex flex-column flex-md-row align-items-start justify-content-md-between mb-3 mb-md-1 overflow-x-scroll">
        <div className="d-flex align-items-center overflow-x-auto">
          <h4 className="fw-bold d-flex align-items-center flex-nowrap">
            <i className="bi bi-file-earmark-text me-2 flex-shrink-0" />
            <span className="text-truncate">{metadata?.id || 'No ID available'}</span>
            <button
              className="btn btn-link text-primary mb-0 ms-2 flex-shrink-0"
              onClick={() => {
                copyToClipboard(metadata.id || '');
                setCopiedId(true);
                setTimeout(() => {
                  setCopiedId(false);
                }, 1000);
              }}
            >
              {copiedId ? <i className="bi bi-check me-1" /> : <i className="bi bi-clipboard me-1" />}
            </button>
          </h4>
        </div>
        <div className="d-flex flex-col align-items-center gap-1">
          <a href={`${API_BASE}/bed/${record_identifier}/metadata?full=true`}>
            <button className="btn btn-outline-primary btn-sm">
              <i className="bi bi-info-circle me-1" />
              API
            </button>
          </a>
          {!addedToCart && cart.includes(record_identifier || '') ? (
            <button
              className="btn btn-outline-danger btn-sm"
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
              <i className="bi bi-trash me-1" />
              Remove from cart
            </button>
          ) : (
            <button
              disabled={addedToCart}
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (record_identifier == undefined) {
                  toast.error(
                    'This bed file does not have a record identifier... please contact the administrator to fix this issue.',
                  );
                  return;
                }
                addBedToCart(record_identifier);
                setAddedToCart(true);
                setTimeout(() => {
                  setAddedToCart(false);
                }, 500);
              }}
            >
              <i className="bi bi-cart-fill me-1" />
              {addedToCart ? 'Added to cart!' : 'Add to cart'}
            </button>
          )}
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" size="sm">
              <i className="bi bi-download me-1" />
              Downloads
            </Dropdown.Toggle>
            {
              // If there are no files to download, disable the dropdown
              noFilesToDownload ? (
                <Dropdown.Menu>
                  <Dropdown.Item disabled>There are no files to download</Dropdown.Item>
                </Dropdown.Menu>
              ) : (
                <Dropdown.Menu>
                  {metadata.files?.bed_file && (
                    <Fragment>
                      {(metadata.files?.bed_file?.access_methods || []).map((method) => {
                        if (method.type === 'local' || method.type === 's3') {
                          return null;
                        }
                        return (
                          <Dropdown.Item className="text-primary" href={method.access_url?.url}>
                            {method.access_id ? 'BED file' : 'No download link available'} (
                            <span className="fw-bold">{bytesToSize(metadata.files?.bed_file?.size || 0)}</span>)
                          </Dropdown.Item>
                        );
                      })}
                    </Fragment>
                  )}
                  {metadata.files?.bigbed_file && (
                    <Fragment>
                      {(metadata.files?.bigbed_file?.access_methods || []).map((method) => {
                        if (method.type === 'local' || method.type === 's3') {
                          return null;
                        }
                        return (
                          <Dropdown.Item className="text-primary" href={method.access_url?.url}>
                            {method.access_id ? 'BigBED file' : 'No download link available'} (
                            <span className="fw-bold">{bytesToSize(metadata.files?.bigbed_file?.size || 0)}</span>)
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
        <h5 className="fw-semibold mb-1">{metadata.name}</h5>
        <p className="text-body-secondary fst-italic">{metadata?.description || 'No description available'}</p>
      </div>
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-end justify-content-md-between mt-2 overflow-x-scroll">
        <div className="d-md-flex flex-row gap-1 text-lg mb-2 mb-md-0">
          <div className="d-flex flex-row">
            <p className="mb-0">
              <OverlayTrigger
                placement="top"
                overlay={
                  <div className="tooltip">
                    <div className="tooltip-arrow" />
                    <div className="tooltip-inner">Genome assembly</div>
                  </div>
                }
              >
                {metadata?.genome_digest ? (
                  <a href={`http://refgenomes.databio.org/v3/genomes/splash/${metadata.genome_digest}`} target="_blank">
                    <div className="badge bg-primary">
                      <i className="bi bi-database-fill me-2" />
                      {metadata.genome_alias || 'No assembly available'}
                    </div>
                  </a>
                ) : (
                  <div className="badge bg-primary">
                    <i className="bi bi-database-fill me-2" />
                    {metadata.genome_alias || 'No assembly available'}
                  </div>
                )}
              </OverlayTrigger>
            </p>
          </div>
          <div className="d-flex flex-row">
            <p className="mb-0">
              <OverlayTrigger
                placement="top"
                overlay={
                  <div className="tooltip">
                    <div className="tooltip-arrow" />
                    <div className="tooltip-inner">BED file format</div>
                  </div>
                }
              >
                <div className="badge bg-primary">
                  <i className="bi bi-file-earmark-text-fill me-1" />
                  {metadata?.bed_format || 'No format available'}
                </div>
              </OverlayTrigger>
            </p>
          </div>
          <div className="d-flex flex-row">
            <p className="mb-0">
              <OverlayTrigger
                placement="top"
                overlay={
                  <div className="tooltip">
                    <div className="tooltip-arrow" />
                    <div className="tooltip-inner">BED type</div>
                  </div>
                }
              >
                <div className="badge bg-primary">
                  <i className="bi bi-folder-fill me-1" />
                  {metadata?.bed_type || 'No bed type available'}
                </div>
              </OverlayTrigger>
            </p>
          </div>
          <div className="d-flex flex-row">
            <p className="mb-0">
              <a
                href={`http://purl.obolibrary.org/obo/${(metadata?.license_id || 'DUO:0000042').replace(/:/g, '_')}`}
                target="_blank"
              >
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <div className="tooltip">
                      <div className="tooltip-arrow" />
                      <div className="tooltip-inner">License</div>
                    </div>
                  }
                >
                  <div className="badge bg-primary">
                    <i className="bi bi-award-fill me-1" />
                    {metadata?.license_id || 'DUO:0000042'}
                  </div>
                </OverlayTrigger>
              </a>
            </p>
          </div>
          {metadata?.is_universe && (
            <div className="d-flex flex-row">
              <p className="mb-0 cursor-default">
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <div className="tooltip">
                      <div className="tooltip-arrow" />
                      <div className="tooltip-inner">This BED file is part of the Universe</div>
                    </div>
                  }
                >
                  <div className="badge bg-secondary">
                    <i className="bi bi bi-globe2 me-1" />
                    Universe
                  </div>
                </OverlayTrigger>
              </p>
            </div>
          )}
        </div>
        <div className="d-flex flex-column flex-md-row justify-content-md-between text-sm">
          <div className="d-flex flex-row text-muted">
            <i className="bi bi-calendar4-event me-1" />
            <p className="mb-0">
              <span>Created:</span>{' '}
              {metadata?.submission_date ? formatDateTime(metadata?.submission_date) : 'No date available'}
            </p>
          </div>

          <div className="d-flex flex-row text-muted">
            <i className="bi bi-calendar4-event me-1 ms-md-4" />
            <p className="mb-0">
              <span>Updated:</span>{' '}
              {metadata?.last_update_date ? formatDateTime(metadata?.last_update_date) : 'No date available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

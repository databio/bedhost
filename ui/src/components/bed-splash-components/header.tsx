import { useBedCart } from '../../contexts/bedcart-context';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { components } from '../../../bedbase-types';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { bytesToSize, formatDateTime, makeHttpDownloadLink, makeS3DownloadLink } from '../../utils';
import { Dropdown } from 'react-bootstrap';

const API_BASE = import.meta.env.VITE_API_BASE || '';

type BedMetadata = components['schemas']['BedMetadata'];

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

  const noFilesToDownload = metadata.files?.bedfile === undefined && metadata.files?.bedfile === undefined;

  return (
    <div className="border-bottom py-2">
      <div className="d-flex flex-row align-items-start justify-content-between mb-2 ">
        <div className="d-flex flex-column align-items-start">
          <h4 className="fw-bold mb-0">
            <i className="bi bi-file-earmark-text me-2" />
            {metadata?.name || 'No name available'}
            <button
              className="btn btn-link text-primary mb-2"
              onClick={() => {
                copyToClipboard(record_identifier || '');
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
        <div className="d-flex flex-row align-items-center gap-1">
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
                }, 1000);
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
                  <Dropdown.Header>HTTP</Dropdown.Header>
                  {metadata.files?.bedfile ? (
                    <Dropdown.Item href={makeHttpDownloadLink(metadata.id)}>
                      <i className="bi bi-file-earmark-arrow-down me-1" />
                      BEDfile {bytesToSize(metadata.files.bedfile.size || 0)}
                    </Dropdown.Item>
                  ) : null}
                  {metadata.files?.bigbedfile ? (
                    <Dropdown.Item href={makeHttpDownloadLink(metadata?.files.bigbedfile.path)}>
                      <i className="bi bi-file-earmark-arrow-down me-1" />
                      BigBedFile {bytesToSize(metadata.files.bigbedfile.size || 0)}
                    </Dropdown.Item>
                  ) : null}
                  <Dropdown.Divider />
                  <Dropdown.Header>S3</Dropdown.Header>
                  {metadata.files?.bedfile ? (
                    <Dropdown.Item href={makeS3DownloadLink(metadata.id)}>
                      <i className="bi bi-file-earmark-arrow-down me-1" />
                      BEDfile {bytesToSize(metadata.files.bedfile.size || 0)}
                    </Dropdown.Item>
                  ) : null}
                  {metadata.files?.bigbedfile ? (
                    <Dropdown.Item href={makeS3DownloadLink(metadata?.files.bigbedfile.path)}>
                      <i className="bi bi-file-earmark-arrow-down me-1" />
                      BigBedFile {bytesToSize(metadata.files.bigbedfile.size || 0)}
                    </Dropdown.Item>
                  ) : null}
                </Dropdown.Menu>
              )
            }
          </Dropdown>
        </div>
      </div>
      <div className="d-flex flex-row align-items-end justify-content-between">
        <div className="d-flex flex-row gap-1 text-lg">
          <div className="d-flex flex-row">
            <p className="mb-0">
              <a href={`http://refgenomes.databio.org/v3/genomes/splash/${metadata?.genome_digest}`} target="_blank">
                <div className="badge bg-primary">
                  <i className="bi bi-database-fill me-2" />
                  {metadata?.genome_alias || 'No assembly available'}
                </div>
              </a>
            </p>
          </div>
          <div className="d-flex flex-row">
            <p className="mb-0">
              <div className="badge bg-primary">
                <i className="bi bi-file-earmark-text-fill me-1" />
                {metadata?.bed_format || 'No format available'}
              </div>
            </p>
          </div>
          <div className="d-flex flex-row">
            <p className="mb-0">
              <div className="badge bg-primary">
                <i className="bi bi-folder-fill me-1" />
                {metadata?.bed_type || 'No bed type available'}
              </div>
            </p>
          </div>
          <div className="d-flex flex-row">
            <p className="mb-0">
              <div className="badge bg-primary">
                <i className="bi bi-folder-fill me-1" />
                {metadata.raw_metadata?.global_sample_id || 'No source available'}
              </div>
            </p>
          </div>
        </div>
        <div className="d-flex flex-column text-sm">
          <div className="d-flex flex-row align-items-center text-muted">
            <i className="bi bi-calendar me-1" />
            <p className="mb-0">
              <span>Created:</span>{' '}
              {metadata?.submission_date ? formatDateTime(metadata?.submission_date) : 'No date available'}
            </p>
          </div>
          <div className="d-flex flex-row align-items-center text-muted">
            <i className="bi bi-calendar-check me-1" />
            <p className="mb-0">
              <span>Last update:</span>{' '}
              {metadata?.last_update_date ? formatDateTime(metadata?.last_update_date) : 'No date available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

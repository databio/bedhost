import { useState } from 'react';
import { components } from '../../../bedbase-types';
import { useBedCart } from '../../contexts/bedcart-context';
import { DownloadBedSetModal } from '../modals/download-bedset-modal';
import { useCopyToClipboard } from '@uidotdev/usehooks';

type BedSetMetadata = components['schemas']['BedSetMetadata'];
type Props = {
  metadata: BedSetMetadata;
};

const API_BASE = import.meta.env.VITE_API_BASE || '/';

export const BedsetSplashHeader = (props: Props) => {
  const { metadata } = props;

  const [, copyToClipboard] = useCopyToClipboard();
  const { cart, addMultipleBedsToCart, removeMultipleBedsFromCart } = useBedCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  return (
    <div className="border-bottom py-2">
      <div className="d-flex flex-column flex-xl-row align-items-start justify-content-xl-between mb-3 mb-xl-0">
        <div className="d-flex align-items-center">
          <h4 className="fw-bold mb-2">
            <i className="bi bi-journal-text me-2" />
            {metadata?.id || 'No name available'}
            <button
              className="btn btn-link text-primary mb-1"
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
        <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-end gap-1 flex-shrink-0">
          {/*  TODO: change hg38 on correct genome */}
          {/*<a href={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&hubUrl=https://api-dev.bedbase.org/v1/bedset/${metadata.id}/track_hub`}>*/}
          <a
            href={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&hubUrl=${API_BASE}/bedset/${metadata.id}/track_hub`}
            target="_blank"
          >
            <button className="btn btn-outline-primary btn-sm">
              <i className="bi bi-distribute-vertical me-1" />
              Genome Browser
            </button>
          </a>

          <a href={`${API_BASE}/bedset/${metadata.id}/pep`}>
            <button className="btn btn-outline-primary btn-sm">
              <i className="bi bi-download me-1" />
              Download PEP
            </button>
          </a>

          <a href={`${API_BASE}/bedset/${metadata.id}/metadata?full=true`}>
            <button className="btn btn-outline-primary btn-sm">
              <i className="bi bi-info-circle me-1" />
              API
            </button>
          </a>
          {
            // cart includes all bed ids?
            metadata.bed_ids?.every((bedId) => cart.includes(bedId)) && !addedToCart ? (
              <button
                onClick={() => removeMultipleBedsFromCart(metadata.bed_ids || [])}
                className="btn btn-outline-danger btn-sm"
              >
                <i className="bi bi-cart-x me-1" />
                Remove beds from cart
              </button>
            ) : (
              <button
                onClick={
                  metadata.bed_ids?.length === 0
                    ? undefined
                    : () => {
                        addMultipleBedsToCart(metadata.bed_ids || []);
                        setAddedToCart(true);
                        setTimeout(() => {
                          setAddedToCart(false);
                        }, 500);
                      }
                }
                disabled={metadata.bed_ids?.length === 0 || addedToCart}
                className="btn btn-primary btn-sm"
              >
                <i className="bi bi-cart-plus me-1" />
                {addedToCart ? 'Added files to cart!' : `Add ${metadata.bed_ids?.length || 0} BEDs to cart`}
              </button>
            )
          }
          <button onClick={() => setShowDownloadModal(true)} className="btn btn-outline-primary btn-sm">
            <i className="bi bi-download me-1" />
            Download BEDset
          </button>
        </div>
      </div>
      <div>
        <p className="text-body-secondary fst-italic">{metadata?.description || 'No description available'}</p>
      </div>
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-end justify-content-between mt-2">
        <div className="d-flex flex-column flex-md-row gap-1">
          <p className="mb-0">
            <div className="badge bg-primary text-wrap">
              <i className="bi bi-hash me-1" />
              {metadata.md5sum}
            </div>
          </p>
          {metadata.bed_ids && (
            <p className="mb-0">
              <div className="badge bg-primary text-wrap">
                <i className="bi bi-file-earmark-text me-1" />
                {metadata.bed_ids?.length} BED files
              </div>
            </p>
          )}
        </div>
      </div>
      <DownloadBedSetModal id={metadata.id} show={showDownloadModal} setShow={setShowDownloadModal} />
    </div>
  );
};

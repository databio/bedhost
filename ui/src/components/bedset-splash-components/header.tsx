import { useState } from 'react';
import { components } from '../../../bedbase-types';
import { useBedCart } from '../../contexts/bedcart-context';
import { DownloadBedSetModal } from '../modals/download-bedset-modal';
import {useCopyToClipboard} from "@uidotdev/usehooks";

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
      <div className="d-flex flex-row align-items-start justify-content-between mb-2 ">
        <div className="d-flex flex-column align-items-start">
          <h4 className="fw-bold">
            <i className="bi bi-file-earmark-text me-2"/>
            {metadata?.id || 'No name available'}
            <button
                className="btn btn-link text-primary mb-2"
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
          <p className="mb-0">{metadata?.description || 'No description available'}</p>
        </div>
        <div className="d-flex flex-row align-items-center gap-1">
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
      <div className="d-flex flex-row align-items-end justify-content-start gap-1">
        <div className="badge bg-primary text-wrap">
          <i className="bi bi-hash me-1" />
          {metadata.md5sum}
        </div>
        <div className="badge bg-primary text-wrap">
          <i className="bi bi-file-earmark-text me-1" />
          {metadata.bed_ids?.length} BED files
        </div>
      </div>
      <DownloadBedSetModal id={metadata.id} show={showDownloadModal} setShow={setShowDownloadModal} />
    </div>
  );
};

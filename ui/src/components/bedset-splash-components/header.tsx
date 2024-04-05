import { useState } from 'react';
import { components } from '../../../bedbase-types';
import { useBedCart } from '../../contexts/bedcart-context';
import { DownloadBedSetModal } from '../modals/download-bedset-modal';

type BedSetMetadata = components['schemas']['BedSetMetadata'];
type Props = {
  metadata: BedSetMetadata;
};

export const BedsetSplashHeader = (props: Props) => {
  const { metadata } = props;

  const { cart, addMultipleBedsToCart, removeMultipleBedsFromCart } = useBedCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  return (
    <div className="border-bottom py-2">
      <div className="d-flex flex-row align-items-start justify-content-between mb-2 ">
        <div className="d-flex flex-column align-items-start">
          <h4 className="fw-bold">
            <i className="bi bi-file-earmark-text me-2" />
            {metadata?.id || 'No name available'}
          </h4>
          <p className="mb-0">{metadata?.description || 'No description available'}</p>
        </div>
        <div className="d-flex flex-row align-items-center gap-1">
          <button className="btn btn-outline-primary btn-sm">
            <i className="bi bi-info-circle me-1" />
            API
          </button>
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

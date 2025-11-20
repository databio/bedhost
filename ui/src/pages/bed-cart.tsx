import { useBedCart } from '../contexts/bedcart-context';
import { Layout } from '../components/layout';
import { DownloadCartModal } from '../components/modals/download-cart-modal';
import { CreateBedSetModal } from '../components/modals/create-bedset-modal';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const BedCart = () => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showCreateBedsetModal, setCreateBedSetModal] = useState(false);
  const { cart, removeBedFromCart } = useBedCart();
  const navigate = useNavigate();

  if (Object.keys(cart).length === 0) {
    return (
      <Layout title='BEDbase | Empty cart'>
        <div className='d-flex flex-column p-4 align-items-center justify-content-center h80'>
          <h1 className='fw-lighter mb-4'>Your cart is empty.</h1>
          <p className='fst-italic'>Try searching for some BED files!</p>
          <div className='d-flex flex-row gap-2'>
            <a href='/search'>
              <button className='btn btn-primary'>
                <i className='bi bi-search me-1'></i>
                Search
              </button>
            </a>
            <a href='/'>
              <button className='btn btn-outline-primary'>
                <i className='bi bi-house me-1'></i>
                Home
              </button>
            </a>
            <button className='btn btn-outline-primary' onClick={() => setCreateBedSetModal(true)}>
              <i className='bi bi-collection-fill me-2'></i>
              Create BEDset
            </button>
          </div>
        </div>
        <CreateBedSetModal show={showCreateBedsetModal} setShow={setCreateBedSetModal} />
      </Layout>
    );
  }

  return (
    <Layout title='BEDbase | Cart'>
      <div className='p-2'>
        <div className='d-flex flex-row align-items-start justify-content-between'>
          <div className='d-flex flex-column'>
            <h4 className='fw-bold mb-2'>Cart</h4>
            {Object.keys(cart).length === 1 ? (
              <p className='fst-italic mb-0 text-sm'>You have 1 item in your cart.</p>
            ) : (
              <p className='fst-italic mb-0'>You have {Object.keys(cart).length} items in your cart.</p>
            )}
          </div>
          <div className='d-flex flex-row align-items-center gap-1 mt-1'>
            <button className='btn btn-sm btn-outline-danger' onClick={() => removeBedFromCart('all')}>
              <i className='bi bi-trash me-2'></i>
              Clear cart
            </button>
            <button className='btn btn-sm btn-outline-primary' onClick={() => setCreateBedSetModal(true)}>
              <i className='bi bi-collection-fill me-2'></i>
              Create BEDset
            </button>
            <button className='btn btn-sm btn-primary' onClick={() => setShowDownloadModal(true)}>
              <i className='bi bi-download me-2'></i>
              Download all
            </button>
          </div>
        </div>

        {Object.values(cart).map((result) => (
          <div className='card bg-white border mb-2 overflow-hidden' key={result.id}>
            <div className='d-flex'>
              <div
                className={`card-body position-relative flex-1 pt-2 mb-0 ${'cursor-pointer btn-card btn-outline-primary border-0 rounded-0'}`}
                onClick={() => {
                  navigate(`/bed/${result.id}`);
                }}
              >
                <div className='d-flex justify-content-between align-items-center mb-2 pt-1'>
                  <div className='d-flex gap-2 align-items-center'>
                    <p className='fw-semibold mb-0 flex-grow-1'>{result?.name || 'No name'}</p>
                  </div>
                </div>
                <p className='text-xs text-muted fst-italic mb-2 pb-1 text-start'>
                  {result?.description || 'No description'}
                </p>

                <div className='d-flex flex-wrap gap-1 text-sm'>
                  <span className='text-muted badge border fw-medium text-bg-light'>
                    <span className='text-body-tertiary'>genome:</span> {result?.genome || 'N/A'}
                  </span>
                  <span className='text-muted badge border fw-medium text-bg-light'>
                    <span className='text-body-tertiary'>tissue:</span> {result?.tissue || 'N/A'}
                  </span>
                  <span className='text-muted badge border fw-medium text-bg-light'>
                    <span className='text-body-tertiary'>cell_line:</span> {result?.cell_line || 'N/A'}
                  </span>
                  <span className='text-muted badge border fw-medium text-bg-light'>
                    <span className='text-body-tertiary'>cell_type:</span> {result?.cell_type || 'N/A'}
                  </span>
                  <span className='text-muted badge border fw-medium text-bg-light'>
                    <span className='text-body-tertiary'>assay:</span> {result?.assay || 'N/A'}
                  </span>
                </div>
              </div>

              <div className='d-flex flex-column border-start' style={{ width: '42px' }}>
                <button
                  className='btn btn-outline-primary rounded-0 border-0 border-bottom flex-fill'
                  onClick={() => navigate(`/bed/${result.id}`)}
                  style={{ borderBottom: '1px solid white' }}
                >
                  <i className='bi bi-chevron-right'></i>
                </button>
                {cart[result?.id || ''] ? (
                  <button
                    className='btn btn-danger rounded-0 border-0 flex-fill'
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBedFromCart(result.id);
                    }}
                  >
                    <i className='bi bi-cart-dash'></i>
                  </button>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <DownloadCartModal show={showDownloadModal} setShow={setShowDownloadModal} />
      <CreateBedSetModal show={showCreateBedsetModal} setShow={setCreateBedSetModal} />
    </Layout>
  );
};

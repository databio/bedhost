import { useBedCart } from '../contexts/bedcart-context';
import { Layout } from '../components/layout';
import { DownloadCartModal } from '../components/modals/download-cart-modal';
import { CreateBedSetModal } from '../components/modals/create-bedset-modal';
import { useState } from 'react';

export const BedCart = () => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showCreateBedsetModal, setCreateBedSetModal] = useState(false);
  const { cart, removeBedFromCart } = useBedCart();

  const handleRowClick = (id?: string) => (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('button')) {
      window.location.href = `/bed/${id}`;
    }
  };

  if (Object.keys(cart).length === 0) {
    return (
      <Layout title="BEDbase | Empty cart">
        <div className="d-flex flex-column p-4 align-items-center justify-content-center h80">
          <h1>Your cart is empty</h1>
          <p className="fs-italics">Try searching for some bedfiles!</p>
          <div className="d-flex flex-row gap-2">
            <a href="/search">
              <button className="btn btn-primary">
                <i className="bi bi-search me-1"></i>
                Search
              </button>
            </a>
            <a href="/">
              <button className="btn btn-outline-primary">
                <i className="bi bi-house me-1"></i>
                Home
              </button>
            </a>
            <button className="btn btn-outline-primary" onClick={() => setCreateBedSetModal(true)}>
              <i className="bi bi-collection-fill me-2"></i>
              Create BEDset
            </button>
          </div>
        </div>
        <CreateBedSetModal show={showCreateBedsetModal} setShow={setCreateBedSetModal} />
      </Layout>
    );
  }

  return (
    <Layout title="BEDbase | Cart">
      <div className="p-2">
        <div className="d-flex flex-row align-items-start justify-content-between">
          <div className="d-flex flex-column">
            <h3 className="fw-bold mb-2">Cart</h3>
            {Object.keys(cart).length === 1 ? (
              <p className="fst-italic mb-0 text-sm">You have 1 item in your cart</p>
            ) : (
              <p className="fst-italic mb-0">You have {Object.keys(cart).length} items in your cart</p>
            )}
          </div>
          <div className="d-flex flex-row align-items-center gap-1 mt-1">
            <button className="btn btn-sm btn-outline-danger" onClick={() => removeBedFromCart('all')}>
              <i className="bi bi-trash me-2"></i>
              Clear cart
            </button>
            <button className="btn btn-sm btn-outline-primary" onClick={() => setCreateBedSetModal(true)}>
              <i className="bi bi-collection-fill me-2"></i>
              Create BEDset
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setShowDownloadModal(true)}>
              <i className="bi bi-download me-2"></i>
              Download all
            </button>
          </div>
        </div>
        <div className="p-0 pt-1 pb-3 border rounded rounded-2 shadow-sm">
          <div className="table-responsive">
            <table className="table text-sm table-hover">
              <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Genome</th>
                <th scope="col">Tissue</th>
                <th scope="col">Cell Line</th>
                <th scope="col">Cell Type</th>
                <th scope="col">Description</th>
                <th scope="col">Assay</th>
                <th scope="col" style={{ minWidth: '110px' }}>
                  Actions
                </th>
              </tr>
              </thead>
              <tbody>
              {Object.values(cart).map((item) => (
                <tr
                  key={item.id}
                  onClick={handleRowClick(item.id)}
                  className="cursor-pointer position-relative"
                >
                  <td>{item.name || 'N/A'}</td>
                  <td>
                    <span className="badge text-bg-primary">{item.genome || 'N/A'}</span>
                  </td>
                  <td>{item.tissue || 'N/A'}</td>
                  <td>{item.cell_line || 'N/A'}</td>
                  <td>{item.cell_type || 'N/A'}</td>
                  <td>{item.description || ''}</td>
                  <td>{item.assay || 'N/A'}</td>
                  <td>
                    {cart[item.id || ''] && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBedFromCart(item.id);
                        }}
                      >
                        Remove
                        <i className="bi bi-cart-dash ms-1"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <DownloadCartModal show={showDownloadModal} setShow={setShowDownloadModal} />
      <CreateBedSetModal show={showCreateBedsetModal} setShow={setCreateBedSetModal} />
    </Layout>
  );
};

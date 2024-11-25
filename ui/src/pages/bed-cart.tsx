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

  if (cart.length === 0) {
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
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="BEDbase | Cart">
      <div className="p-2">
        <div className="d-flex flex-row align-items-start justify-content-between">
          <div className="d-flex flex-column">
            <h3 className="fw-bold mb-2">Cart</h3>
            {cart.length === 1 ? (
              <p className="fst-italic mb-0 text-sm">You have 1 item in your cart</p>
            ) : (
              <p className="fst-italic mb-0">You have {cart.length} items in your cart</p>
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
          <table className="table table-hover">
            <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr
                  key={item}
                  onClick={handleRowClick(item)}
                  className="cursor-pointer position-relative">
                  <td>{item}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeBedFromCart(item)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <DownloadCartModal show={showDownloadModal} setShow={setShowDownloadModal} />
      <CreateBedSetModal show={showCreateBedsetModal} setShow={setCreateBedSetModal} />
    </Layout>
  );
};

import { useBedCart } from '../contexts/bedcart-context';
import { Layout } from '../components/layout';
import { DownloadCartModal } from '../components/modals/download-cart-modal';
import { useState } from 'react';

export const BedCart = () => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const { cart, removeBedFromCart } = useBedCart();

  if (cart.length === 0) {
    return (
      <Layout title="BEDbase | Empty cart">
        <div className="d-flex flex-column p-4 align-items-center justify-content-center h80">
          <h1>Your cart is empty</h1>
          <p className="fs-italics">Try searching for some bedfiles!</p>
          <div className="d-flex flex-row gap-2">
            <a href="/bed-search">
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
        <div className="d-flex flex-row align-items-center justify-content-between">
          <div className="d-flex flex-column">
            <h1 className="fw-bold mb-0">Cart</h1>
            {cart.length === 1 ? (
              <p className="fst-italic mb-0">You have 1 item in your cart</p>
            ) : (
              <p className="fst-italic mb-0">You have {cart.length} items in your cart</p>
            )}
          </div>
          <div className="d-flex flex-row align-items-center gap-1">
            <button className="btn btn-sm btn-outline-primary" onClick={() => removeBedFromCart('all')}>
              <i className="bi bi-trash me-2"></i>
              Clear cart
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setShowDownloadModal(true)}>
              <i className="bi bi-download me-2"></i>
              Download all
            </button>
          </div>
        </div>
        <div className="border rounded shadow-md p-2">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item}>
                  <td>{item}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeBedFromCart(item)}>
                      <i className="bi bi-trash"></i>
                    </button>
                    <a href={`/bed/${item}`} target="_blank">
                      <button className="btn btn-sm btn-outline-primary ms-2">
                        <i className="bi bi-eye"></i>
                      </button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <DownloadCartModal show={showDownloadModal} setShow={setShowDownloadModal} />
    </Layout>
  );
};

import { Fragment } from 'react/jsx-runtime';
import { useBedCart } from '../contexts/bedcart-context';
import { Layout } from '../components/layout';

export const BedCart = () => {
  const { cart, removeBedFromCart } = useBedCart();

  if (cart.length === 0) {
    return (
      <Layout title="Bedbase | Empty cart">
        <div className="d-flex flex-column p-4 align-items-center justify-content-center h80">
          <h1>Your cart is empty</h1>
          <p className="fs-italics">Try searching for some bedfiles!</p>
          <div className="d-flex flex-row gap-2">
            <button className="btn btn-primary">
              <i className="bi bi-search me-1"></i>
              Search
            </button>
            <button className="btn btn-outline-primary">
              <i className="bi bi-house me-1"></i>
              Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Bedbase | Cart">
      <h1>Cart</h1>
      {cart.length !== 0 ? (
        <Fragment>
          <p>Items in your cart:</p>
          <ul>
            {cart.map((item) => (
              <li key={item}>
                <div className="d-flex flex-row align-items-center">
                  <p className="me-2 mb-0">{item}</p>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => removeBedFromCart(item)}>
                    <i className="bi bi-trash me-1"></i>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Fragment>
      ) : (
        <p>Your cart is empty</p>
      )}
    </Layout>
  );
};

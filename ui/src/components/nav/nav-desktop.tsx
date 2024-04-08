import { useBedCart } from '../../contexts/bedcart-context';

export const NavDesktop = () => {
  const { cart } = useBedCart();
  return (
    <ul className="mb-2 ms-auto d-flex flex-row align-items-center gap-2 list-none mx-5">
      <li className="text-body mx-2 my-0 nav-item h5 pt-1">
        <a className="nav-link" href="https://github.com/databio/bedhost" target="_blank">
          <i className="me-1 bi bi-github text-base"></i>
          GitHub
        </a>
      </li>
      <li className="text-body mx-2 my-0 nav-item h5 pt-1">
        <a className="nav-link" href="https://api.bedbase.org/docs">
          <i className="bi bi-info-circle me-1 text-base"></i>API docs
        </a>
      </li>
      <li className="text-body mx-2 my-0 nav-item h5 pt-1">
        <a className="nav-link" href="/search">
          <i className="bi bi-search me-1 text-base"></i>Search
        </a>
      </li>
      <li className="text-body mx-2 my-0 nav-item h5 pt-1">
        <a className="nav-link position-relative" href="/cart">
          <i className="bi bi-cart-fill"></i>
          {cart.length > 0 && (
            <span className="badge bg-primary bg-opacity-25 border border-primary text-primary rounded-pill text-bg-secondary position-absolute top-0 start-100 translate-middle px-2 py-0 ms-1">
              <span className="text-sm">{cart.length}</span>
            </span>
          )}
        </a>
      </li>
    </ul>
  );
};

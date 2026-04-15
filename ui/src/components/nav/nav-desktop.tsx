import { useBedCart } from '../../contexts/bedcart-context';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const NavDesktop = () => {
  const { cart } = useBedCart();

  return (
    <ul className='mb-1 ms-auto d-flex flex-row align-items-center gap-2 list-none mx-5'>
      <li className='link-primary mx-2 my-0 nav-item fs-6 pt-1'>
        <a className='nav-link' href='/search'>
          <i className='bi bi-search me-1 text-base' />
          Search
        </a>
      </li>
      <li className='link-primary mx-2 my-0 nav-item fs-6 pt-1'>
        <a className='nav-link' href='/analyze'>
          <i className='bi bi-body-text me-1 text-base' />
          Analyzer
        </a>
      </li>
      <li className='link-primary mx-2 my-0 nav-item fs-6 pt-1'>
        <a className='nav-link' href='/umap'>
          <i className='bi bi-diagram-3 me-1 text-base' />
          Visualization
        </a>
      </li>
      <li className='link-primary mx-2 my-0 nav-item fs-6 pt-1'>
        <a className='nav-link' href='https://github.com/databio/bedhost' target='_blank'>
          <i className='bi bi-github me-1 text-base' />
          GitHub
        </a>
      </li>
      <li className='link-primary mx-2 my-0 nav-item fs-6 pt-1'>
        <a className='nav-link' href='https://docs.bedbase.org/bedbase/' target='_blank'>
          <i className='bi bi-file-earmark-text me-1 text-base' />
          Docs
        </a>
      </li>
      <li className='link-primary mx-2 my-0 nav-item fs-6 pt-1'>
        <a className='nav-link' href={`${API_BASE}`} target='_blank'>
          <i className='bi bi-hdd-stack fs-6 me-1' />
          API
        </a>
      </li>

      <li className='link-primary mx-2 my-0 nav-item fs-6 pt-1'>
        <a className='nav-link position-relative' href='/cart'>
          <i className='bi bi-cart-fill'></i>
          {Object.keys(cart).length > 0 && (
            <span className='badge bg-primary bg-opacity-25 border border-primary text-primary rounded-pill text-bg-secondary position-absolute top-0 start-100 translate-middle px-2 py-0 ms-1'>
              <span className='text-sm'>{Object.keys(cart).length}</span>
            </span>
          )}
        </a>
      </li>
    </ul>
  );
};

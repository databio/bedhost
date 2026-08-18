import { Dropdown } from 'react-bootstrap';

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
        <Dropdown align='end'>
          <Dropdown.Toggle
            className='nav-link shadow-none p-0 border-0'
            variant='none'
            id='nav-more-dropdown'
          >
            <i className='bi bi-list me-1 text-base' />
            More
          </Dropdown.Toggle>
          <Dropdown.Menu className='border border-light-subtle shadow'>
            <Dropdown.Item href='/downloads'>
              <i className='bi bi-download me-2' />
              Downloads
            </Dropdown.Item>
            <Dropdown.Item href='/files'>
              <i className='bi bi-file-earmark-binary me-2' />
              Analysis files
            </Dropdown.Item>
            <Dropdown.Item href='https://github.com/databio/bedhost' target='_blank'>
              <i className='bi bi-github me-2' />
              GitHub
            </Dropdown.Item>
            <Dropdown.Item href='https://docs.bedbase.org/bedbase/' target='_blank'>
              <i className='bi bi-file-earmark-text me-2' />
              Docs
            </Dropdown.Item>
            <Dropdown.Item href={`${API_BASE}`} target='_blank'>
              <i className='bi bi-hdd-stack me-2' />
              API
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
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

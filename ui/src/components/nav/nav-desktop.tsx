import { useBedCart } from '../../contexts/bedcart-context';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const NavDesktop = () => {
  const { cart } = useBedCart();
  const navigate = useNavigate();

  return (
    <ul className='mb-0 ms-auto d-flex align-items-center gap-2 list-none me-5'>
      {/* <li className='link-primary mx-2 my-0 nav-item fs-6 cursor-pointer'>
        <span className='nav-link' onClick={() => navigate('/search')}>
          <i className='bi bi-search fs-6 me-1' />
          Search
        </span>
      </li>
      <li className='link-primary mx-2 my-0 nav-item fs-6 cursor-pointer'>
        <span className='nav-link' onClick={() => navigate('/analyze')}>
          <i className='bi bi-graph-up fs-6 me-1' />
          Analyze
        </span>
      </li> */}
      <li className='link-primary mx-2 my-0 nav-item fs-6'>
        <a className='nav-link' href='https://github.com/databio/bedhost' target='_blank'>
          <i className='bi bi-github fs-6 me-1' />
          GitHub
        </a>
      </li>
      <li className='link-primary mx-2 my-0 nav-item fs-6'>
        <a className='nav-link' href='https://docs.bedbase.org/bedbase/' target='_blank'>
          <i className='bi bi-file-earmark-text fs-6 me-1' />
          Docs
        </a>
      </li>
      <li className='link-primary mx-2 my-0 nav-item fs-6'>
        <a className='nav-link' href={`${API_BASE}`} target='_blank'>
          <i className='bi bi-hdd-stack fs-6 me-1' />
          API
        </a>
      </li>

      <li className='link-primary mx-2 my-0 nav-item fs-6'>
        <span className='nav-link position-relative' onClick={() => navigate('/cart')}>
          <i className='bi bi-cart-fill'></i>
          {Object.keys(cart).length > 0 && (
            <span className='badge bg-primary bg-opacity-25 border border-primary text-primary rounded-pill text-bg-secondary position-absolute top-0 start-100 translate-middle px-2 py-0 ms-1'>
              <span className='text-sm'>{Object.keys(cart).length}</span>
            </span>
          )}
        </span>
      </li>
    </ul>
  );
};

import { Dropdown } from 'react-bootstrap';

import { useBedCart } from '../../contexts/bedcart-context';
import { NAV_LINKS, linkTarget } from './nav-links';

const topLinks = NAV_LINKS.filter((link) => link.topLevel);
const moreLinks = NAV_LINKS.filter((link) => !link.topLevel);

export const NavDesktop = () => {
  const { cart } = useBedCart();

  return (
    <ul className='mb-1 ms-auto d-flex flex-row align-items-center gap-2 list-none mx-5'>
      {topLinks.map((link) => (
        <li key={link.label} className='link-primary mx-2 my-0 nav-item fs-6 pt-1'>
          <a className='nav-link' href={link.href} {...linkTarget(link)}>
            <i className={`bi ${link.icon} me-1 text-base`} />
            {link.label}
          </a>
        </li>
      ))}

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
            {moreLinks.map((link) => (
              <Dropdown.Item key={link.label} href={link.href} {...linkTarget(link)}>
                <i className={`bi ${link.icon} me-2`} />
                {link.label}
              </Dropdown.Item>
            ))}
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

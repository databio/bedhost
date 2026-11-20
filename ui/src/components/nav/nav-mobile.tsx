import { Dropdown } from 'react-bootstrap';

import { NAV_LINKS, linkTarget } from './nav-links';

export const MobileNav = () => {
  return (
    <Dropdown className='me-3'>
      <Dropdown.Toggle className='shadow-none' variant='none' id='navbarDropdown'>
        <i className='bi bi-list fs-4' />
      </Dropdown.Toggle>
      <Dropdown.Menu className='border border-light-subtle shadow'>
        {NAV_LINKS.map((link) => (
          <Dropdown.Item key={link.label} href={link.href} {...linkTarget(link)}>
            <i className={`bi ${link.icon} me-2`} />
            {link.label}
          </Dropdown.Item>
        ))}
        <Dropdown.Item href='/cart'>
          <i className='bi bi-cart-fill me-2' />
          Cart
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

import { Dropdown } from 'react-bootstrap';

export const MobileNav = () => {
  return (
    <Dropdown className="me-3">
      <Dropdown.Toggle className="shadow-none" variant="none" id="navbarDropdown">
        <i className="bi bi-list fs-4" />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item href="https://github.com/databio/bedhost">
          <i className="bi bi-github me-2" />
          GitHub
        </Dropdown.Item>
        <Dropdown.Item href="/validate">
          <i className="bi bi-check-circle me-2" />
          Validation
        </Dropdown.Item>
        <Dropdown.Item href="/search">
          <i className="bi bi-search me-2" />
          Search
        </Dropdown.Item>
        <Dropdown.Item href="/about">
          <i className="bi bi-info-circle me-2" />
          Docs
        </Dropdown.Item>
        <Dropdown.Item href="/about">
          <i className="bi bi-cart-fill me-2" />
          Cart
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

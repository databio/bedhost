import { Fragment } from 'react';

export const NavLogo = () => {
  return (
    <Fragment>
      <a href="/" className="mb-3 align-items-center mb-md-0 me-md-auto text-dark text-decoration-none">
        <img src="/bedbase_logo.svg" alt="Bedbase" height="40" />
      </a>
    </Fragment>
  );
};

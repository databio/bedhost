import { Fragment } from 'react';

export const NavLogo = () => {
  return (
    <Fragment>
      <a href="/" className="mb-3 align-items-center mb-md-0 me-md-auto pb-md-1 text-dark text-decoration-none">
        <img src="/bedbase_logo.svg" alt="BEDbase" height="33"/>
      </a>
    </Fragment>
  );
};

import { Fragment } from 'react';

export const NavLogo = () => {
  return (
    <Fragment>
      <a href='/' className='mb-0 me-0 pb-1 align-items-center text-dark text-decoration-none'>
        <img src='/bedbase_logo.svg' alt='BEDbase' height='33' />
      </a>
    </Fragment>
  );
};

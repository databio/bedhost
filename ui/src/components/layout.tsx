import { Fragment } from 'react/jsx-runtime';
import { useServiceInfo } from '../queries/useServiceInfo';
import { StatusCircle } from './badges/status-circles';
import { SEO } from './seo';
import { Nav } from './nav/nav';

type LayoutProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
  fullWidth?: boolean;
  footer?: boolean;
  fullHeight?: boolean;
};

const Footer = () => {
  const { data, isLoading, isFetching } = useServiceInfo();
  return (
    <div className="container">
      <footer className="flex-wrap py-3 my-4 align-top d-flex justify-content-between align-items-center border-top">
        <div className="d-flex flex-column">
          <div>
            <span className="badge rounded-pill bg-primary text-primary bg-opacity-25 border border-primary me-1">
              bedhost {data?.component_versions.bedhost_version || ''}
            </span>
            <span className="badge rounded-pill bg-primary text-primary bg-opacity-25 border border-primary me-1">
              bbconf {data?.component_versions.bbconf_version || ''}
            </span>
            <span className="badge rounded-pill bg-primary text-primary bg-opacity-25 border border-primary me-1">
              Python {data?.component_versions.python_version || ''}
            </span>
            <span className="badge rounded-pill bg-primary text-primary bg-opacity-25 border border-primary me-1">
              OpenAPI {data?.component_versions.openapi_version || ''}
            </span>
          </div>
          <div className="d-flex flex-row mt-1 align-items-center">
            {isLoading || isFetching ? (
              <Fragment>
                <StatusCircle className="me-1" variant="warning" size="small" />
                Loading...
              </Fragment>
            ) : data?.component_versions.bedhost_version ? (
              <Fragment>
                <StatusCircle className="me-1" variant="success" size="small" />
                Connected
              </Fragment>
            ) : (
              <Fragment>
                <StatusCircle className="me-1" variant="danger" size="small" />
                No connection
              </Fragment>
            )}
          </div>
        </div>
        <div className="ms-auto">
          <a href="https://databio.org/">
            <img src="/databio_logo.svg" alt="Sheffield Computational Biology Lab" width="200" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export const Layout = (props: LayoutProps) => {
  const { children, title, description, image, footer, fullHeight } = props;
  const mainContainerClass = fullHeight ? 'container min-h-screen' : 'container';
  return (
    <Fragment>
      <SEO title={title} description={description} image={image} />
      <header>
        <Nav />
      </header>
      <main className={mainContainerClass}>{children}</main>
      {footer === true && <Footer />}
    </Fragment>
  );
};

import { AxiosError } from 'axios';
import { Col, Row } from 'react-bootstrap';
import { Fragment } from 'react/jsx-runtime';
import { convertStatusCodeToMessage } from '../../utils';

type Error = AxiosError;

type SearchErrorProps = {
  title: string | undefined;
  error: Error;
};

export const SearchError = (props: SearchErrorProps) => {
  const { error } = props;
  const errorCode = error.response?.status;
  return (
    <div className='my-2 h-100'>
      <Row className='h-50'>
        <Col sm={12} md={12}>
          <div className='d-flex flex-column align-items-center justify-content-center h-100'>
            <h2 className='text-primary'>{convertStatusCodeToMessage(errorCode)}</h2>
            {error.message && (
              <Fragment>
                <label className='fw-bold'>{error.name}</label>
                <p className='mb-0'>{error.message}:</p>
              </Fragment>
            )}
            <div className='p-2 border border-primary rounded w-50 shadow my-3'>
              <pre>{JSON.stringify(error, null, 2)}</pre>
            </div>
            <div className='d-flex flex-row align-items-center gap-2'>
              <a href='/'>
                <button className='btn btn-primary'>
                  <i className='bi bi-house-door me-1' />
                  Back to home
                </button>
              </a>
              <a href='https://github.com/databio/bedhost'>
                <button className='btn btn-outline-primary'>
                  <i className='bi bi-github me-1' />
                  Report error
                </button>
              </a>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

import { useState } from 'react';
import { AxiosError } from 'axios';
import { Card, Col, OverlayTrigger, Row, Table, Tooltip } from 'react-bootstrap';
import { useCopyToClipboard } from '@uidotdev/usehooks';

import { Layout } from '../components/layout';
import { ErrorPage } from '../components/common/error-page';
import { CardSkeleton } from '../components/skeletons/card-skeleton';
import { useAnalysisFiles } from '../queries/useAnalysisFiles';
import { bytesToSize, formatDateShort } from '../utils';

const fileName = (filePath: string) => filePath.split('/').pop() || filePath;

// truncated, copy-on-click sha256 checksum
const ChecksumCell = (props: { checksum: string | null }) => {
  const { checksum } = props;
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  if (!checksum) {
    return <span className='text-muted'>—</span>;
  }

  return (
    <OverlayTrigger
      placement='top'
      overlay={<Tooltip id={`checksum-${checksum}`}>{copied ? 'Copied!' : 'Click to copy sha256'}</Tooltip>}
    >
      <button
        className='btn btn-sm btn-link text-primary p-0 text-decoration-none font-monospace'
        onClick={() => {
          copyToClipboard(checksum);
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        }}
      >
        {checksum.slice(0, 12)}…
        {copied ? <i className='bi bi-check ms-1' /> : <i className='bi bi-clipboard ms-1' />}
      </button>
    </OverlayTrigger>
  );
};

export const AnalysisFiles = () => {
  const { data, isLoading, error } = useAnalysisFiles();

  if (isLoading) {
    return (
      <Layout title='BEDbase | Analysis files' footer fullHeight>
        <div className='my-3'>
          <div className='mb-3'>
            <CardSkeleton height='120px' />
          </div>
          <div className='mb-3'>
            <CardSkeleton height='300px' />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return <ErrorPage title='BEDbase | Analysis files' error={error as AxiosError} />;
  }

  const results = data?.results || [];

  return (
    <Layout title='BEDbase | Analysis files' footer fullHeight>
      <div className='my-3'>
        <Row className='justify-content-center'>
          <Col xs={12} lg={11} xl={10} xxl={9}>
            <h2 className='fw-light mb-2'>
              <i className='bi bi-file-earmark-binary me-2' />
              Analysis files
            </h2>
            <p className='text-muted'>
              Standalone analysis files used across BEDbase analysis (e.g. the openSignalMatrix, models, and other
              analysis inputs). Each file carries a sha256 checksum you can verify after download.
            </p>
          </Col>
        </Row>

        {results.length === 0 ? (
          <Row className='justify-content-center'>
            <Col xs={12} lg={11} xl={10} xxl={9}>
              <div className='p-4 border border-primary border-opacity-25 rounded bg-white text-center'>
                <i className='bi bi-inbox fs-1 text-primary d-block mb-2' />
                <p className='mb-0'>No analysis files have been published yet. Please check back later.</p>
              </div>
            </Col>
          </Row>
        ) : (
          <Row className='justify-content-center'>
            <Col xs={12} lg={11} xl={10} xxl={9}>
              <Card className='mb-4 shadow-sm'>
                <Card.Header className='bg-white d-flex align-items-center justify-content-between'>
                  <span className='fw-bold'>
                    <i className='bi bi-collection me-2' />
                    All files
                  </span>
                  <span className='badge bg-primary bg-opacity-25 border border-primary text-primary rounded-pill'>
                    {results.length} {results.length === 1 ? 'file' : 'files'}
                  </span>
                </Card.Header>
                <Card.Body className='p-0'>
                  <div className='table-responsive'>
                    <Table hover className='mb-0 align-middle'>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Genome</th>
                          <th>Tags</th>
                          <th className='text-end'>Size</th>
                          <th>Added</th>
                          <th>sha256</th>
                          <th className='text-end'>Download</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((file) => (
                          <tr key={file.id ?? file.file_path}>
                            <td className='fw-semibold'>
                              {file.name}
                              {file.description && (
                                <div className='text-muted small fw-normal'>{file.description}</div>
                              )}
                            </td>
                            <td>{file.file_type ? <span className='badge bg-primary'>{file.file_type}</span> : '—'}</td>
                            <td>{file.genome || '—'}</td>
                            <td>
                              {file.tags && file.tags.length > 0
                                ? file.tags.map((t) => (
                                    <span
                                      key={t}
                                      className='badge bg-secondary bg-opacity-25 border border-secondary text-secondary me-1'
                                    >
                                      {t}
                                    </span>
                                  ))
                                : '—'}
                            </td>
                            <td className='text-end'>{file.file_size !== null ? bytesToSize(file.file_size) : '—'}</td>
                            <td className='text-nowrap'>{formatDateShort(new Date(file.creation_date))}</td>
                            <td>
                              <ChecksumCell checksum={file.checksum} />
                            </td>
                            <td className='text-end'>
                              <a
                                className='btn btn-sm btn-outline-primary text-nowrap'
                                href={file.file_path}
                                download
                                title={fileName(file.file_path)}
                              >
                                <i className='bi bi-download me-1' />
                                Download
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </Layout>
  );
};

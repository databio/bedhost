import { Fragment, useState } from 'react';
import { AxiosError } from 'axios';
import { Card, Col, OverlayTrigger, Row, Table, Tooltip } from 'react-bootstrap';
import { useCopyToClipboard } from '@uidotdev/usehooks';

import { Layout } from '../components/layout';
import { ErrorPage } from '../components/common/error-page';
import { CardSkeleton } from '../components/skeletons/card-skeleton';
import { useExports } from '../queries/useExports';
import type { BedSnapshotFileType, BedSnapshotResult } from '../queries/useExports';
import { bytesToSize, formatDateShort, formatNumberWithCommas } from '../utils';

// human-readable labels for each export file type
const FILE_TYPE_LABELS: Record<BedSnapshotFileType, string> = {
  metadata: 'Metadata',
  bedsets: 'BED sets',
  bedset_membership: 'BED set membership',
  manifest: 'Manifest',
};

const fileTypeLabel = (fileType: string) => FILE_TYPE_LABELS[fileType as BedSnapshotFileType] || fileType;

const fileName = (filePath: string) => filePath.split('/').pop() || filePath;

// group export files by their snapshot date, preserving the newest-first
// order the API returns.
type SnapshotGroup = {
  date: string;
  files: BedSnapshotResult[];
};

const groupBySnapshot = (results: BedSnapshotResult[]): SnapshotGroup[] => {
  const groups: SnapshotGroup[] = [];
  for (const file of results) {
    const date = formatDateShort(file.creation_date) || file.creation_date;
    const existing = groups.find((group) => group.date === date);
    if (existing) {
      existing.files.push(file);
    } else {
      groups.push({ date, files: [file] });
    }
  }
  return groups;
};

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

// copyable DuckDB one-liner for the newest metadata export
const DuckDBSnippet = (props: { metadataPath: string }) => {
  const { metadataPath } = props;
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  const query = `SELECT * FROM read_parquet('${metadataPath}') WHERE assay = 'ChIP-seq' AND genome_alias = 'hg38';`;

  return (
    <div className='border border-2 border-dark p-2 rounded w-100 position-relative'>
      <pre className='mb-0 text-wrap text-break'>
        <code>{query}</code>
      </pre>
      <div className='position-absolute top-0 end-0 me-2 mt-2'>
        <button
          className='btn btn-outline-primary btn-sm'
          onClick={() => {
            copyToClipboard(query);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

export const Downloads = () => {
  const { data, isLoading, error } = useExports();

  if (isLoading) {
    return (
      <Layout title='BEDbase | Downloads' footer fullHeight>
        <div className='my-3'>
          <div className='mb-3'>
            <CardSkeleton height='120px' />
          </div>
          <div className='mb-3'>
            <CardSkeleton height='300px' />
          </div>
          <div className='mb-3'>
            <CardSkeleton height='300px' />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return <ErrorPage title='BEDbase | Downloads' error={error as AxiosError} />;
  }

  const results = data?.results || [];
  const groups = groupBySnapshot(results);
  const newestMetadata = results.find((file) => file.file_type === 'metadata');

  return (
    <Layout title='BEDbase | Downloads' footer fullHeight>
      <div className='my-3'>
        <Row>
          <Col xs={12} lg={10} xl={8}>
            <h2 className='fw-light mb-2'>
              <i className='bi bi-download me-2' />
              Bulk exports
            </h2>
            <p className='text-muted'>
              Bulk exports are dated, immutable Parquet snapshots of the entire BEDbase metadata corpus. Each snapshot is
              published as a set of files that you can download and query directly with{' '}
              <a href='https://duckdb.org/' target='_blank' rel='noreferrer'>
                DuckDB
              </a>{' '}
              — no download required to start exploring.
            </p>

            {newestMetadata && (
              <div className='mb-4'>
                <label className='fw-bold mb-1'>Try it today with DuckDB — no download or pagination needed:</label>
                <DuckDBSnippet metadataPath={newestMetadata.file_path} />
              </div>
            )}
          </Col>
        </Row>

        {groups.length === 0 ? (
          <Row>
            <Col xs={12} lg={10} xl={8}>
              <div className='p-4 border border-primary border-opacity-25 rounded bg-white text-center'>
                <i className='bi bi-inbox fs-1 text-primary d-block mb-2' />
                <p className='mb-0'>No bulk exports have been published yet. Please check back later.</p>
              </div>
            </Col>
          </Row>
        ) : (
          <Fragment>
            {groups.map((group) => (
              <Row key={group.date}>
                <Col xs={12} lg={10} xl={8}>
                  <Card className='mb-4 shadow-sm'>
                    <Card.Header className='bg-white d-flex align-items-center justify-content-between'>
                      <span className='fw-bold'>
                        <i className='bi bi-calendar3 me-2' />
                        Snapshot {group.date}
                      </span>
                      <span className='badge bg-primary bg-opacity-25 border border-primary text-primary rounded-pill'>
                        {group.files.length} {group.files.length === 1 ? 'file' : 'files'}
                      </span>
                    </Card.Header>
                    <Card.Body className='p-0'>
                      <div className='table-responsive'>
                        <Table hover className='mb-0 align-middle'>
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th className='text-end'>Rows</th>
                              <th className='text-end'>Size</th>
                              <th>sha256</th>
                              <th className='text-end'>Download</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.files.map((file) => (
                              <tr key={file.file_path}>
                                <td>
                                  <span className='badge bg-primary'>{fileTypeLabel(file.file_type)}</span>
                                </td>
                                <td className='text-end'>
                                  {file.record_count !== null ? formatNumberWithCommas(file.record_count) : '—'}
                                </td>
                                <td className='text-end'>
                                  {file.file_size !== null ? bytesToSize(file.file_size) : '—'}
                                </td>
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
            ))}
          </Fragment>
        )}
      </div>
    </Layout>
  );
};

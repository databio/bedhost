import { useState } from 'react';
import { Layout } from '../components/layout';
import { PaginationBar } from '../components/search/pagination-bar';
import { RecentBedsTable } from '../components/recent/recent-beds-table';
import { useRecentBeds } from '../queries/useRecentBeds';

export const RecentBeds = () => {
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);

  const { data, isFetching, error } = useRecentBeds({ limit, offset });

  const total = data?.count ?? 0;
  const beds = data?.results ?? [];

  return (
    <Layout title='BEDbase | Recently added' footer fullHeight>
      <div className='my-4'>
        <div className='d-flex flex-row align-items-center justify-content-between mb-3'>
          <div>
            <h1 className='fs-4 fw-bold mb-1'>Recently added BED files</h1>
            <p className='text-muted mb-0'>The most recently added BED files in BEDbase, newest first.</p>
          </div>
          <div className='d-flex flex-row align-items-center gap-2'>
            <label className='text-muted text-nowrap mb-0'>Per page</label>
            <select
              className='form-select form-select-sm'
              style={{ width: 'auto' }}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setOffset(0);
              }}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className='alert alert-danger'>Failed to load recent BED files. Please try again.</div>
        ) : (
          <>
            {isFetching && beds.length === 0 ? (
              <div className='d-flex flex-column align-items-center justify-content-center my-5 fst-italic text-muted'>
                Loading recent BED files…
              </div>
            ) : beds.length === 0 ? (
              <div className='d-flex flex-column align-items-center justify-content-center my-5 fst-italic text-muted'>
                No BED files found.
              </div>
            ) : (
              <>
                <RecentBedsTable beds={beds} />
                <div className='row'>
                  <div className='col-12'>
                    <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={total} />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

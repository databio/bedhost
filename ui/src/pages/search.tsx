import { Col, Row } from 'react-bootstrap';
import { Layout } from '../components/layout';
import { SearchBar } from '../components/search/search-bar';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearch } from '../queries/useSearch';
import { ErrorPage } from '../components/common/error-page';
import { SearchResultsTable } from '../components/search/search-results-table';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  // const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const limit = 25;

  const {
    isFetching: isSearching,
    data,
    error,
    refetch,
  } = useSearch({
    q: searchTerm,
    limit: limit, // TODO: make this a variable
    offset: offset,
    autoRun: false,
  });

  useEffect(() => {
    if (searchParams.get('q')) {
      refetch();
    }
  }, []);

  if (error) {
    return <ErrorPage title="BEDbase | Search" error={error} />;
  }

  return (
    <Layout title="BEDbase | Search" footer fullHeight>
      <div className="my-2">
        <Row>
          <Col sm={12} md={12}>
            <h2>Search for BED files</h2>
            <SearchBar value={searchTerm} onChange={setSearchTerm} onSearch={() => refetch()} />
          </Col>
        </Row>
        <div>
          {isSearching ? (
            <div className="mt-5 pt-5 d-flex flex-column align-items-center">
              <img src="/BEDbase_icon.svg" alt="loading" width="60px" className="animate-bounce" />
              <p className="fst-italic text-sm text-center">Searching...</p>
            </div>
          ) : (
            <div className="my-2">
              {data ? (
                <div className="p-2 border rounded shadow-sm">
                  <SearchResultsTable results={data || []} />{' '}
                  <div className="d-flex flex-row align-items-center justify-content-center gap-1">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setOffset(offset - limit);
                        refetch();
                      }}
                      disabled={offset === 0}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setOffset(offset + limit);
                        refetch();
                      }}
                      disabled={data.count < limit}
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : (
                <div>Search for bedfiles</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

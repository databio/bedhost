import { Col, Row } from 'react-bootstrap';
import { Layout } from '../layout';
import { SearchBar } from '../search/search-bar';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearch } from '../../queries/useSearch';
import { ErrorPage } from '../common/error-page';
import { SearchResultsTable } from '../search/search-results-table';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const {
    isFetching: isSearching,
    data,
    error,
    refetch,
  } = useSearch({
    q: searchTerm,
    limit: limit,
    offset: offset,
  });

  useEffect(() => {
    if (searchParams.get('q')) {
      refetch();
    }
  }, [refetch, searchParams]);

  if (error) {
    return <ErrorPage title="Bedbase | Search" error={error} />;
  }

  return (
    <Layout title="Bedbase | Search" footer fullHeight>
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
              <img src="/bedbase_icon.svg" alt="loading" width="60px" className="animate-bounce" />
              <p className="fst-italic text-sm text-center">Searching...</p>
            </div>
          ) : (
            <div className="my-2">
              {data ? (
                <div className="p-2 border border-secondary rounded shadow-sm">
                  <SearchResultsTable results={data || []} />{' '}
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

import { Col, Row } from 'react-bootstrap';
import { SearchBar } from './search-bar';
import { SearchResultsTable } from './search-results-table';
import { SearchingJumper } from './searching-jumper';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useText2BedSearch } from '../../queries/useText2BedSearch';
import { ErrorPage } from '../common/error-page';
import { TableToolbar } from './table-toolbar';
import { PaginationBar } from './pagination-bar';

export const Text2Bed = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const {
    isFetching: isSearching,
    data: results,
    error,
    refetch: onSearch,
  } = useText2BedSearch({
    q: searchTerm,
    limit: limit, // TODO: make this a variable
    offset: offset,
    autoRun: false,
  });

  useEffect(() => {
    onSearch();
  }, [limit, offset, onSearch]);

  if (error) {
    if (error) {
      return <ErrorPage title="BEDbase | Search" error={error} />;
    }
  }

  return (
    <div className="my-2">
      <Row>
        <Col sm={12} md={12}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} onSearch={() => onSearch()} />
        </Col>
      </Row>
      <div>
        {isSearching ? (
          <SearchingJumper />
        ) : (
          <div className="my-2">
            {results ? (
              <div className="p-2 border rounded shadow-sm">
                <TableToolbar limit={limit} setLimit={setLimit} total={results.count} />
                <SearchResultsTable results={results || []} />{' '}
                <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={results.count} />
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center mt-5 fst-italic">
                Try seaching for some BED files!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

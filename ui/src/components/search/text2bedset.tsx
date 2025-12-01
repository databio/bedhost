import { Col, Row } from 'react-bootstrap';
import { SearchBar } from './search-bar';
import { SearchingJumper } from './searching-jumper';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useText2BedSetSearch } from '../../queries/useText2BedSetSearch';
import { ErrorPage } from '../common/error-page';
import { TableToolbar } from './table-toolbar';
import { PaginationBar } from './pagination-bar';
import { SearchBedSetResultTable } from './search-bedset-table.tsx';
import { AxiosError } from 'axios';

export const Text2BedSet = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [genome, setGenome] = useState<string | ''>(searchParams.get('genome') || '');
  const [assay, setAssay] = useState<string | ''>(searchParams.get('assay') || '');

  const {
    isFetching: isSearching,
    data: results,
    error,
    refetch: onSearch,
  } = useText2BedSetSearch({
    q: searchTerm,
    limit: limit,
    offset: offset,
    autoRun: false,
  });

  useEffect(() => {
    if (searchTerm) {
      onSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset, onSearch]);

  if (error) {
    if (error) {
      return <ErrorPage title="BEDbase | Search" error={error as AxiosError} />;
    }
  }

  return (
    <div className="my-2">
      <Row>
        <Col sm={12} md={12}>
          <SearchBar
            limit={limit}
            setLimit={setLimit}
            value={searchTerm}
            genome={genome}
            assay={assay}
            setAssay={setAssay}
            setGenome={setGenome}
            onChange={setSearchTerm}
            onSearch={() => onSearch()}
          />
        </Col>
      </Row>
      <div>
        {isSearching ? (
          <SearchingJumper />
        ) : (
          <div className="my-2">
            {results ? (
              <div className="p-0 pt-1 pb-3 border rounded shadow-sm">
                <div className="px-2 pt-2">
                  <TableToolbar showTotalResults limit={limit} setLimit={setLimit} total={results.count} />
                </div>
                <SearchBedSetResultTable results={results} />{' '}
                <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={results.count} />
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center mt-5 fst-italic">
                Find collections of BED files by entering a text query above.<br />
                For example, try searching for "excluderanges" or "a562".
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

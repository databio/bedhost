/* eslint-disable react-hooks/exhaustive-deps */
import { Col, Row } from 'react-bootstrap';
import { SearchBar } from '../search-bar';
import { Text2BedSearchResultsTable } from './t2b-search-results-table';
import { SearchingJumper } from '../searching-jumper';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useText2BedSearch } from '../../../queries/useText2BedSearch';
import { TableToolbar } from '../table-toolbar';
import { PaginationBar } from '../pagination-bar';
import { SearchError } from '../search-error';
import { AxiosError } from 'axios';

export const Text2Bed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [genome, setGenome] = useState(searchParams.get('genome') || '');
  const [assay, setAssay] = useState(searchParams.get('assay') || '');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const {
    isFetching: isSearching,
    data: results,
    error,
    refetch: onSearch,
  } = useText2BedSearch({
    q: searchTerm,
    genome: genome,
    assay: assay,
    limit: limit, // TODO: make this a variable
    offset: offset,
    autoRun: false,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (genome) params.set('genome', genome);
    if (assay) params.set('assay', assay);
    setSearchParams(params);
  }, [searchTerm, genome, assay]);

  useEffect(() => {
    if (searchTerm || genome || assay) {
      onSearch();
    }
  }, [limit, offset, genome, assay, onSearch]);

  if (error) {
    if (error) {
      return <SearchError title="BEDbase | Search" error={error as AxiosError} />;
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
            onChange={setSearchTerm}
            genome={genome}
            setGenome={setGenome}
            assay={assay}
            setAssay={setAssay}
            onSearch={() => {
              setOffset(0);
              setTimeout(() => {
                onSearch();
              }, 100);
            }}
          />
        </Col>
      </Row>
      <div>
        {isSearching ? (
          <SearchingJumper />
        ) : (
          <div className="my-2">
            {results ? (
              <div className="p-0 pt-1 pb-3 border rounded rounded-2 shadow-sm bg-white">
                <TableToolbar limit={limit} setLimit={setLimit} total={results.count} />
                <Text2BedSearchResultsTable results={results || []} search_query={searchTerm} />{' '}
                <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={results.count} />
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center mt-5 fst-italic">
                Try searching for some BED files! e.g. K562
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

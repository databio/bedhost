/* eslint-disable react-hooks/exhaustive-deps */
import { Text2BedSearchResultsCards } from './t2b-search-results-cards';
import { SearchingJumper } from '../searching-jumper';
import { useEffect, useState, useRef } from 'react';
import { useText2BedSearch } from '../../../queries/useText2BedSearch';
import { PaginationBar } from '../pagination-bar';
import { SearchError } from '../search-error';
import { AxiosError } from 'axios';
import { Text2BedSearchResultsTable } from './t2b-search-results-table.tsx';

type Props = {
  searchTerm: string;
  genome: string;
  assay: string;
  limit: number;
  offset: number;
  setOffset: (offset: number) => void;
  layout: string;
  triggerSearch: number;
};

export const Text2Bed = (props: Props) => {
  const { searchTerm, genome, assay, limit, offset, setOffset, layout, triggerSearch } = props;
  const [hasLoaded, setHasLoaded] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);
  const [queryTerm, setQueryTerm] = useState(searchTerm);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isFetching: isSearching,
    data: results,
    error,
    refetch: onSearch,
  } = useText2BedSearch({
    q: queryTerm,
    genome: genome,
    assay: assay,
    limit: limit,
    offset: offset,
    autoRun: false,
  });

  useEffect(() => {
    if (results?.results) {
      setHasLoaded(true);
      setResultsCount(results.count);
    }
  }, [results?.results]);

  // Initial search on mount if there's a searchTerm from URL params
  useEffect(() => {
    if (queryTerm && triggerSearch === 0) {
      onSearch();
    }
  }, []);

  // When user triggers search, update the query term which will cause refetch
  useEffect(() => {
    if (triggerSearch > 0) {
      setQueryTerm(searchTerm);
    }
  }, [triggerSearch]);

  // Refetch when query term or filters change
  useEffect(() => {
    if (queryTerm || genome || assay) {
      onSearch();
    }
  }, [queryTerm, limit, offset, genome, assay]);

  if (error) {
    if (error) {
      return <SearchError title='BEDbase | Search' error={error as AxiosError} />;
    }
  }

  return (
    <div className='my-2'>
      <div>
        {isSearching && !hasLoaded ? (
          <SearchingJumper />
        ) : (
          <div className='my-2' ref={containerRef}>
            {hasLoaded ? (
              <>
                {results ? (
                  <>
                    <div className='row gx-2'>
                      <div className={`col-12 d-flex flex-column`}>
                        {layout === 'cards' ? (
                          <Text2BedSearchResultsCards
                            results={results || []}
                            search_query={queryTerm}
                            layout={layout}
                          />
                        ) : (
                          <Text2BedSearchResultsTable
                            results={results || []}
                            search_query={queryTerm}
                            layout={layout}
                          />
                        )}
                      </div>
                    </div>
                    <div className='row'>
                      <div className='col-12'>
                        <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={resultsCount} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ height: '660px' }}>
                    <SearchingJumper />
                  </div>
                )}
              </>
            ) : (
              <div className='d-flex flex-column align-items-center justify-content-center mt-5 fst-italic'>
                Try searching for some BED files! e.g. K562
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

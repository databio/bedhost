import { SearchingJumper } from '../searching-jumper.tsx';
import { useEffect, useState } from 'react';
import { useText2BedSetSearch } from '../../../queries/useText2BedSetSearch.ts';
import { ErrorPage } from '../../common/error-page.tsx';
// import { TableToolbar } from '../table-toolbar.tsx';
import { PaginationBar } from '../pagination-bar.tsx';
import { SearchBedSetResultTable } from './t2bs-search-results-table.tsx';
import { AxiosError } from 'axios';

type Props = {
  searchTerm: string;
  limit: number;
  setLimit: (limit: number) => void;
  offset: number;
  setOffset: (offset: number) => void;
  triggerSearch: number;
};

export const Text2BedSet = (props: Props) => {
  const { searchTerm, limit, offset, setOffset, triggerSearch } = props;

  const [hasLoaded, setHasLoaded] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);

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
    if (results?.results) {
      setHasLoaded(true);
      setResultsCount(results.count);
    }
  }, [results?.results])

  useEffect(() => {
    if (triggerSearch > 0) {
      onSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSearch]);

  useEffect(() => {
    if (searchTerm) {
      onSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]);

  if (error) {
    if (error) {
      return <ErrorPage title='BEDbase | Search' error={error as AxiosError} />;
    }
  }

  return (
    <div className='my-2'>
      <div>
        {isSearching && !hasLoaded ? (
          <SearchingJumper />
        ) : (
          <div className='my-2'>
            {hasLoaded ? (
              <div className='pb-3'>
                {results ? (
                  <SearchBedSetResultTable results={results} showBEDCount={true} />
                ) : (
                  <div style={{height: '660px'}}>
                    <SearchingJumper />
                  </div>
                )}
                <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={resultsCount} />
              </div>
            ) : (
              <div className='d-flex flex-column align-items-center justify-content-center mt-5 fst-italic'>
                Try searching for some BEDsets! e.g. K562 or excluderanges
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

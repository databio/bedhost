import { SearchingJumper } from './searching-jumper';
import { useEffect } from 'react';
import { useText2BedSetSearch } from '../../queries/useText2BedSetSearch';
import { ErrorPage } from '../common/error-page';
import { TableToolbar } from './table-toolbar';
import { PaginationBar } from './pagination-bar';
import { SearchBedSetResultTable } from './search-bedset-table.tsx';
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
  const { searchTerm, limit, setLimit, offset, setOffset, triggerSearch } = props;

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
        {isSearching ? (
          <SearchingJumper />
        ) : (
          <div className='my-2'>
            {results ? (
              <div className='p-0 pt-1 pb-3 border rounded shadow-sm bg-white'>
                <div className='px-2 pt-2'>
                  <TableToolbar showTotalResults limit={limit} setLimit={setLimit} total={results.count} />
                </div>
                <SearchBedSetResultTable results={results} />{' '}
                <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={results.count} />
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

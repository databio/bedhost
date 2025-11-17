/* eslint-disable react-hooks/exhaustive-deps */
import { Text2BedSearchResultsTable } from './t2b-search-results-table';
import { SearchingJumper } from '../searching-jumper';
import { useEffect, useState, useRef } from 'react';
import { useText2BedSearch } from '../../../queries/useText2BedSearch';
import { TableToolbar } from '../table-toolbar';
import { PaginationBar } from '../pagination-bar';
import { SearchError } from '../search-error';
import { AxiosError } from 'axios';
import { BEDEmbeddingPlot, BEDEmbeddingPlotRef } from '../../../components/umap/bed-embedding-plot.tsx';

type Props = {
  searchTerm: string;
  genome: string;
  assay: string;
  limit: number;
  setLimit: (limit: number) => void;
  offset: number;
  setOffset: (offset: number) => void;
  layout: string;
  triggerSearch: number;
};

export const Text2Bed = (props: Props) => {
  const { searchTerm, genome, assay, limit, setLimit, offset, setOffset, layout, triggerSearch } = props;
  const [containerHeight, setContainerHeight] = useState(660);

  const embeddingPlotRef = useRef<BEDEmbeddingPlotRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isFetching: isSearching,
    data: results,
    error,
    refetch: onSearch,
  } = useText2BedSearch({
    q: searchTerm,
    genome: genome,
    assay: assay,
    limit: limit,
    offset: offset,
    autoRun: false,
  });

  useEffect(() => {
    if (triggerSearch > 0) {
      onSearch();
    }
  }, [triggerSearch, onSearch]);

  useEffect(() => {
    if (searchTerm || genome || assay) {
      onSearch();
    }
  }, [limit, offset, genome, assay, onSearch]);

  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top;
        setContainerHeight(Math.max(400, Math.min(availableHeight, 800)));
      }
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  if (error) {
    if (error) {
      return <SearchError title='BEDbase | Search' error={error as AxiosError} />;
    }
  }

  return (
    <div className='my-2'>
      <div>
        {isSearching ? (
          <SearchingJumper />
        ) : (
          <div className='my-2' ref={containerRef}>
            {results ? (
              <div className='row gx-2'>
                {(layout === 'split') && (
                  <div className='col-6' style={{height: `${containerHeight}px`}}>
                    <div className='d-flex border rounded overflow-hidden'>
                      <BEDEmbeddingPlot
                        ref={embeddingPlotRef}
                        bedIds={results?.results?.map((result: any) => result.id)}
                        height={containerHeight}
                        preselectPoint={false}
                        stickyBaseline={true}
                      />
                    </div>
                  </div>
                )}
                
                <div className={`${layout === 'split' ? 'col-6' : 'col-12'} d-flex flex-column ${layout === 'split' ? 'overflow-hidden' : ''}`} style={layout === 'split' ? {height: `${containerHeight}px`} : {}}>
                  <div className={`${layout === 'split' ? 'overflow-y-auto overflow-x-hidden flex-grow-1' : ''}`}>
                    <TableToolbar limit={limit} setLimit={setLimit} total={results.count} />
                    <Text2BedSearchResultsTable
                      results={results || []}
                      search_query={searchTerm}
                      layout={layout}
                      onCardClick={(bedId) => {
                        embeddingPlotRef.current?.centerOnBedId(bedId);
                      }}
                    />{' '}
                    <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={results.count} />
                  </div>
                </div>
              </div>
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

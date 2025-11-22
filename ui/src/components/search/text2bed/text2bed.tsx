/* eslint-disable react-hooks/exhaustive-deps */
import { Text2BedSearchResultsTable } from './t2b-search-results-table';
import { SearchingJumper } from '../searching-jumper';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useText2BedSearch } from '../../../queries/useText2BedSearch';
import { PaginationBar } from '../pagination-bar';
import { SearchError } from '../search-error';
import { AxiosError } from 'axios';
import { BEDEmbeddingPlot, BEDEmbeddingPlotRef } from '../../../components/umap/bed-embedding-plot.tsx';

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
  const [containerHeight, setContainerHeight] = useState(660);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);

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

  const bedIds = useMemo(() => {
    return results?.results?.map((result: any) => result.id);
  }, [results?.results]);

  useEffect(() => {
    if (results?.results) {
      setHasLoaded(true);
      setResultsCount(results.count);
    }
  }, [results?.results]);

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
        const availableHeight = window.innerHeight * 0.9;
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
        {isSearching && !hasLoaded ? (
          <SearchingJumper />
        ) : (
          <div className='my-2' ref={containerRef}>
            {hasLoaded ? (
              <>
                <div className='row gx-2'>
                  {layout === 'split' && (
                    <div className='col-6'>
                      <div
                        className='d-flex border rounded overflow-hidden mb-2'
                        style={{
                          position: 'sticky',
                          top: `calc(50vh - ${containerHeight / 2}px)`,
                          height: `${containerHeight}px`,
                        }}
                      >
                        <BEDEmbeddingPlot
                          ref={embeddingPlotRef}
                          bedIds={bedIds}
                          height={containerHeight}
                          preselectPoint={false}
                          stickyBaseline={true}
                        />
                      </div>
                    </div>
                  )}
                  <div className={`${layout === 'split' ? 'col-6' : 'col-12'} d-flex flex-column`}>
                    {results ? (
                      <Text2BedSearchResultsTable
                        results={results || []}
                        search_query={searchTerm}
                        layout={layout}
                        onCardClick={(bedId) => {
                          embeddingPlotRef.current?.centerOnBedId(bedId);
                        }}
                      />
                    ) : (
                      <div style={{ height: '660px' }}>
                        <SearchingJumper />
                      </div>
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

import { useEffect, useState, useRef, RefObject, useMemo } from 'react';
import { SearchingJumper } from '../searching-jumper';
// import { useBed2BedSearch } from '../../../queries/useBed2BedSearch';
import { useBed2BedSearchPaginate } from '../../../queries/useBed2BedSearchPaginate.ts';
// import { Bed2BedSearchResultsTable } from './b2b-search-results-table';
import { BEDEmbeddingPlot, BEDEmbeddingPlotRef } from '../../../components/umap/bed-embedding-plot.tsx';
import { Bed2BedSearchResultsCards } from './b2b-search-results-cards.tsx';
import { PaginationBar } from '../pagination-bar';

type Props = {
  limit: number;
  offset: number;
  setOffset: (offset: number) => void;
  layout: string;
  file: File | null;
  customCoordinates: number[] | null;
  embeddingPlotRef: RefObject<BEDEmbeddingPlotRef>;
};

export const Bed2Bed = (props: Props) => {
  const { limit, offset, setOffset, layout, file, customCoordinates, embeddingPlotRef } = props;
  const [containerHeight, setContainerHeight] = useState(660);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isFetching: isSearching,
    data: results,
    refetch: onSearch,
  } = useBed2BedSearchPaginate({
    q: file,
    limit: limit,
    offset: offset,
    autoRun: false,
  });

  const bedIds = useMemo(() => {
    return results?.results?.map((result: any) => result.payload.id)
  }, [results?.results]);

  useEffect(() => {
    if (results?.results) {
      setHasLoaded(true);
      setResultsCount(results.count);
    }
  }, [results?.results])

  useEffect(() => {
    if (file) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setTimeout(() => {
        onSearch();
      }, 50);
    }
  }, [file, limit, offset, onSearch]);

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
                          preselectPoint={true}
                          stickyBaseline={true}
                          customCoordinates={customCoordinates}
                          customFilename={file?.name || undefined}
                        />
                      </div>
                    </div>
                  )}
                  <div className={`${layout === 'split' ? 'col-6' : 'col-12'} d-flex flex-column`}>
                    {results ? (
                      <Bed2BedSearchResultsCards
                        results={results.results || []}
                        layout={'split'}
                        onCardClick={(bedId) => {
                          embeddingPlotRef.current?.centerOnBedId(bedId);
                        }}
                      />
                    ) : (
                      <div style={{height: '660px'}}>
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
              <div className='d-flex flex-column align-items-center justify-content-center mt-5 fst-italic text-muted'>
                <p className='mb-0'>Try uploading a BED file above to find similar files!</p>
                <p>
                  <strong>Note: </strong>provided file should be aligned to hg38 assembly.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

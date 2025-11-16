import { useEffect, useState, useRef, RefObject } from 'react';
import { SearchingJumper } from '../searching-jumper';
import { useBed2BedSearch } from '../../../queries/useBed2BedSearch';
// import { Bed2BedSearchResultsTable } from './b2b-search-results-table';
import { BEDEmbeddingPlot, BEDEmbeddingPlotRef } from '../../../components/umap/bed-embedding-plot.tsx';
import { Bed2BedSearchResultsCards } from './b2b-search-results-cards.tsx';

type Props = {
  file: File | null;
  layout: string;
  customCoordinates: number[] | null;
  embeddingPlotRef: RefObject<BEDEmbeddingPlotRef>;
};

export const Bed2Bed = (props: Props) => {
  const { file, layout, customCoordinates, embeddingPlotRef } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(660);

  const {
    isFetching: isSearching,
    data: results,
    refetch: onSearch,
  } = useBed2BedSearch({
    q: file,
    autoRun: false,
  });

  useEffect(() => {
    if (file) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setTimeout(() => {
        onSearch();
      }, 50);
    }
  }, [file, onSearch]);

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

  return (
    <div className='my-2'>
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
                      bedIds={results?.results?.map((result: any) => result.payload.id)}
                      height={containerHeight}
                      preselectPoint={true}
                      customCoordinates={customCoordinates}
                    />
                  </div>
                </div>
              )}
              
              <div className={`${layout === 'split' ? 'col-6' : 'col-12'} d-flex flex-column ${layout === 'split' ? 'overflow-hidden' : ''}`} style={layout === 'split' ? {height: `${containerHeight}px`} : {}}>
                <div className={`${layout === 'split' ? 'overflow-y-auto overflow-x-hidden flex-grow-1' : ''}`}>
                  <Bed2BedSearchResultsCards
                    results={results.results || []}
                    layout={'split'}
                    onCardClick={(bedId) => {
                      embeddingPlotRef.current?.centerOnBedId(bedId);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className='d-flex flex-column align-items-center justify-content-center mt-5 fst-italic text-muted'>
              <p className='mb-0'>Try uploading a BED file above to find similar files!</p>
              <p><strong>Note: </strong>provided file should be aligned to hg38 assembly.</p>
            </div>
          )}
        </div>

      )}
    </div>
  );
};

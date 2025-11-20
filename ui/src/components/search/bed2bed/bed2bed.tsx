import { useEffect, useState, useRef, RefObject } from 'react';
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
  const [stickyState, setStickyState] = useState<'normal' | 'sticky' | 'bottom'>('normal');
  const [stickyWidth, setStickyWidth] = useState<number | undefined>(undefined);
  const [stickyLeft, setStickyLeft] = useState<number | undefined>(undefined);

  const containerRef = useRef<HTMLDivElement>(null);
  const stickyDivRef = useRef<HTMLDivElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const stickyStateRef = useRef<'normal' | 'sticky' | 'bottom'>('normal');

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

  console.log(offset);
  console.log(results);

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
        // const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight * 0.9;
        setContainerHeight(Math.max(400, Math.min(availableHeight, 800)));
      }
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        if (stickyDivRef.current && colRef.current) {
          const currentState = stickyStateRef.current;

          // Capture the exact dimensions from the sticky div itself when in normal state
          if (currentState === 'normal') {
            const stickyRect = stickyDivRef.current.getBoundingClientRect();
            setStickyWidth(stickyRect.width);
            setStickyLeft(stickyRect.left);
          }

          // Use the sticky div's position when in normal state, otherwise use placeholder
          let divMiddle: number;
          if (currentState === 'normal') {
            const rect = stickyDivRef.current.getBoundingClientRect();
            divMiddle = rect.top + rect.height / 2;
          } else if (placeholderRef.current) {
            const rect = placeholderRef.current.getBoundingClientRect();
            divMiddle = rect.top + rect.height / 2;
          } else {
            return;
          }

          const viewportMiddle = window.innerHeight / 2;

          // Get the column (parent) boundaries
          const colRect = colRef.current.getBoundingClientRect();
          const colBottom = colRect.bottom;

          // Calculate if sticky div would go past the bottom of parent
          const stickyDivHeight = containerHeight;
          const wouldExceedBottom = colBottom < viewportMiddle + stickyDivHeight / 2;

          // Determine state
          let newState: 'normal' | 'sticky' | 'bottom';
          if (wouldExceedBottom) {
            newState = 'bottom';
          } else if (divMiddle <= viewportMiddle) {
            newState = 'sticky';
          } else {
            newState = 'normal';
          }

          if (newState !== currentState) {
            stickyStateRef.current = newState;
            setStickyState(newState);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll(); // Check initial position
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [layout, containerHeight]);

  return (
    <div className='my-2'>
      <div>
        {isSearching ? (
          <SearchingJumper />
        ) : (
          <div className='my-2' ref={containerRef}>
            {results ? (
              <>
                <div className='row gx-2'>
                  {layout === 'split' && (
                    <div ref={colRef} className='col-6' style={{ position: 'relative' }}>
                      <div
                        ref={placeholderRef}
                        style={{
                          height: stickyState === 'normal' ? '0' : `${containerHeight}px`,
                          position: 'relative',
                        }}
                      />
                      <div
                        ref={stickyDivRef}
                        className='d-flex border rounded overflow-hidden mb-2'
                        style={{
                          position:
                            stickyState === 'normal' ? 'relative' : stickyState === 'sticky' ? 'fixed' : 'absolute',
                          top: stickyState === 'sticky' ? '50vh' : 'auto',
                          bottom: stickyState === 'bottom' ? '0' : 'auto',
                          left: stickyState === 'sticky' && stickyLeft ? `${stickyLeft}px` : 'auto',
                          transform: stickyState === 'sticky' ? 'translateY(-50%)' : 'none',
                          width: stickyState !== 'normal' && stickyWidth ? `${stickyWidth}px` : '100%',
                          height: `${containerHeight}px`,
                        }}
                      >
                        <BEDEmbeddingPlot
                          ref={embeddingPlotRef}
                          bedIds={results?.results?.map((result: any) => result.payload.id)}
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
                    <div>
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
                <div className='row'>
                  <div className='col-12'>
                    <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={results.count} />
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

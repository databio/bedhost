/* eslint-disable react-hooks/exhaustive-deps */
import { Text2BedSearchResultsTable } from './t2b-search-results-table';
import { SearchingJumper } from '../searching-jumper';
import { useEffect, useState, useRef } from 'react';
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
  const [stickyState, setStickyState] = useState<'normal' | 'sticky' | 'bottom'>('normal');
  const [stickyWidth, setStickyWidth] = useState<number | undefined>(undefined);
  const [stickyLeft, setStickyLeft] = useState<number | undefined>(undefined);

  const embeddingPlotRef = useRef<BEDEmbeddingPlotRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyDivRef = useRef<HTMLDivElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const stickyStateRef = useRef<'normal' | 'sticky' | 'bottom'>('normal');

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
        // const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight*0.9;
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
          const wouldExceedBottom = colBottom < viewportMiddle + (stickyDivHeight / 2);

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
              <>
                <div className='row gx-2'>
                  {(layout === 'split') && (
                    <div ref={colRef} className='col-6' style={{ position: 'relative' }}>
                      <div
                        ref={placeholderRef}
                        style={{
                          height: stickyState === 'normal' ? '0' : `${containerHeight}px`,
                          position: 'relative'
                        }}
                      />
                      <div
                        ref={stickyDivRef}
                        className='d-flex border rounded overflow-hidden mb-2'
                        style={{
                          position: stickyState === 'normal' ? 'relative' : (stickyState === 'sticky' ? 'fixed' : 'absolute'),
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
                          bedIds={results?.results?.map((result: any) => result.id)}
                          height={containerHeight}
                          preselectPoint={false}
                          stickyBaseline={true}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className={`${layout === 'split' ? 'col-6' : 'col-12'} d-flex flex-column`}>
                    <div className=''>
                      <Text2BedSearchResultsTable
                        results={results || []}
                        search_query={searchTerm}
                        layout={layout}
                        onCardClick={(bedId) => {
                          embeddingPlotRef.current?.centerOnBedId(bedId);
                        }}
                      />{' '}
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

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { EmbeddingPlot } from './embedding-plot.tsx';
import { EmbeddingLegend } from './embedding-legend.tsx';
import type { EmbeddingPlotRef } from './embedding-plot.tsx';
import { EmbeddingTable } from './embedding-table.tsx';

export type EmbeddingState = 'compact' | 'expanding' | 'expanded' | 'collapsing' | 'hidden';
export type EmbeddingContainerRef = {
  handleExpand: () => void;
  handleShow: () => void;
  handleCollapse: () => void;
  handleHide: () => void;
}

type Props = {
  bedIds?: string[];
  height?: number;
  preselectPoint?: boolean;
  stickyInitial?: boolean;
  customCoordinates?: number[] | null;
  customFilename?: string;
  initialState?: EmbeddingState;
};

export const EmbeddingContainer = forwardRef<EmbeddingContainerRef, Props>((props, ref) => {
  const { bedIds, height, preselectPoint, stickyInitial, customCoordinates, customFilename, initialState } = props;

  const contentRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const embeddingPlotRef = useRef<EmbeddingPlotRef>(null);

  const [state, setState] = useState<EmbeddingState>(initialState || 'compact');
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [embeddingHeight, setEmbeddingHeight] = useState(500);
  const [legendItems, setLegendItems] = useState<any[]>([]);
  const [filterSelection, setFilterSelection] = useState<any>(null);
  const [colorGrouping, setColorGrouping] = useState('cell_line_category');
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);

  const handleExpand = () => {
    if (state !== 'compact' && state !== 'hidden') return;

    // If coming from hidden, first transition to compact, then expand
    if (state === 'hidden') {
      setState('compact');
      // Wait for next frame to ensure component is rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          handleExpand(); // Recursively call to expand from compact state
        });
      });
      return;
    }

    // Capture the current position before portal
    const rect = contentRef.current?.getBoundingClientRect();
    if (rect) {
      setOriginRect(rect);
    }

    // Start expansion animation
    setState('expanding');

    // Delay backdrop visibility to allow initial transparent state to render
    requestAnimationFrame(() => {
      setBackdropVisible(true);
    });

    // After animation duration, mark as fully expanded
    setTimeout(() => {
      setState('expanded');
    }, 200);

    if (selectedPoints.length > 0) {
      const currentSelection = [...selectedPoints];
      setTimeout(() => {
        setSelectedPoints([]);
        setSelectedPoints(currentSelection);
      }, 0);
    }
  };

  const handleShow = () => {
    if (state !== 'compact' && state !== 'hidden') return;
    setState('expanded');
    requestAnimationFrame(() => {
      setBackdropVisible(true);
    });
    if (selectedPoints.length > 0) {
      const currentSelection = [...selectedPoints];
      setTimeout(() => {
        setSelectedPoints([]);
        setSelectedPoints(currentSelection);
      }, 0);
    }
  };

  const handleCollapse = () => {
    if (state !== 'expanded') return;

    // Re-capture position from placeholder (handles window resize)
    const currentRect = placeholderRef.current?.getBoundingClientRect();
    if (currentRect) {
      setOriginRect(currentRect);
    }

    // Start fading out backdrop immediately
    setBackdropVisible(false);

    setState('collapsing');

    // After animation, return to compact
    setTimeout(() => {
      setState('compact');
      setOriginRect(null);
    }, 200);

    if (selectedPoints.length > 0) {
      const currentSelection = [...selectedPoints];
      setTimeout(() => {
        setSelectedPoints([]);
        setSelectedPoints(currentSelection);
      }, 0);
    }
  };

  const handleHide = () => {
    if (state !== 'expanded') return;

    // Start fading out backdrop immediately
    setBackdropVisible(false);

    setState('collapsing');

    // After animation, go to hidden and clear originRect
    setTimeout(() => {
      setState('hidden');
      setOriginRect(null);
    }, 200);
  };

  // Container styles (full screen instantly when expanding)
  const getContainerStyles = (): React.CSSProperties => {
    if (state === 'compact') {
      return {}; // Normal flow
    }

    // All non-compact states: fixed full screen instantly
    return {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 10000,
    };
  };

  // Inner card animation styles (instant positioning)
  const getInnerCardStyles = (): React.CSSProperties => {
    if (state === 'compact') {
      return {}; // Normal flow
    }

    // All non-compact states: fill the container instantly
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    };
  };

  useEffect(() => {
    if (state === 'expanded') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [state]);

  useImperativeHandle(ref, () => ({
    handleExpand,
    handleShow,
    handleCollapse,
    handleHide
  }));

  const content = (
    <div
      className="expandable-card-container"
      style={getContainerStyles()}
    >
      <div
        ref={contentRef}
        className={`expandable-card expandable-card--${state} ${state === 'compact' ? 'rounded' : ''} overflow-hidden`}
        style={getInnerCardStyles()}
      >
        <div className="expandable-card__layout">
          <div className="expandable-card__main">
            <div className='border bg-white rounded position-relative overflow-hidden'>
              {state === 'compact' ? (
                <span className='badge rounded-2 text-bg-primary position-absolute cursor-pointer' style={{top: '0.5rem', left: '0.5rem', zIndex: 9999}} onClick={handleExpand}>
                  <i className='bi bi-fullscreen'></i>
                </span>
              ) : initialState === 'hidden' ? (
                <span className='badge rounded-2 text-bg-danger position-absolute cursor-pointer' style={{top: '0.5rem', left: '0.5rem', zIndex: 9999}} onClick={handleHide}>
                  <i className='bi bi-x-lg'></i>
                </span>
              ) : (
                <span className='badge rounded-2 text-bg-primary position-absolute cursor-pointer' style={{top: '0.5rem', left: '0.5rem', zIndex: 9999}} onClick={handleCollapse}>
                  <i className='bi bi-fullscreen-exit'></i>
                </span>
              )}
              <EmbeddingPlot
                ref={embeddingPlotRef}
                bedIds={bedIds}
                showStatus={state === 'expanded'}
                height={state === 'compact' ? height : undefined}
                preselectPoint={preselectPoint}
                stickyInitial={stickyInitial}
                customCoordinates={customCoordinates}
                customFilename={customFilename}
                colorGrouping={colorGrouping}
                onLegendItemsChange={setLegendItems}
                filterSelection={filterSelection}
                onFilterSelectionChange={setFilterSelection}
                selectedPoints={selectedPoints}
                onSelectedPointsChange={setSelectedPoints}
                embeddingHeight={embeddingHeight}
                onEmbeddingHeightChange={setEmbeddingHeight}
              />
            </div>
            <div className="expandable-card__secondary">
              <div className='card border overflow-hidden mt-2' style={{ height: `calc(100vh - ${embeddingHeight + 26}px)` }}>
                <EmbeddingTable
                  selectedPoints={selectedPoints}
                  centerOnBedId={(bedId, scale) => embeddingPlotRef.current?.centerOnBedId(bedId, scale)}
                />
              </div>
            </div>
          </div>
          <div className="expandable-card__sidebar">
            <div className='expandable-card__extra-content'>
              {embeddingPlotRef && (
                <EmbeddingLegend
                  legendItems={legendItems}
                  filterSelection={filterSelection}
                  handleLegendClick={(item) => embeddingPlotRef.current?.handleLegendClick(item)}
                  colorGrouping={colorGrouping}
                  setColorGrouping={setColorGrouping}
                />
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (state === 'expanding' || state === 'expanded' || state === 'collapsing') {
    // When collapsing to hidden (initialState is hidden), don't show placeholder
    const shouldShowPlaceholder = !(state === 'collapsing' && initialState === 'hidden');

    return (
      <>
        <div
          ref={placeholderRef}
          className="expandable-card-placeholder bg-body-secondary border-2 rounded"
          style={{
            width: '100%',
            height: shouldShowPlaceholder ? (originRect?.height || 330) : 0,
            overflow: 'hidden',
          }}
        />

        {createPortal(
          <>
            <div
              className={`expandable-card-backdrop ${backdropVisible ? 'expandable-card-backdrop--visible' : ''}`}
              onClick={state === 'expanded' ? (initialState === 'hidden' ? handleHide : handleCollapse) : undefined}
            />
            {content}
          </>,
          document.body
        )}
      </>
    );
  }

  if (state === 'hidden') {
    return <div style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', height: 0, overflow: 'hidden' }}>{content}</div>;
  }

  return content;
  
});

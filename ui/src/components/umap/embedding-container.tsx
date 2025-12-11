import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { EmbeddingPlot } from './embedding-plot.tsx';
import type { EmbeddingPlotRef } from './embedding-plot.tsx';
import { EmbeddingLegend } from './embedding-legend.tsx';
import { EmbeddingTable } from './embedding-table.tsx';
import { useBedCart } from '../../contexts/bedcart-context';
import { useBedUmap } from '../../queries/useBedUmap.ts';
import { EmbeddingStats } from './embedding-stats.tsx';

export type EmbeddingState = 'compact' | 'expanding' | 'expanded' | 'collapsing' | 'hidden';
export type EmbeddingContainerRef = {
  handleExpand: () => void;
  handleShow: () => void;
  handleCollapse: () => void;
  handleHide: () => void;
  centerOnBedId: (bedId: string, scale?: number, smooth?: boolean) => void;
}

type Props = {
  bedIds?: string[];
  height?: number;
  preselectPoint?: boolean;
  stickyInitial?: boolean;
  centerInitial?: boolean;
  tooltipInitial?: boolean;
  simpleTooltip?: boolean;
  initialState?: EmbeddingState;
  blockCompact?: boolean;
  showBorder?: boolean;
  uploadedFile?: File;
};

export const EmbeddingContainer = forwardRef<EmbeddingContainerRef, Props>((props, ref) => {
  const { 
    bedIds, 
    height, 
    preselectPoint, 
    stickyInitial, 
    centerInitial, 
    tooltipInitial, 
    simpleTooltip, 
    initialState, 
    blockCompact, 
    showBorder = true, 
    uploadedFile 
  } = props;

  const { addMultipleBedsToCart } = useBedCart();
  const { mutateAsync: getUmapCoordinates } = useBedUmap();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const embeddingPlotRef = useRef<EmbeddingPlotRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<EmbeddingState>(initialState || 'compact');
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [embeddingHeight, setEmbeddingHeight] = useState(500);
  const [legendItems, setLegendItems] = useState<any[]>([]);
  const [filterSelection, setFilterSelection] = useState<any>(null);
  const [colorGrouping, setColorGrouping] = useState('cell_line_category');
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);
  const [file, setFile] = useState<File | null>(uploadedFile || null);
  const [customCoordinates, setCustomCoordinates] = useState<number[] | null>(null);

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

  useEffect(() => {
    if (!file) return;
    (async () => {
      const coordinates = await getUmapCoordinates(file);
      setCustomCoordinates(coordinates);
    })();
  }, [file]);

  useImperativeHandle(ref, () => ({
    handleExpand,
    handleShow,
    handleCollapse,
    handleHide,
    centerOnBedId: (bedId: string, scale?: number, smooth?: boolean) => {
      embeddingPlotRef.current?.centerOnBedId(bedId, scale, smooth);
    }
  }));

  const content = (
    <div
      className='expandable-card-container'
      style={getContainerStyles()}
    >
      <div
        ref={contentRef}
        className={`expandable-card expandable-card--${state} ${state === 'compact' ? 'rounded' : ''} overflow-hidden`}
        style={getInnerCardStyles()}
      >
        <div className='expandable-card__layout'>
          <div className='expandable-card__main' onClick={state === 'compact' && blockCompact ? handleExpand : undefined} style={state === 'compact' && blockCompact ? { cursor: 'pointer' } : undefined}>
            <div className={`position-relative overflow-hidden bg-white ${state !== 'compact' || showBorder ? 'border rounded' : ''}`}>
              {state === 'compact' && blockCompact && (
                <div className='position-absolute w-100 h-100' style={{top: 0, left: 0, zIndex: 1}} />
              )}
              {state === 'compact' ? blockCompact ? (
                <></>
              ) : (
                <span 
                  className='badge rounded-2 text-bg-primary position-absolute cursor-pointer border border-primary' 
                  style={{top: '0.5rem', left: '0.5rem', zIndex: 9999}} 
                  title='Expand Embeddings'
                  onClick={handleExpand}
                >
                  <i className='bi bi-fullscreen' />
                </span>
              ) : initialState === 'hidden' ? (
                <span 
                  className='badge rounded-2 text-bg-danger position-absolute cursor-pointer border border-danger' 
                  style={{top: '0.5rem', left: '0.5rem', zIndex: 9999}} 
                  onClick={handleHide}
                  title='Hide Embeddings'
                >
                  <i className='bi bi-x-lg' />
                </span>
              ) : (
                <span 
                  className='badge rounded-2 text-bg-danger position-absolute cursor-pointer border border-danger' 
                  style={{top: '0.5rem', left: '0.5rem', zIndex: 9999}} 
                  onClick={handleCollapse}
                  title='Collapse Embeddings'
                >
                  <i className='bi bi-x-lg' />
                </span>
              )}
              {state === 'expanded' ? (
                <span className='position-absolute p-0 m-0 d-flex gap-1' style={{top: '0.5rem', right: '0.5rem', zIndex: 9999}}>
                  {!!file && (
                    <span 
                      className='badge rounded-2 text-bg-light border cursor-pointer fw-normal'
                      title='Locate Uploaded File'
                      onClick={() => embeddingPlotRef.current?.centerOnBedId('custom_point', 1, true)}
                    >
                      <i className='bi bi-pin-map'></i>
                    </span>
                  )}
                  <span
                    className='badge rounded-2 text-bg-secondary border border-secondary cursor-pointer fw-normal'
                    title='Remove File'
                    onClick={() => {
                      if (!!file) {
                        embeddingPlotRef.current?.handleFileRemove();
                        setFile(null);
                        setCustomCoordinates(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    {!!file ? <>{file.name} <i className='bi bi-x-lg' /></> : 'Upload BED'}
                  </span>
                  <input
                    ref={fileInputRef}
                    className='d-none'
                    type='file'
                    accept='.bed,.gz,application/gzip,application/x-gzip'
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        setFile(selectedFile);
                        
                      }
                    }}
                  />
                  <span
                    className='badge rounded-2 text-bg-primary border border-primary cursor-pointer fw-normal'
                    title='Add Selection to Cart'
                    onClick={() => {
                      const bedItems = selectedPoints
                        .filter((point: any) => point.identifier !== 'custom_point')
                        .map((point: any) => ({
                          id: point.identifier,
                          name: point.text || 'No name',
                          genome: point.genome_alias || 'N/A',
                          tissue: point.annotation?.tissue || 'N/A',
                          cell_line: point.fields?.['Cell Line'] || 'N/A',
                          cell_type: point.annotation?.cell_type || 'N/A',
                          description: point.fields?.Description || '',
                          assay: point.fields?.Assay || 'N/A',
                        }));
                      addMultipleBedsToCart(bedItems);
                      setAddedToCart(true);
                      setTimeout(() => {
                        setAddedToCart(false);
                      }, 500);
                    }}
                  >
                    {addedToCart ? 'Adding...' : `Add ${selectedPoints.length} to Cart`}
                  </span>
                </span>
              ) : (
                <></>
              )}
              <EmbeddingPlot
                ref={embeddingPlotRef}
                bedIds={bedIds}
                showStatus={state === 'expanded'}
                height={state === 'compact' ? height : undefined}
                preselectPoint={state === 'compact' ? preselectPoint : true}
                stickyInitial={state === 'compact' ? stickyInitial : true}
                centerInitial={state === 'compact' ? centerInitial : false}
                tooltipInitial={state === 'compact' ? tooltipInitial : true}
                customCoordinates={customCoordinates}
                customFilename={file?.name || undefined}
                simpleTooltip={state === 'compact' ? simpleTooltip : false}
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
            <div className='expandable-card__secondary'>
              <div className='card border overflow-hidden mt-2' style={{ height: `calc(100vh - ${embeddingHeight + 26}px)` }}>
                <EmbeddingTable
                  selectedPoints={selectedPoints}
                  centerOnBedId={(bedId, scale) => embeddingPlotRef.current?.centerOnBedId(bedId, scale)}
                />
              </div>
            </div>
          </div>
          <div className='expandable-card__sidebar'>
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
            <div className='expandable-card__extra-content'>
              {embeddingPlotRef && (
                <EmbeddingStats selectedPoints={selectedPoints} colorGrouping={colorGrouping} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (state === 'expanding' || state === 'expanded' || state === 'collapsing') {
    const shouldShowPlaceholder = !(state === 'collapsing' && initialState === 'hidden');

    return (
      <>
        <div
          ref={placeholderRef}
          className='expandable-card-placeholder bg-body-secondary border-2 rounded'
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

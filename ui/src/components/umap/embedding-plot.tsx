import { EmbeddingViewMosaic } from 'embedding-atlas/react';
import { useEffect, useState, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import toast from 'react-hot-toast';
import * as vg from '@uwdata/vgplot';

import { tableau20 } from '../../utils';
import { AtlasTooltip } from './atlas-tooltip';
import { useMosaicCoordinator } from '../../contexts/mosaic-coordinator-context';

import { isPointInPolygon } from '../../utils';

type Props = {
  bedIds?: string[];
  showStatus?: boolean;
  height?: number;
  preselectPoint?: boolean; // preselect an initial point that is provided either as bedId[0] or a file with custom points
  stickyInitial?: boolean; // forces initial point to remain selected as you select other points
  centerInitial?: boolean; // centers initial point on load
  tooltipInitial?: boolean; // show tooltip for initial selected point
  customCoordinates?: number[] | null;
  customFilename?: string;
  simpleTooltip?: boolean;
  colorGrouping?: string;
  onLegendItemsChange?: (items: any[]) => void;
  filterSelection?: any;
  onFilterSelectionChange?: (selection: any) => void;
  selectedPoints?: any[];
  onSelectedPointsChange?: (points: any[]) => void;
  embeddingHeight?: number;
  onEmbeddingHeightChange?: (embeddingHeight: number) => void;
};

export type EmbeddingPlotRef = {
  centerOnBedId: (bedId: string, scale?: number, reselect?: boolean) => Promise<void>;
  handleFileRemove: () => Promise<void>;
  handleLegendClick: (item: any) => void;
}

export const EmbeddingPlot = forwardRef<EmbeddingPlotRef, Props>((props, ref) => {
  const {
    bedIds,
    showStatus,
    height,
    preselectPoint,
    stickyInitial,
    centerInitial,
    tooltipInitial,
    customCoordinates,
    customFilename,
    simpleTooltip,
    colorGrouping = 'cell_line_category',
    onLegendItemsChange,
    filterSelection,
    onFilterSelectionChange,
    selectedPoints,
    onSelectedPointsChange,
    embeddingHeight,
    onEmbeddingHeightChange,
  } = props;
  const { coordinator, initializeData, addCustomPoint, deleteCustomPoint, webglStatus } = useMosaicCoordinator();

  const containerRef = useRef<HTMLDivElement>(null);
  const baselinePointsRef = useRef<any[]>([]);

  const [containerWidth, setContainerWidth] = useState(900);
  const [isReady, setIsReady] = useState(false);
  const [tooltipPoint, setTooltipPoint] = useState<any>(null);
  const [viewportState, setViewportState] = useState<any>(null);
  const [initialPoint, setInitialPoint] = useState<any>(null);
  // const [addedToCart, setAddedToCart] = useState(false);
  // const [uploadedFilename, setUploadedFilename] = useState('');
  // const [dataVersion, setDataVersion] = useState(0);
  // const [pendingSelection, setPendingSelection] = useState<any[] | null>(null);

  const filter = useMemo(() => vg.Selection.intersect(), []);
  const legendFilterSource = useMemo(() => ({}), []);

  const centerOnPoint = (point: any, scale: number = 1, tooltip: boolean = true) => {
    if (tooltip) {
      setTimeout(() => {
        setTooltipPoint(point);
      }, 300)
    }
    setViewportState({
      x: point.x,
      y: point.y,
      scale: scale,
    });
  };

  const centerOnBedId = async (bedId: string, scale: number = 1, reselect: boolean = false) => {
    if (!isReady) return;

    const bedData: any = await coordinator.query(
      `SELECT
        x, y,
        ${colorGrouping} as category,
        name as text,
        id as identifier,
        {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
       FROM data
       WHERE id = '${bedId}'`,
      { type: 'json' },
    );

    if (bedData && bedData.length > 0) {
      centerOnPoint(bedData[0], scale);
      if (reselect) onSelectedPointsChange?.([bedData[0]]);
    } else {
      toast.error('Error: BED file not present in embeddings.');
    }
  };

  const handleFileRemove = async () => {
    try {
      await deleteCustomPoint();
      coordinator.clear();
    } catch (error) {
      console.error('Error removing file');
    }
  };

  const fetchLegendItems = async (coordinator: any) => {
    const query = `SELECT DISTINCT
        ${colorGrouping.replace('_category', '')} as name,
        ${colorGrouping} as category
        FROM data
        ORDER BY ${colorGrouping}`;

    const result = (await coordinator.query(query, { type: 'json' })) as any[];
    return result;
  };

  const handleLegendClick = (item: any) => {
    if (filterSelection?.category === item.category) {
      onFilterSelectionChange?.(null);
      filter.update({
        source: legendFilterSource, // memoized so that mosaic can keep track of source and clear previous selection
        value: null,
        predicate: null,
      });
    } else {
      onFilterSelectionChange?.(item);
      filter.update({
        source: legendFilterSource,
        value: item.category,
        predicate: vg.eq(colorGrouping, item.category),
      });
    }
  };

  const handlePointSelection = (dataPoints: any[] | null) => {
    if (!dataPoints || (dataPoints.length === 0 && stickyInitial)) {
      setTimeout(() => {
        if (baselinePointsRef.current.length > 0) {
          onSelectedPointsChange?.([...baselinePointsRef.current])
        }
      }, 0);
      return;
    }
    onSelectedPointsChange?.(dataPoints)
  };

  const handleRangeSelection = async (coordinator: any, value: any) => {
    if (!value) {
      return;
    }

    let result;
    // filter clause prevents selecting points that are not within a selected legend category
    const filterClause = filterSelection ? ` AND ${colorGrouping} = '${filterSelection.category}'` : '';

    // Check if rectangle selection (bounding box)
    if (typeof value === 'object' && 'xMin' in value) {
      result = (await coordinator.query(
        `SELECT
          x, y,
          ${colorGrouping} as category,
          name as text,
          id as identifier,
          {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
          FROM data
          WHERE x >= ${value.xMin} AND x <= ${value.xMax} AND y >= ${value.yMin} AND y <= ${value.yMax}${filterClause}`,
        { type: 'json' },
      )) as any[];
    }
    // Check if lasso selection (array of points)
    else if (Array.isArray(value) && value.length > 0) {
      // First get points within bounding box (optimization)
      const xCoords = value.map((p: any) => p.x);
      const yCoords = value.map((p: any) => p.y);
      const xMin = Math.min(...xCoords);
      const xMax = Math.max(...xCoords);
      const yMin = Math.min(...yCoords);
      const yMax = Math.max(...yCoords);

      // Only fetch x, y, identifier for filtering, then get full data for matches
      const candidates: any = await coordinator.query(
        `SELECT x, y, id as identifier FROM data
          WHERE x >= ${xMin} AND x <= ${xMax} AND y >= ${yMin} AND y <= ${yMax}${filterClause}`,
        { type: 'json' },
      );

      // Filter to points inside polygon
      const filteredIds = candidates
        .filter((point: any) => isPointInPolygon(point, value))
        .map((p: any) => `'${p.identifier}'`)
        .join(',');

      if (filteredIds) {
        result = (await coordinator.query(
          `SELECT
            x, y,
            ${colorGrouping} as category,
            name as text,
            id as identifier,
            {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
            FROM data
            WHERE id IN (${filteredIds})${filterClause}`,
          { type: 'json' },
        )) as any[];
      } else {
        result = [];
      }
    }

    const resultArray = result || [];
    // const hasInitialPoint = resultArray.length > 0 && resultArray.some((p: any) => p.identifier === initialPoint?.identifier);
    let finalPoints = stickyInitial ? [initialPoint, ...resultArray] : resultArray;

    onSelectedPointsChange?.(finalPoints)
  };

  useEffect(() => {
    // set legend items
    if (isReady) {
      fetchLegendItems(coordinator).then((result) => {
        onLegendItemsChange?.(result);
      });
    }
  }, [isReady, colorGrouping, onLegendItemsChange]);

  useEffect(() => {
    // initialize data
    initializeData().then(async () => {
      if (!!customCoordinates) {
        await addCustomPoint(customCoordinates[0], customCoordinates[1], customFilename);
        coordinator.clear();
      }
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    // fetch provided bed ids
    if (isReady && bedIds && bedIds.length > 0) {
      setTimeout(async () => {
        const idsToQuery = customCoordinates ? ['custom_point', ...bedIds] : bedIds;
        const currentBed: any = await coordinator.query(
          `SELECT
            x, y,
            ${colorGrouping} as category,
            name as text,
            id as identifier,
            {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
           FROM data
           WHERE id IN ('${idsToQuery.join("','")}')`,
          { type: 'json' },
        );
        if (!currentBed || currentBed.length === 0) return;
        const pointToSelect = customCoordinates
          ? currentBed.find((bed: any) => bed.identifier === 'custom_point') || currentBed[0]
          : currentBed[0];
        setInitialPoint(pointToSelect);
        if (preselectPoint) {
          if (!!customCoordinates || centerInitial) {
            centerOnPoint(pointToSelect, 0.2, tooltipInitial);
          } else if (tooltipInitial) {
            setTimeout(() => {
              setTooltipPoint(pointToSelect);
            }, 300)
          }
        }
        baselinePointsRef.current = currentBed;
        onSelectedPointsChange?.(currentBed)
      }, 50);
    }
  }, [isReady, bedIds, coordinator, colorGrouping, customCoordinates]);

  useEffect(() => {
    // resize width and height of view based on window size
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
      // Calculate height: window height minus approximate offset for header/footer/margins
      const calculatedHeight = Math.max(400, window.innerHeight * 0.67);
      onEmbeddingHeightChange?.(calculatedHeight);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, [isReady]);

  useImperativeHandle(ref, () => ({
    centerOnBedId,
    handleFileRemove,
    handleLegendClick,
  }), [filterSelection, colorGrouping, selectedPoints, initialPoint]);

  return (
    <>
      {webglStatus.error ? (
        <div
          className='w-100 d-flex align-items-center justify-content-center bg-white'
          style={{ height: height || 500 }}
          ref={containerRef}
        >
          <span className='text-muted text-sm'>{webglStatus.error}</span>
        </div>
      ) : (
        <>
          {isReady ? (
            <div className='w-100 fade-in' ref={containerRef} style={height ? { height: `${height}px`, overflow: 'hidden' } : {}}>
              <EmbeddingViewMosaic
                coordinator={coordinator}
                table='data'
                x='x'
                y='y'
                identifier='id'
                text='name'
                category={colorGrouping}
                categoryColors={tableau20}
                additionalFields={{ Description: 'description', Assay: 'assay', 'Cell Line': 'cell_line' }}
                height={height || embeddingHeight}
                width={containerWidth}
                config={{
                  autoLabelEnabled: false,
                }}
                filter={filter}
                viewportState={viewportState}
                onViewportState={setViewportState}
                tooltip={tooltipPoint}
                customTooltip={{
                  class: AtlasTooltip,
                  props: {
                    showLink: true,
                    simpleTooltip: simpleTooltip
                  },
                }}
                selection={selectedPoints}
                onSelection={handlePointSelection}
                onRangeSelection={(e) => handleRangeSelection(coordinator, e)}
                theme={{
                  statusBar: showStatus,
                }}
              />
            </div>
          ) : (
            <div
              className='w-100 d-flex align-items-center justify-content-center bg-white'
              style={{ height: height || 500 }}
              ref={containerRef}
            >
              <span className='text-muted text-sm'>Loading...</span>
            </div>
          )}
        </>
      )}
    </>
  );
});

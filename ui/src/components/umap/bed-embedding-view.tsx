import { EmbeddingViewMosaic } from 'embedding-atlas/react';
import { useEffect, useState, useRef, useMemo } from 'react';
import * as vg from '@uwdata/vgplot';

import { isPointInPolygon, tableau20 } from '../../utils';
import { useBedCart } from '../../contexts/bedcart-context';
import { components } from '../../../bedbase-types';
import { AtlasTooltip } from './atlas-tooltip';
import { useMosaicCoordinator } from '../../contexts/mosaic-coordinator-context';
import { useBedUmap } from '../../queries/useBedUmap';
import { EmbeddingLegend } from './embedding-legend';
import { EmbeddingTable } from './embedding-table';

type SearchResponse = components['schemas']['BedListSearchResult'];

type Props = {
  bedId?: string;
  neighbors?: SearchResponse;
  showNeighbors?: boolean;
  enableUpload?: boolean;
};

export const BEDEmbeddingView = (props: Props) => {
  const { bedId, neighbors, showNeighbors, enableUpload } = props;
  const { coordinator, initializeData, addCustomPoint, deleteCustomPoint, webglStatus } = useMosaicCoordinator();
  const { addMultipleBedsToCart } = useBedCart();
  const { mutateAsync: getUmapCoordinates } = useBedUmap();

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [containerWidth, setContainerWidth] = useState(900);
  const [embeddingHeight, setEmbeddingHeight] = useState(500);
  const [isReady, setIsReady] = useState(false);
  const [colorGrouping, setColorGrouping] = useState('cell_line_category');
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [initialPoint, setInitialPoint] = useState<any>(null);
  const [viewportState, setViewportState] = useState<any>(null);
  const [legendItems, setLegendItems] = useState<string[]>([]);
  const [filterSelection, setFilterSelection] = useState<any>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [tooltipPoint, setTooltipPoint] = useState<any>(null);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [dataVersion, setDataVersion] = useState(0);
  const [pendingSelection, setPendingSelection] = useState<any[] | null>(null);
  const [uploadButtonText, setUploadButtonText] = useState('Upload BED');

  const filter = useMemo(() => vg.Selection.intersect(), []);
  const legendFilterSource = useMemo(() => ({}), []);
  const neighborIDs = useMemo(() => neighbors?.results?.map((result) => result.id), [neighbors]);

  const centerOnPoint = (point: any, scale: number = 1) => {
    setTooltipPoint(point);
    setViewportState({
      x: point.x,
      y: point.y,
      scale: scale,
    });
  };

  const handleFileRemove = async () => {
    try {
      await deleteCustomPoint();
      setUploadedFilename('');

      coordinator.clear();
      const updatedLegend = await fetchLegendItems(coordinator);
      setLegendItems(updatedLegend);

      // Prepare selection without custom point
      const newSelection = selectedPoints.filter((p: any) => p.identifier !== 'custom_point');
      setPendingSelection(newSelection);

      // Force remount to remove point from map
      setDataVersion((v) => v + 1);
    } catch (error) {
      console.error('Error deleting file');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadButtonText('Uploading...');

    try {
      const coordinates = await getUmapCoordinates(file);

      if (coordinates.length >= 2) {
        await addCustomPoint(coordinates[0], coordinates[1]);
        setUploadedFilename(file.name);

        // Clear coordinator cache and refresh legend
        coordinator.clear();
        const updatedLegend = await fetchLegendItems(coordinator);
        setLegendItems(updatedLegend);

        // await new Promise(resolve => setTimeout(resolve, 150));

        // Query the uploaded point
        const customPoint: any = await coordinator.query(
          `SELECT
            x, y,
            ${colorGrouping} as category,
            name as text,
            id as identifier,
            {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
            FROM data
            WHERE id = 'custom_point'`,
          { type: 'json' },
        );

        if (customPoint && customPoint.length > 0) {
          // console.log('Custom point queried:', customPoint[0]);

          // Prepare selection to apply after remount
          const newSelection = selectedPoints.filter((p: any) => p.identifier !== 'custom_point');
          newSelection.push(customPoint[0]);
          setPendingSelection(newSelection);

          // Force remount to show new point
          setDataVersion((v) => v + 1);
        }
      }
    } catch (error) {
      console.error('Error getting UMAP coordinates:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadButtonText('Upload BED');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getSortedSelectedPoints = () => {
    if (!selectedPoints || selectedPoints.length === 0) return [];

    const currentBed = selectedPoints.find((p: any) => p.identifier === bedId);
    const others = selectedPoints.filter((p: any) => p.identifier !== bedId);

    if (neighbors?.results && neighbors.results.length > 0) {
      const scoreMap = new Map(neighbors.results.map((n) => [n.id, n.score]));
      others.sort((a: any, b: any) => {
        const scoreA = scoreMap.get(a.identifier) || 0;
        const scoreB = scoreMap.get(b.identifier) || 0;
        return scoreB - scoreA; // Descending order
      });
    }

    return currentBed ? [currentBed, ...others] : others;
  };

  const handleLegendClick = (item: any) => {
    if (filterSelection?.category === item.category) {
      setFilterSelection(null);
      filter.update({
        source: legendFilterSource, // memoized so that mosaic can keep track of source and clear previous selection
        value: null,
        predicate: null,
      });
    } else {
      setFilterSelection(item);
      filter.update({
        source: legendFilterSource,
        value: item.category,
        predicate: vg.eq(colorGrouping, item.category),
      });
    }
  };

  const handlePointSelection = (dataPoints: any[] | null) => {
    // console.log('Selection changed via onSelection callback:', dataPoints);
    const points = dataPoints || [];
    const hasInitialPoint = points.some((p) => p.identifier === initialPoint?.identifier);
    let finalPoints = hasInitialPoint ? points : initialPoint ? [initialPoint, ...points] : points;

    if (showNeighbors && neighborIDs && neighborIDs.length > 0) {
      const selectedIds = new Set(finalPoints.map((p: any) => p.identifier));
      const missingNeighborIds = neighborIDs.filter((id) => !selectedIds.has(id));

      if (missingNeighborIds.length > 0) {
        coordinator
          .query(
            `SELECT
            x, y,
            ${colorGrouping} as category,
            name as text,
            id as identifier,
            {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
           FROM data
           WHERE id IN (${missingNeighborIds.map((id) => `'${id}'`).join(',')})`,
            { type: 'json' },
          )
          .then((neighborPoints: any) => {
            setSelectedPoints([...finalPoints, ...neighborPoints]);
          });
        return;
      }
    }

    // setTooltipPoint(finalPoints.slice(-1)[0])
    setSelectedPoints(finalPoints);
  };

  // Range selection (for rectangle/lasso)
  const handleRangeSelection = async (coordinator: any, value: any) => {
    // console.log('Range selection updated:', value);

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
    const hasInitialPoint =
      resultArray.length > 0 && resultArray.some((p: any) => p.identifier === initialPoint?.identifier);
    let finalPoints = hasInitialPoint ? resultArray : initialPoint ? [initialPoint, ...resultArray] : resultArray;

    if (showNeighbors && neighborIDs && neighborIDs.length > 0) {
      const selectedIds = new Set(finalPoints.map((p: any) => p.identifier));
      const missingNeighborIds = neighborIDs.filter((id) => !selectedIds.has(id));

      if (missingNeighborIds.length > 0) {
        // fetch missing neighbor points
        const neighborPoints = (await coordinator.query(
          `SELECT
            x, y,
            ${colorGrouping} as category,
            name as text,
            id as identifier,
            {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
           FROM data
           WHERE id IN (${missingNeighborIds.map((id) => `'${id}'`).join(',')})`,
          { type: 'json' },
        )) as any[];
        finalPoints = [...finalPoints, ...neighborPoints];
      }
    }

    setSelectedPoints(finalPoints);
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

  useEffect(() => {
    // initialize data
    initializeData().then(() => {
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    // resize width and height of view based on window size
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
      // Calculate height: window height minus approximate offset for header/footer/margins
      const calculatedHeight = Math.max(400, window.innerHeight * 0.6);
      setEmbeddingHeight(calculatedHeight);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, [isReady]);

  useEffect(() => {
    // set legend items
    if (isReady) {
      fetchLegendItems(coordinator).then((result) => {
        setLegendItems(result);
      });
    }
  }, [isReady, colorGrouping]);

  useEffect(() => {
    // apply pending selection after dataVersion change
    if (pendingSelection !== null) {
      setTimeout(() => {
        setSelectedPoints(pendingSelection);
        // If there's an uploaded file, center on it and set tooltip
        if (uploadedFilename) {
          const uploadedPoint = pendingSelection.find((point: any) => point.identifier === 'custom_point');
          if (uploadedPoint) {
            centerOnPoint(uploadedPoint, 0.3);
          }
        }
        setPendingSelection(null);
      }, 200);
    }
  }, [dataVersion, pendingSelection]);

  useEffect(() => {
    // fetch initial bed id and neighbors
    if (isReady && !!bedId) {
      setTimeout(async () => {
        const currentBed: any = await coordinator.query(
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
        if (!currentBed || currentBed.length === 0) return;
        setInitialPoint(currentBed[0]);
        setTooltipPoint(currentBed[0]);

        if (showNeighbors && neighborIDs && neighborIDs.length > 0) {
          const neighborPoints: any = await coordinator.query(
            `SELECT
              x, y,
              ${colorGrouping} as category,
              name as text,
              id as identifier,
              {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
             FROM data
             WHERE id IN (${neighborIDs.map((id) => `'${id}'`).join(',')})`,
            { type: 'json' },
          );
          setSelectedPoints([currentBed[0], ...neighborPoints]);
        } else if (showNeighbors && enableUpload) {
          setSelectedPoints([currentBed[0]]);
        } else {
          setSelectedPoints([currentBed[0]]);
        }
      }, 200);
    }
  }, [isReady, bedId, coordinator, colorGrouping, showNeighbors, neighborIDs]);

  return (
    <>
      <div className='row mt-2 pt-1'>
        {enableUpload && (
          <div className='col-12'>
            <div className='d-flex align-items-start justify-content-between'></div>
          </div>
        )}
      </div>
      {isReady ? (
        <div className='row mb-4 g-2'>
          <div className='col-sm-10'>
            <div className='card mb-2 border overflow-hidden'>
              <div className='card-header text-xs fw-bolder border-bottom d-flex justify-content-between align-items-center'>
                <span>Region Embeddings</span>
                <button
                  className='btn btn-secondary btn-xs ms-auto'
                  onClick={handleUploadClick}
                  disabled={uploadButtonText !== 'Upload BED'}
                >
                  {uploadButtonText}
                </button>
                <input
                  ref={fileInputRef}
                  className='d-none'
                  type='file'
                  accept='.bed,.gz,application/gzip,application/x-gzip'
                  onChange={handleFileUpload}
                />
                {!!uploadedFilename && (
                  <span className='btn btn-outline-secondary btn-xs ms-1' onClick={handleFileRemove}>
                    {uploadedFilename}
                    <i
                      className='bi bi-trash3-fill text-danger ms-1 cursor-pointer'
                      style={{ position: 'relative', top: '-1px' }}
                    />
                  </span>
                )}
                <button
                  className='btn btn-primary btn-xs ms-1'
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
                </button>
              </div>
              <div className='w-100' ref={containerRef}>
                {webglStatus.error ? (
                  <div
                    className='w-100 d-flex align-items-center justify-content-center bg-white'
                    style={{ height: embeddingHeight || 500 }}
                    ref={containerRef}
                  >
                    <span className='text-muted text-sm'>{webglStatus.error}</span>
                  </div>
                ) : (
                  <EmbeddingViewMosaic
                    key={`embedding-${dataVersion}`}
                    coordinator={coordinator}
                    table='data'
                    x='x'
                    y='y'
                    identifier='id'
                    text='name'
                    category={colorGrouping}
                    categoryColors={tableau20}
                    additionalFields={{ Description: 'description', Assay: 'assay', 'Cell Line': 'cell_line' }}
                    height={embeddingHeight}
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
                      },
                    }}
                    selection={selectedPoints}
                    onSelection={handlePointSelection}
                    onRangeSelection={(e) => handleRangeSelection(coordinator, e)}
                  />
                )}
              </div>
            </div>

            <div className='card border overflow-hidden' style={{ height: `calc(100vh - ${embeddingHeight + 140}px)` }}>
              <EmbeddingTable
                getSortedSelectedPoints={getSortedSelectedPoints}
                centerOnPoint={centerOnPoint}
              />
            </div>
          </div>
          <div className='col-sm-2'>
            <EmbeddingLegend 
              legendItems={legendItems} 
              filterSelection={filterSelection} 
              handleLegendClick={handleLegendClick}
              colorGrouping={colorGrouping}
              setColorGrouping={setColorGrouping}
            />
          </div>
        </div>
      ) : (
        <div className='row mb-4'>
          <div className='col-12 d-flex align-items-center justify-content-center' style={{ minHeight: '400px' }}>
            <span>Loading...</span>
          </div>
        </div>
      )}
    </>
  );
};

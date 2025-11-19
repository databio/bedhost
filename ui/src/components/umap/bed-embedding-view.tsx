import { EmbeddingViewMosaic } from 'embedding-atlas/react';
import { useEffect, useState, useRef, useMemo } from 'react';
import * as vg from '@uwdata/vgplot'

import { isPointInPolygon, tableau20 } from '../../utils';
import { useBedCart } from '../../contexts/bedcart-context';
import { components } from '../../../bedbase-types';
import { AtlasTooltip } from './atlas-tooltip';
import { useMosaicCoordinator } from '../../contexts/mosaic-coordinator-context';
import { useBedUmap } from '../../queries/useBedUmap';

type SearchResponse = components['schemas']['BedListSearchResult'];

type Props = {
  bedId?: string;
  neighbors?: SearchResponse;
  showNeighbors?: boolean;
  enableUpload?: boolean;
}

export const BEDEmbeddingView = (props: Props) => {
  const { bedId, neighbors, showNeighbors, enableUpload } = props;
  const { coordinator, initializeData, addCustomPoint, deleteCustomPoint } = useMosaicCoordinator();
  const { addBedToCart } = useBedCart();
  const { mutateAsync: getUmapCoordinates } = useBedUmap();

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [containerWidth, setContainerWidth] = useState(900);
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

  const filter = useMemo(() => vg.Selection.intersect(), []);
  const legendFilterSource = useMemo(() => ({}), []);
  const neighborIDs = useMemo(() => neighbors?.results?.map(result => result.id), [neighbors]);

  const centerOnPoint = (point: any, scale: number = 1) => {
    setTooltipPoint(point);
    setViewportState({
      x: point.x,
      y: point.y,
      scale: scale
    });
  };

  const handleFileRemove = async () => {
    try {
      await deleteCustomPoint();
      setUploadedFilename('')

      coordinator.clear();
      const updatedLegend = await fetchLegendItems(coordinator);
      setLegendItems(updatedLegend);

      // Prepare selection without custom point
      const newSelection = selectedPoints.filter((p: any) => p.identifier !== 'custom_point');
      setPendingSelection(newSelection);

      // Force remount to remove point from map
      setDataVersion(v => v + 1);
    } catch (error) {
      console.error('Error deleting file');
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const coordinates = await getUmapCoordinates(file);

      if (coordinates.length >= 2) {
        await addCustomPoint(coordinates[0], coordinates[1]);
        setUploadedFilename(file.name)

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
          { type: 'json' }
        );

        if (customPoint && customPoint.length > 0) {
          // console.log('Custom point queried:', customPoint[0]);

          // Prepare selection to apply after remount
          const newSelection = selectedPoints.filter((p: any) => p.identifier !== 'custom_point');
          newSelection.push(customPoint[0]);
          setPendingSelection(newSelection);          

          // Force remount to show new point
          setDataVersion(v => v + 1);
        }
      }
    } catch (error) {
      console.error('Error getting UMAP coordinates:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      const scoreMap = new Map(neighbors.results.map(n => [n.id, n.score]));
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
        predicate: null
      });
    } else {
      setFilterSelection(item);
      filter.update({
        source: legendFilterSource,
        value: item.category,
        predicate: vg.eq(colorGrouping, item.category)
      });
    }
  };

  const handlePointSelection = (dataPoints: any[] | null) => {
    // console.log('Selection changed via onSelection callback:', dataPoints);
    const points = dataPoints || [];
    const hasInitialPoint = points.some(p => p.identifier === initialPoint?.identifier);
    let finalPoints = hasInitialPoint ? points : (initialPoint ? [initialPoint, ...points] : points);

    if (showNeighbors && neighborIDs && neighborIDs.length > 0) {
      const selectedIds = new Set(finalPoints.map((p: any) => p.identifier));
      const missingNeighborIds = neighborIDs.filter(id => !selectedIds.has(id));

      if (missingNeighborIds.length > 0) {
        coordinator.query(
          `SELECT
            x, y,
            ${colorGrouping} as category,
            name as text,
            id as identifier,
            {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
           FROM data
           WHERE id IN (${missingNeighborIds.map(id => `'${id}'`).join(',')})`,
          { type: 'json' }
        ).then((neighborPoints: any) => {
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
    const filterClause = filterSelection
      ? ` AND ${colorGrouping} = '${filterSelection.category}'`
      : '';

    // Check if rectangle selection (bounding box)
    if (typeof value === 'object' && 'xMin' in value) {
      result = await coordinator.query(
        `SELECT
          x, y,
          ${colorGrouping} as category,
          name as text,
          id as identifier,
          {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
         FROM data
         WHERE x >= ${value.xMin} AND x <= ${value.xMax} AND y >= ${value.yMin} AND y <= ${value.yMax}${filterClause}`,
        { type: 'json' }
      ) as any[];
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
        { type: 'json' }
      );

      // Filter to points inside polygon
      const filteredIds = candidates
        .filter((point: any) => isPointInPolygon(point, value))
        .map((p: any) => `'${p.identifier}'`)
        .join(',');

      if (filteredIds) {
        result = await coordinator.query(
          `SELECT
            x, y,
            ${colorGrouping} as category,
            name as text,
            id as identifier,
            {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
           FROM data
           WHERE id IN (${filteredIds})${filterClause}`,
          { type: 'json' }
        ) as any[];
      } else {
        result = [];
      }
    }

    const resultArray = result || [];
    const hasInitialPoint = resultArray.length > 0 && resultArray.some((p: any) => p.identifier === initialPoint?.identifier);
    let finalPoints = hasInitialPoint ? resultArray : (initialPoint ? [initialPoint, ...resultArray] : resultArray);

    if (showNeighbors && neighborIDs && neighborIDs.length > 0) {
      const selectedIds = new Set(finalPoints.map((p: any) => p.identifier));
      const missingNeighborIds = neighborIDs.filter(id => !selectedIds.has(id));

      if (missingNeighborIds.length > 0) { // fetch missing neighbor points
        const neighborPoints = await coordinator.query(
          `SELECT
            x, y,
            ${colorGrouping} as category,
            name as text,
            id as identifier,
            {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
           FROM data
           WHERE id IN (${missingNeighborIds.map(id => `'${id}'`).join(',')})`,
          { type: 'json' }
        ) as any[];
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

    const result = await coordinator.query(query, { type: 'json' }) as any[];
    return result
  }

  useEffect(() => { // initialize data
    initializeData().then(() => {
      setIsReady(true);
    });
  }, []);

  useEffect(() => { // resize width of view
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, [isReady]);

  useEffect(() => { // set legend items
    if (isReady) {
      fetchLegendItems(coordinator).then(result => {
        setLegendItems(result)
      })
    }
  }, [isReady, colorGrouping])

  useEffect(() => { // apply pending selection after dataVersion change
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
  }, [dataVersion, pendingSelection])

  useEffect(() => { // fetch initial bed id and neighbors
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
          { type: 'json' }
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
             WHERE id IN (${neighborIDs.map(id => `'${id}'`).join(',')})`,
            { type: 'json' }
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
      <div className="row">
        {
          enableUpload ? (
            <div className="col-12">
              <div className='d-flex align-items-start justify-content-between'>
                <h5 className="fw-bold">BED Embedding Atlas</h5>
                <button
                  className='btn btn-secondary btn-sm ms-auto mb-auto text-xs'
                  onClick={handleUploadClick}
                >
                  Upload BED
                </button>
                <input
                  ref={fileInputRef}
                  className="d-none"
                  type="file"
                  accept=".bed,.gz,application/gzip,application/x-gzip"
                  onChange={handleFileUpload}
                />
                {!!uploadedFilename && (
                  <span
                    className='btn btn-outline-secondary btn-sm ms-1 mb-auto text-xs'
                    onClick={handleFileRemove}
                  >
                    {uploadedFilename}
                    <i className='bi bi-trash3-fill text-danger ms-1 cursor-pointer' />
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="col-12">
              <h5 className="fw-bold">BED Embedding Atlas</h5>
            </div>
          )
        }
      </div>
      {isReady ? (
        <div className="row mb-4 g-2">
          <div className='col-sm-9'>
            <div className='border rounded overflow-hidden'>
              <div className='w-100' ref={containerRef}>
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
                  additionalFields={{'Description': 'description', 'Assay': 'assay', 'Cell Line': 'cell_line'}}
                  height={500}
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
                    props: {}
                  }}
                  selection={selectedPoints}
                  onSelection={handlePointSelection}
                  onRangeSelection={(e) => handleRangeSelection(coordinator, e)}
                />
              </div>
            </div>
          </div>
          <div className='col-sm-3'>
            <div className='card mb-2 border overflow-hidden' style={{height: 'calc(300px - 0.1875rem)'}}>
              <div className='card-header text-xs fw-bolder border-bottom d-flex justify-content-between align-items-center'>
                <span>Legend</span>
                <div className='btn-group btn-group-xs' role='group'>
                  <input
                    type='radio'
                    className='btn-check'
                    name='color_legend'
                    id='color_legend_1'
                    value='cell_line_category'
                    autoComplete='off'
                    checked={colorGrouping === 'cell_line_category'}
                    onChange={(e) => setColorGrouping(e.target.value)}
                  />
                  <label
                    className='btn btn-outline-secondary'
                    htmlFor={'color_legend_1'}
                  >
                    Cell Line
                  </label>
                  <input
                    type='radio'
                    className='btn-check'
                    name='color_legend'
                    id='color_legend_2'
                    value='assay_category'
                    autoComplete='off'
                    checked={colorGrouping === 'assay_category'}
                    onChange={(e) => setColorGrouping(e.target.value)}
                  />
                  <label
                    className='btn btn-outline-secondary'
                    htmlFor={'color_legend_2'}
                  >
                    Assay
                  </label>
                </div>
              </div>
              <div className='card-body table-responsive p-0'>
                <table className='table table-hover text-xs'>
                  <tbody>
                    {legendItems?.map((item: any) => (
                      <tr
                        className={`text-nowrap cursor-pointer ${filterSelection?.category === item.category ? 'table-active' : ''}`}
                        onClick={() => handleLegendClick(item)}
                        key={item.category}
                      >
                        <td className='d-flex justify-content-between align-items-center' style={{height: '30px'}}>
                          <span>
                            <i className='bi bi-square-fill me-3' style={{color: tableau20[item.category]}} />
                            {item.name}
                          </span>
                          {(filterSelection?.category === item.category) && (
                            <button className='btn btn-danger btn-xs'>
                              Clear
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className='card border overflow-hidden' style={{height: 'calc(200px - 0.1875rem)'}}>
              <div className='card-header text-xs fw-bolder border-bottom d-flex justify-content-between align-items-center'>
                <span>Selection</span>
                {/* <i className='bi bi-window ms-1' /> */}
                <button 
                  className='btn btn-primary btn-xs ms-auto' 
                  onClick={() => selectedPoints.filter((point: any) => point.identifier !== 'custom_point').map((point: any) => {
                    const bedItem = {
                      id: point.identifier,
                      name: point.text || 'No name',
                      genome: point.genome_alias || 'N/A',
                      tissue: point.annotation?.tissue || 'N/A',
                      cell_line: point.fields?.['Cell Line'] || 'N/A',
                      cell_type: point.annotation?.cell_type || 'N/A',
                      description: point.fields?.Description || '',
                      assay: point.fields?.Assay || 'N/A',
                    };

                    addBedToCart(bedItem);
                    setAddedToCart(true);
                    setTimeout(() => {
                      setAddedToCart(false);
                    }, 500)
                  })}
                >
                  {addedToCart ? 'Adding...' : `Add ${selectedPoints.length} to Cart`}
                </button>
                {/* <button className='btn btn-secondary btn-xs ms-1'>
                </button> */}
              </div>
              <div className='card-body table-responsive p-0'>
                <table className='table table-striped table-hover text-xs'>
                  <thead>
                    <tr className='text-nowrap'>
                      <th scope="col">BED Name</th>
                      <th scope="col">Assay</th>
                      <th scope="col">Cell Line</th>
                      <th scope="col">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedSelectedPoints().map((point: any, index: number) => (
                      <tr className='text-nowrap cursor-pointer' onClick={() => centerOnPoint(point, 0.3)} key={point.identifier + '_' + index}>
                        <td>{point.text}</td>
                        <td>{point.fields.Assay}</td>
                        <td>{point.fields['Cell Line']}</td>
                        <td>{point.fields.Description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row mb-4">
          <div className='col-12'>
            <span>Loading...</span>
          </div>
        </div>
      )}
    </>
  );
}

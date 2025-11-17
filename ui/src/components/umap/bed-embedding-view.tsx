import { EmbeddingViewMosaic } from 'embedding-atlas/react';
import { useEffect, useState, useRef, useMemo } from 'react';
import * as vg from '@uwdata/vgplot'

import { isPointInPolygon, tableau20 } from '../../utils';
import { useBedCart } from '../../contexts/bedcart-context';
import { AtlasTooltip } from './atlas-tooltip';
import { useMosaicCoordinator } from '../../contexts/mosaic-coordinator-context';

type Props = {
  userPoint?: { x: number; y: number } | null;
}

export const BADAtlas = (props: Props) => {
  const { userPoint } = props;
  const { coordinator, initializeData } = useMosaicCoordinator();
  const { addBedToCart } = useBedCart();

  const containerRef = useRef<HTMLDivElement>(null);

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

  const filter = useMemo(() => vg.Selection.intersect(), []);
  const legendFilterSource = useMemo(() => ({}), []);

  const centerOnPoint = (point: any, scale: number = 1) => {
    setTooltipPoint(point);
    setViewportState({
      x: point.x,
      y: point.y,
      scale: scale
    });
  };

  const getSortedSelectedPoints = () => {
    if (!selectedPoints || selectedPoints.length === 0) return [];
    return selectedPoints;
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

    setSelectedPoints(finalPoints);
  };

  // Range selection (for rectangle/lasso)
  const handleRangeSelection = async (coordinator: any, value: any) => {
    // console.log('Range selection updated:', value);

    if (!value) {
      return;
    }

    let result;

    // Build filter clause if a legend filter is active
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

    setSelectedPoints(finalPoints);
  };

  const fetchLegendItems = async (coordinator: any) => {
    const result = await coordinator.query(
      `SELECT DISTINCT
        ${colorGrouping.replace('_category', '')} as name,
        ${colorGrouping} as category
        FROM data
        ORDER BY ${colorGrouping}`,
      { type: 'json' }
    ) as any[];

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

  useEffect(() => { // handle user point if provided
    if (isReady && userPoint) {
      setTimeout(() => {
        const point = {
          x: userPoint.x,
          y: userPoint.y,
          category: 'User Point',
          text: 'User Point',
          identifier: 'user-point',
          fields: {
            'Description': 'User-provided coordinates',
            'Assay': 'N/A',
            'Cell Line': 'N/A'
          }
        };
        setInitialPoint(point);
        setTooltipPoint(point);
        setSelectedPoints([point]);
        setViewportState({
          x: userPoint.x,
          y: userPoint.y,
          scale: 0.5
        });
      }, 200);
    }
  }, [isReady, userPoint, coordinator, colorGrouping]);

  return (
    <>
      <div className="row">
        <div className="col-12">
          <h5 className="fw-bold">BED Embedding Atlas</h5>
        </div>
      </div>
      {isReady ? (
        <div className="row mb-4 g-2">
          <div className='col-sm-9'>
            <div className='border rounded shadow-sm overflow-hidden'>
              <div className='w-100' ref={containerRef}>
                <EmbeddingViewMosaic
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
            <div className='card shadow-sm mb-2 border overflow-hidden' style={{height: 'calc(300px - 0.1875rem)'}}>
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

            <div className='card shadow-sm border overflow-hidden' style={{height: 'calc(200px - 0.1875rem)'}}>
              <div className='card-header text-xs fw-bolder border-bottom d-flex justify-content-between align-items-center'>
                <span>Selection</span>
                {/* <i className='bi bi-window ms-1' /> */}
                <button 
                  className='btn btn-primary btn-xs ms-auto' 
                  onClick={() => selectedPoints.map((point: any) => {
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
                      <tr className='text-nowrap cursor-pointer' onClick={() => centerOnPoint(point, 0.3)} key={index}>
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
import { EmbeddingAtlas } from 'embedding-atlas/react';
import { useEffect, useState, useRef, useMemo } from 'react';
import * as vg from '@uwdata/vgplot'
import { tableau20 } from '../../utils';

type Props = {
  bedId: string;
  neighbors?: any;
}

export const BEDAtlas = (props: Props) => {
  const {  } = props;

  const dotPlotRef = useRef<HTMLDivElement>(null);
  const colorLegendRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(900);
  const [isReady, setIsReady] = useState(false);
  const [colorGrouping, setColorGrouping] = useState('cell_line');

  const coordinator = useMemo(() => new vg.Coordinator(vg.wasmConnector()), []);
  const $legendSelection = vg.Selection.intersect();

  const initializeData = async (coordinator: any) => {
    const url = 'https://raw.githubusercontent.com/databio/bedbase-loader/master/umap/hg38_umap.json';
    await coordinator.exec([
      vg.sql`CREATE OR REPLACE TABLE data AS 
            SELECT 
              unnest(nodes, recursive := true)
            FROM read_json_auto('${url}')`,
      // vg.sql`CREATE OR REPLACE TABLE data AS
      //       SELECT 
      //         *,
      //         (DENSE_RANK() OVER (ORDER BY assay) - 1)::INTEGER AS assay_category,
      //         (DENSE_RANK() OVER (ORDER BY cell_line) - 1)::INTEGER AS cell_line_category
      //       FROM data`
    ]);
  }

  const plotData = () => {
    let bedQuery = vg.Query.from('data')
      .select(
        'x',
        'y',
        'id',
        'name',
        'description',
        'assay',
        'cell_line',
      );

    const dotPlot = vg.plot(
        vg.dot(vg.from(bedQuery, {}), {
          x: 'x',
          y: 'y',
          z: colorGrouping,
          fill: colorGrouping,
          colorRange: tableau20,
          opacity: 0.5,
          r: 1.5,
          channels: { 'Name:': 'name', 'Cell Line:': 'cell_line', 'Assay:': 'assay' },
          tip: {
            format: {
              'Name:': true,
              'Cell Line:': true,
              'Assay:': true,
              x: false,
              y: false,
              z: false,
              fill: false
            },
          },
        }),
        vg.highlight({ by: $legendSelection, fill: '#ccc', fillOpacity: 0.2 }),
        vg.region({ as: $legendSelection, channels: ['z'] }),
        vg.name('dotPlot'),
        vg.width(containerWidth),
        vg.height(500),
        vg.xLabel(null),
        vg.yLabel(null),
        // vg.gridY(),
        // vg.gridX(),
      );

    const colorLegend = vg.colorLegend({
      for: 'dotPlot',
      as: $legendSelection,
      columns: 1,
    });

    if (dotPlotRef.current) dotPlotRef.current.replaceChildren(dotPlot);
    if (colorLegendRef.current) colorLegendRef.current.replaceChildren(colorLegend);
  }

  useEffect(() => {
    vg.coordinator(coordinator);

    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    plotData()
  }, [isReady, colorGrouping]);

  useEffect(() => {
    initializeData(coordinator).then(() => setIsReady(true));
  }, []);

  return (
    <>
      {isReady && (
        <>
        <div className="row mb-4 g-2">
          <h5 className="fw-bold mb-0">Embedding Atlas</h5>
          <div className='col-sm-9'>
            <div className='border rounded shadow-sm p-1'>
              <div className='w-100' ref={containerRef}>
                {/* <EmbeddingViewMosaic
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
                  selection={[bedId] as any}
                /> */}
                <div ref={dotPlotRef} />
              </div>
            </div>
          </div>
          <div className='col-sm-3'>
            <div className='card shadow-sm mb-2 border' style={{height: 'calc(350px + 0.125rem)'}}>
              <div className='card-header text-xs fw-bolder border-bottom d-flex justify-content-between align-items-center'>
                <span>Legend</span>
                <div className='btn-group btn-group-xs' role='group'>
                  <input
                    type='radio'
                    className='btn-check'
                    name='color_legend'
                    id='color_legend_1'
                    value='cell_line'
                    autoComplete='off'
                    checked={colorGrouping === 'cell_line'}
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
                    value='assay'
                    autoComplete='off'
                    checked={colorGrouping === 'assay'}
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
              <div className='card-body'>
                <div ref={colorLegendRef} />
              </div>
            </div>

            <div className='card shadow-sm border' style={{height: 'calc(150px)'}}>
              <div className='card-body overflow-y-auto'>
                {/* {selectedPoint ? (
                  <div className='text-sm'>
                    <p className='mb-1 text-xs'><strong>Name:</strong> {selectedPoint.name}</p>
                    <p className='mb-1 text-xs'><strong>Cell Line:</strong> {selectedPoint.cell_line}</p>
                    <p className='mb-1 text-xs'><strong>Assay:</strong> {selectedPoint.assay}</p>
                    <p className='mb-0 text-xs'><strong>Description:</strong> {selectedPoint.description}</p>
                  </div>
                ) : (
                  <p className='text-muted text-sm'>Click a point to view details.</p>
                )} */}
              </div>
            </div>
          </div>
        </div>
        <div className='row mb-4'>
          <div className='col-12'>
            <div className='border rounded shadow-sm p-1'>
              <div className='w-100'>
                <div style={{height: '555px'}}>
                  <EmbeddingAtlas
                    coordinator={coordinator}
                    data={{
                      table: 'data',
                      id: 'id',
                      projection: { x: 'x', y: 'y' },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </>
  );
}
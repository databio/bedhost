import { DataPointID, EmbeddingViewMosaic } from 'embedding-atlas/react';
import { useEffect, useState, useRef, useMemo } from 'react';
import * as vg from '@uwdata/vgplot'
import { tableau20 } from '../../utils';

type Props = {
  bedId: string;
  neighbors?: any;
}

export const BADAtlas = (props: Props) => {
  const { bedId } = props;

  const containerRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(900);
  const [isReady, setIsReady] = useState(false);
  const [colorGrouping, setColorGrouping] = useState('cell_line_category');

  const coordinator = useMemo(() => new vg.Coordinator(vg.wasmConnector()), []);

  const initializeData = async (coordinator: any) => {
    const url = 'https://raw.githubusercontent.com/databio/bedbase-loader/master/umap/hg38_umap.json';
    await coordinator.exec([
      vg.sql`CREATE OR REPLACE TABLE data AS 
            SELECT 
              unnest(nodes, recursive := true)
            FROM read_json_auto('${url}')`,
      vg.sql`CREATE OR REPLACE TABLE data AS
            SELECT 
              *,
              (DENSE_RANK() OVER (ORDER BY assay) - 1)::INTEGER AS assay_category,
              (DENSE_RANK() OVER (ORDER BY cell_line) - 1)::INTEGER AS cell_line_category
            FROM data`
    ]);
  }

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, [isReady]);

  useEffect(() => {
    initializeData(coordinator).then(() => setIsReady(true));
  }, []);

  return (
    <>
      {isReady && (
        <div className="row mb-4 g-2">
          <h5 className="fw-bold mb-0">Bad Embedding Atlas</h5>
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
                  selection={[bedId] as DataPointID[]}
                />
              </div>
            </div>
          </div>
          <div className='col-sm-3'>
            <div className='card shadow-sm mb-2 border' style={{height: 'calc(350px - 0.375rem)'}}>
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
              <div className='card-body'>
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
      )}
    </>
  );
}
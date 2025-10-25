import { EmbeddingAtlas } from 'embedding-atlas/react';
import { useEffect, useState, useMemo } from 'react';
import * as vg from '@uwdata/vgplot'

type Props = {
  bedId?: string;
  neighbors?: any;
}

export const BEDAtlas = (props: Props) => {
  const {} = props;

  const [isReady, setIsReady] = useState(false);

  const coordinator = useMemo(() => new vg.Coordinator(vg.wasmConnector()), []);
  const initializeData = async (coordinator: any) => {
    const url = 'https://raw.githubusercontent.com/databio/bedbase-loader/master/umap/hg38_umap.json';
    await coordinator.exec([
      vg.sql`CREATE OR REPLACE TABLE data AS 
            SELECT 
              unnest(nodes, recursive := true)
            FROM read_json_auto('${url}')`
    ]);
  }

  useEffect(() => {
    initializeData(coordinator).then(() => setIsReady(true));
  }, []);

  return (
    <>
      {isReady && (
        <div className='row mb-4'>
          <div className='col-12'>
            <h5 className='fw-bold'>
              Embedding Atlas
            </h5>
            <div className='border rounded shadow-sm overflow-hidden'>
              <div className='w-100' style={{height: '555px'}}>
                <EmbeddingAtlas
                  coordinator={coordinator}
                  data={{
                    table: 'data',
                    id: 'id',
                    projection: { x: 'x', y: 'y' },
                  }}
                  embeddingViewConfig={{
                    autoLabelEnabled: false
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
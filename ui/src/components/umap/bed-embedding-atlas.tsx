import { EmbeddingAtlas } from 'embedding-atlas/react';
import { useEffect, useState } from 'react';
import { useMosaicCoordinator } from '../../contexts/mosaic-coordinator-context';

type Props = {
  bedId?: string;
  neighbors?: any;
  container?: boolean;
  width?: string;
  height?: string;
}

export const BEDEmbeddingAtlas = (props: Props) => {
  const {container, width, height} = props;

  const [isReady, setIsReady] = useState(false);
  const { coordinator, initializeData } = useMosaicCoordinator();

  useEffect(() => {
    initializeData().then(() => setIsReady(true));
  }, []);

  return (
    container ? (
      <>
        {isReady ? (
          <div className='row mb-4'>
            <div className='col-12'>
              <div className='border rounded overflow-hidden'>
                <div style={{width: width, height: height}}>
                  <EmbeddingAtlas
                    coordinator={coordinator}
                    data={{
                      table: 'data',
                      id: 'id',
                      projection: { x: 'x', y: 'y' },
                      text: 'description'
                    }}
                    embeddingViewConfig={{
                      autoLabelEnabled: false
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='row mb-4'>
            <div className='col-12'>
              <span>Loading...</span>
            </div>
          </div>
        )}
      </>
    ) : (
      <>
        {isReady ? (
          <div className='row h-100'>
            <div className='col-12 p-0 h-100'>
              <EmbeddingAtlas
                coordinator={coordinator}
                data={{
                  table: 'data',
                  id: 'id',
                  projection: { x: 'x', y: 'y' },
                  text: 'description'
                }}
                embeddingViewConfig={{
                  autoLabelEnabled: false
                }}
                onStateChange={(e) => console.log(e)}
                onExportSelection={async (predicate, format) => {
                  console.log('Export selection:', predicate, format);
                }}
              />
            </div>
          </div>
      ) : (
        <div className='row h-100'>
          <div className='col-12 h-100 d-flex align-items-center'>
            <span className='mx-auto'>Loading...</span>
          </div>
        </div>
      )}
      </>
    )
  );
}

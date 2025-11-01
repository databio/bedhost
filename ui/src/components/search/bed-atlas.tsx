import { EmbeddingAtlas } from 'embedding-atlas/react';
import { useEffect, useState } from 'react';
import { useMosaicCoordinator } from '../../contexts/mosaic-coordinator-context';

type Props = {
  bedId?: string;
  neighbors?: any;
}

export const BEDAtlas = (props: Props) => {
  const {} = props;

  const [isReady, setIsReady] = useState(false);
  const { coordinator, initializeData } = useMosaicCoordinator();

  useEffect(() => {
    initializeData().then(() => setIsReady(true));
  }, []);

  return (
    <>
      {isReady ? (
        <div className='row mb-4'>
          <div className='col-12'>
            <div className='border rounded shadow-sm overflow-hidden'>
              <div className='w-100' style={{height: '690px'}}>
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
        <div className="row mb-4">
          <div className='col-12'>
            <span>Loading...</span>
          </div>
        </div>
      )}
    </>
  );
}
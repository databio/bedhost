import { EmbeddingAtlas } from 'embedding-atlas/react';
import { useEffect, useState } from 'react';
import { useMosaicCoordinator } from '../contexts/mosaic-coordinator-context';
import { Layout } from '../components/layout';


export const BEDAtlasFull: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const { coordinator, initializeData } = useMosaicCoordinator();

  useEffect(() => {
    initializeData().then(() => setIsReady(true));
  }, []);

  return (
    <Layout title="BEDbase" flexLayout>
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

    </Layout>
  );
};
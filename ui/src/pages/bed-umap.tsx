import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout';
import { EmbeddingContainer } from '../components/umap/embedding-container';
import type { EmbeddingContainerRef } from '../components/umap/embedding-container.tsx';
import { useEffect, useState, useRef } from 'react';

export const BEDUmap: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bedId = searchParams.get('searchId');

  const [embeddingHeight, setEmbeddingHeight] = useState(400);
  const embeddingContainerRef = useRef<EmbeddingContainerRef>(null)

  useEffect(() => {
    embeddingContainerRef.current?.handleShow();
    // resize width and height of view based on window size
    const updateDimensions = () => {
      // Calculate height: window height minus approximate offset for header/footer/margins
      const calculatedHeight = Math.max(400, window.innerHeight - 95);
      setEmbeddingHeight(calculatedHeight);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <Layout title='BEDbase' flexLayout>
      <div className='row mt-2 pt-1'>
        <div className='col-12'>
          <EmbeddingContainer 
            ref={embeddingContainerRef}
            bedIds={bedId ? [bedId] : undefined} 
            height={embeddingHeight} 
            preselectPoint={true} 
            centerInitial={false} 
            tooltipInitial={true} 
            simpleTooltip={false} 
            blockCompact={false} 
            showBorder={true} 
            initialState='compact'
          />
        </div>
      </div>
      
    </Layout>
  );
};

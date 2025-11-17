// import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout';
import { BEDEmbeddingAtlas } from '../components/umap/bed-embedding-atlas';

export const BEDUmap: React.FC = () => {
  // const [searchParams] = useSearchParams();

  // const bedId = searchParams.get('searchId');
  // console.log(bedId);

  return (
    <Layout title="BEDbase" flexLayout>
      <BEDEmbeddingAtlas container={false} />
    </Layout>
  );
};

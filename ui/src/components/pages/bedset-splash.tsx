import { useParams } from 'react-router-dom';
import { Layout } from '../layout';
import { Col, Row } from 'react-bootstrap';
import { useBedsetMetadata } from '../../queries/useBedsetMetadata';

export const BedsetSplash = () => {
  const params = useParams();
  const bedsetId = params.id;

  const { isLoading, data, error } = useBedsetMetadata({
    md5: bedsetId,
    autoRun: true,
  });

  if (isLoading) {
    return <Layout title={`Bedbase | ${bedsetId}`}>Loading...</Layout>;
  } else if (error) {
    return <Layout title={`Bedbase | ${bedsetId}`}>Error: {error.message}</Layout>;
  } else {
    return (
      <Layout title={`Bedbase | ${bedsetId}`}>
        <div className="my-2">
          <Row>
            <Col sm={5} md={5}>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </Col>
            <Col sm={7} md={7}>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </Col>
          </Row>
        </div>
      </Layout>
    );
  }
};

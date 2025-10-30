import Nav from 'react-bootstrap/Nav';
import { useSearchParams } from 'react-router-dom';

type SearchView = 't2b' | 'b2b' | 't2bs' | 'embedding';

type Props = {
  view: SearchView;
  setView: (view: SearchView) => void;
};

export const SearchSelector = (props: Props) => {
  const { view, setView } = props;
  const [params, setParams] = useSearchParams();
  return (
    <div className="d-flex flex-row align-items-center justify-content-center w-100 my-2">
      <div className="p-1 border rounded">
        <Nav variant="pills" defaultActiveKey="t2b" activeKey={view}>
          <Nav.Item
            onClick={() => {
              params.set('view', 't2b');
              params.delete('q');
              setParams(params);
              setView('t2b');
            }}
          >
            <Nav.Link eventKey="t2b">Text-to-BED</Nav.Link>
          </Nav.Item>
          <Nav.Item
            onClick={() => {
              params.set('view', 'b2b');
              params.delete('q');
              setParams(params);
              setView('b2b');
            }}
          >
            <Nav.Link eventKey="b2b">BED-to-BED</Nav.Link>
          </Nav.Item>
          <Nav.Item
            onClick={() => {
              params.set('view', 't2bs');
              params.delete('q');
              setParams(params);
              setView('t2bs');
            }}
          >
            <Nav.Link eventKey="t2bs">Text-to-BEDset</Nav.Link>
          </Nav.Item>
          <Nav.Item
            onClick={() => {
              params.set('view', 'embedding');
              params.delete('q');
              setParams(params);
              setView('embedding');
            }}
          >
            <Nav.Link eventKey="embedding">Embedding Atlas</Nav.Link>
          </Nav.Item>
        </Nav>
      </div>
    </div>
  );
};

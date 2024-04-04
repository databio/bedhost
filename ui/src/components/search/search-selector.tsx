import Nav from 'react-bootstrap/Nav';

type SearchView = 't2b' | 'b2b' | 't2bs';

type Props = {
  view: SearchView;
  setView: (view: SearchView) => void;
};

export const SearchSelector = (props: Props) => {
  const { view, setView } = props;
  return (
    <div className="d-flex flex-row align-items-center justify-content-center w-100 my-2">
      <div className="p-1 border rounded">
        <Nav variant="pills" defaultActiveKey="t2b" activeKey={view}>
          <Nav.Item onClick={() => setView('t2b')}>
            <Nav.Link eventKey="t2b">Text-to-BED</Nav.Link>
          </Nav.Item>
          <Nav.Item onClick={() => setView('b2b')}>
            <Nav.Link eventKey="b2b">BED-to-BED</Nav.Link>
          </Nav.Item>
          <Nav.Item onClick={() => setView('t2bs')}>
            <Nav.Link eventKey="t2bs">Text-to-BEDset</Nav.Link>
          </Nav.Item>
        </Nav>
      </div>
    </div>
  );
};

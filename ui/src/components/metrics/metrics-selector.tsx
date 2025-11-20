type MetricsView = 'file' | 'geo' | 'usage';

type Props = {
  view: MetricsView;
  setView: (view: MetricsView) => void;
};

export const MetricsSelector = (props: Props) => {
  const { view, setView } = props;

  return (
    <div className='d-flex flex-row align-items-center justify-content-center my-2 text-sm'>
      <div className='p-1 border rounded-5 bg-white'>
        <ul className='nav nav-pills'>
          <li className='nav-item'>
            <button
              className={`rounded-5 nav-link ${view === 'file' ? 'active fw-medium' : ''}`}
              onClick={() => setView('file')}
            >
              File Statistics
            </button>
          </li>
          <li className='nav-item'>
            <button
              className={`rounded-5 nav-link ${view === 'usage' ? 'active fw-medium' : ''}`}
              onClick={() => setView('usage')}
            >
              Usage Statistics
            </button>
          </li>
          <li className='nav-item'>
            <button
              className={`mx-1 rounded-5 nav-link ${view === 'geo' ? 'active fw-medium' : ''}`}
              onClick={() => setView('geo')}
            >
              GEO Statistics
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

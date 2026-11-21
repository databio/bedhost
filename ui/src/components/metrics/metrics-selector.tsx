type MetricsView = 'file' | 'geo' | 'usage';

type Props = {
  view: MetricsView;
  setView: (view: MetricsView) => void;
};

// Short labels keep all three pills on one row on small screens; the full labels
// show from the `sm` breakpoint up.
const TABS: { key: MetricsView; short: string; full: string }[] = [
  { key: 'file', short: 'File', full: 'File Statistics' },
  { key: 'usage', short: 'Usage', full: 'Usage Statistics' },
  { key: 'geo', short: 'GEO', full: 'GEO Statistics' },
];

export const MetricsSelector = (props: Props) => {
  const { view, setView } = props;

  return (
    <div className='d-flex justify-content-center my-2 text-sm mw-100'>
      <div className='p-1 border rounded-5 bg-white overflow-x-auto mw-100'>
        <ul className='nav nav-pills flex-nowrap gap-1'>
          {TABS.map((tab) => (
            <li className='nav-item' key={tab.key}>
              <button
                className={`rounded-5 nav-link text-nowrap ${view === tab.key ? 'active fw-medium' : ''}`}
                onClick={() => setView(tab.key)}
              >
                <span className='d-inline d-sm-none'>{tab.short}</span>
                <span className='d-none d-sm-inline'>{tab.full}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

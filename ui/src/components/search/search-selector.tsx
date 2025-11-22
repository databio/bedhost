import { useSearchParams } from 'react-router-dom';

type SearchView = 't2b' | 'b2b' | 't2bs';

type Props = {
  view: SearchView;
  setView: (view: SearchView) => void;
};

export const SearchSelector = (props: Props) => {
  const { view, setView } = props;
  const [params, setParams] = useSearchParams();
  return (
    <div className='d-flex flex-row align-items-center justify-content-center my-2 text-sm'>
      <div className='p-1 border rounded-5 bg-white'>
        <ul className='nav nav-pills'>
          <li className='nav-item'>
            <button
              className={`rounded-5 nav-link ${view === 't2b' ? 'active fw-medium' : ''}`}
              onClick={() => {
                params.set('view', 't2b');
                params.delete('q');
                setParams(params);
                setView('t2b');
              }}
            >
              Text-to-BED
            </button>
          </li>
          <li className='nav-item'>
            <button
              className={`mx-1 rounded-5 nav-link ${view === 'b2b' ? 'active fw-medium' : ''}`}
              onClick={() => {
                params.set('view', 'b2b');
                params.delete('q');
                setParams(params);
                setView('b2b');
              }}
            >
              BED-to-BED
            </button>
          </li>
          <li className='nav-item'>
            <button
              className={`rounded-5 nav-link ${view === 't2bs' ? 'active fw-medium' : ''}`}
              onClick={() => {
                params.set('view', 't2bs');
                params.delete('q');
                setParams(params);
                setView('t2bs');
              }}
            >
              Text-to-BEDset
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

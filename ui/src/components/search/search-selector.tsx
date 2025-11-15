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
    <div className='d-flex flex-row align-items-center justify-content-center w-100 my-2'>
      <div className='p-1 border rounded-3 bg-white'>
        <ul className='nav nav-pills'>
          <li className='nav-item'>
            <button
              className={`nav-link ${view === 't2b' ? 'active' : ''}`}
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
              className={`nav-link ${view === 'b2b' ? 'active' : ''}`}
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
              className={`nav-link ${view === 't2bs' ? 'active' : ''}`}
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

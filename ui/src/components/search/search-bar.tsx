import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

type Props = {
  value: string;
  limit: number;
  setLimit: (limit: number) => void;
  onChange: (value: string) => void;
  onSearch: () => void;
};

export const SearchBar = (props: Props) => {
  const { value, onChange, onSearch, limit, setLimit } = props;
  const [, setSearchParams] = useSearchParams();
  return (
    <div className="d-flex flex-row align-items-center">
      <input
        value={value}
        onChange={(e) => {
          if (e.target.value === '') {
            setSearchParams({});
          } else {
            setSearchParams({ q: e.target.value });
          }
          onChange(e.target.value);
        }}
        className="form-control"
        type="text"
        placeholder="Search..."
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (value === '') {
              toast.error('Please enter a search term', {
                position: 'top-center',
              });
              return;
            }
            onSearch();
          }
        }}
      />
      <select className="form-select ms-2 w-auto" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
        <option value={10}>Limit 10</option>
        <option value={20}>Limit 20</option>
        <option value={50}>Limit 50</option>
        <option value={100}>Limit 100</option>
      </select>
      <button
        className="btn btn-primary ms-2"
        onClick={() => {
          if (value === '') {
            toast.error('Please enter a search term', {
              position: 'top-center',
            });
            return;
          }
          onSearch();
        }}
      >
        Search
      </button>
    </div>
  );
};

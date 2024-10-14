import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

type Props = {
  value: string;
  limit: number;
  setLimit: (limit: number) => void;
  onChange: (value: string) => void;
  onSearch: () => void;
};

const placeholders = [
  'Which antibody or protein are you searching for?',
  'Which cell type or tissue are you interested in?',
  'K562',
  'H3K27ac',
  'Cancer',
  'ChIP-seq',

];

export const SearchBar = (props: Props) => {
  const { value, onChange, onSearch, limit, setLimit } = props;
  const [, setSearchParams] = useSearchParams();
  const placeholder = useMemo(() => placeholders[Math.floor(Math.random() * placeholders.length)], []);
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
        placeholder={placeholder}
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
      <select className="form-select ms-1 w-auto" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
        <option value={10}>Limit 10</option>
        <option value={20}>Limit 20</option>
        <option value={50}>Limit 50</option>
        <option value={100}>Limit 100</option>
      </select>
      <button
        className="btn btn-primary ms-1"
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

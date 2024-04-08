import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
};

export const SearchBar = (props: Props) => {
  const { value, onChange, onSearch } = props;
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
        className="form-control shadow-sm"
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

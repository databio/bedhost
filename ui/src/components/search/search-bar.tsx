import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useSearchView } from '../../contexts/search-view-context.tsx';
import { useAvailableGenomes } from '../../queries/useAvailableGenomes.ts';
import { useAvailableAssays } from '../../queries/useAvailableAssays.ts';

type Props = {
  value: string;
  limit: number;
  setLimit: (limit: number) => void;
  genome: string | undefined;
  assay: string | undefined;
  setGenome: (genome: string) => void;
  setAssay: (assay: string | undefined) => void;
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
  const { value, onChange, onSearch, limit, setLimit, genome, setGenome, assay, setAssay } = props;
  const [, setSearchParams] = useSearchParams();
  const { searchView } = useSearchView();
  const { data: genomes } = useAvailableGenomes();
  const { data: assays } = useAvailableAssays();

  const [showOptions, setShowOptions] = useState(false);
  // const assays = ['ATAC-seq', 'ChIP-Seq'];

  const placeholder = useMemo(() => placeholders[Math.floor(Math.random() * placeholders.length)], []);
  return (
    <>
      <div className="d-flex flex-row align-items-center gap-1">
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

        <select className="form-select w-auto" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          <option value={10}>Limit 10</option>
          <option value={20}>Limit 20</option>
          <option value={50}>Limit 50</option>
          <option value={100}>Limit 100</option>
        </select>
        {searchView === 't2b' && (
          <button
            className="btn btn-warning"
            onClick={() => setShowOptions(!showOptions)}
          >
            Options
          </button>
        )}
        <button
          className="btn btn-primary"
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
      {showOptions && (
        <div className="mt-2">
          {searchView === 't2b' &&
            <div className="d-flex align-items-center">
              <h6 className="mb-0 fw-bold">Search Options</h6>

              <h6 className="mb-0 fw-semibold ms-auto">Genome:</h6>
              <select className="form-select w-auto ms-1 border-0" value={genome}
                      onChange={(e) => setGenome(String(e.target.value))}>
                <option value={''}>None</option>
                {genomes?.results.map((genomeItem, index) => (
                  <option key={index} value={String(genomeItem)}>
                    {String(genomeItem)}
                  </option>
                ))}
              </select>

              <h6 className="mb-0 fw-semibold ms-4">Assay:</h6>
              <select className="form-select w-auto ms-1 border-0" value={assay}
                      onChange={(e) => setAssay(String(e.target.value))}>
                <option value={''}>None</option>
                {assays?.results.map((assayItem, index) => (
                  <option key={index} value={String(assayItem)}>
                    {String(assayItem)}
                  </option>
                ))}
              </select>
            </div>
          }
        </div>
      )}

    </>

  );
};

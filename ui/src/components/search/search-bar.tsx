import toast from 'react-hot-toast';
// import { useSearchParams } from 'react-router-dom';
import { useMemo, useState, useRef, RefObject } from 'react';
import { useSearchView } from '../../contexts/search-view-context.tsx';
import { useAvailableGenomes } from '../../queries/useAvailableGenomes.ts';
import { useAvailableAssays } from '../../queries/useAvailableAssays.ts';
import { BEDEmbeddingPlotRef } from '../umap/bed-embedding-plot.tsx';

type Props = {
  value: string;
  limit: number;
  setLimit: (limit: number) => void;
  genome: string;
  assay: string;
  layout?: string;
  setGenome: (assay: string) => void;
  setAssay: (assay: string) => void;
  onChange: (value: string) => void;
  onSearch: () => void;
  setLayout?: (layout: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  embeddingPlotRef: RefObject<BEDEmbeddingPlotRef>;
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
  const {
    value,
    onChange,
    onSearch,
    limit,
    setLimit,
    genome,
    setGenome,
    assay,
    setAssay,
    layout,
    setLayout,
    file,
    setFile,
    embeddingPlotRef,
  } = props;
  // const [, setSearchParams] = useSearchParams();
  const { searchView } = useSearchView();
  const { data: genomes } = useAvailableGenomes();
  const { data: assays } = useAvailableAssays();

  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const placeholder = useMemo(() => placeholders[Math.floor(Math.random() * placeholders.length)], []);
  return (
    <>
      <div className='d-flex flex-row align-items-center gap-2'>
        <div className='input-group bg-white'>
          {searchView === 'b2b' ? (
            <>
              {file ? (
                <>
                  <input
                    className='form-control border cursor-pointer'
                    type='text'
                    value={file.name}
                    onClick={() => fileInputRef.current?.click()}
                    readOnly
                  />
                  <input
                    ref={fileInputRef}
                    className='d-none'
                    type='file'
                    accept='.bed,.gz,application/gzip,application/x-gzip'
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        setFile(selectedFile);
                      }
                    }}
                  />
                  <button
                    className='btn btn-outline-secondary border'
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      if (typeof embeddingPlotRef.current?.handleFileRemove === 'function') {
                        embeddingPlotRef.current.handleFileRemove();
                      }
                    }}
                    title='Remove file'
                  >
                    <i className='bi bi-x-circle' />
                  </button>
                  {layout === 'split' && (
                    <button
                      className='btn btn-outline-secondary border'
                      onClick={() => {
                        if (typeof embeddingPlotRef.current?.centerOnBedId === 'function') {
                          embeddingPlotRef.current.centerOnBedId('custom_point');
                        }
                      }}
                      title='Locate in embeddings'
                    >
                      <i className='bi bi-pin-map' />
                    </button>
                  )}
                </>
              ) : (
                <input
                  ref={fileInputRef}
                  className='form-control border'
                  type='file'
                  accept='.bed,.gz,application/gzip,application/x-gzip'
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      setFile(selectedFile);
                    }
                  }}
                />
              )}
            </>
          ) : (
            <input
              className='form-control border'
              type='text'
              value={value}
              onChange={(e) => {
                // if (e.target.value === '') {
                //   setSearchParams({});
                // } else {
                //   setSearchParams({ q: e.target.value });
                // }
                onChange(e.target.value);
              }}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (value === '') {
                    toast.error('Please enter a search term.');
                    return;
                  }
                  onSearch();
                }
              }}
            />
          )}

          {['t2b', 'b2b'].includes(searchView) && (
            <button
              className='btn btn-outline-secondary border'
              onClick={() => setShowOptions(!showOptions)}
              title='Show options'
            >
              <i className='bi bi-sliders' />
            </button>
          )}

          <select
            className='form-select w-auto'
            style={{ maxWidth: '130px' }}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={10}>Limit 10</option>
            <option value={20}>Limit 20</option>
            <option value={50}>Limit 50</option>
            <option value={100}>Limit 100</option>
          </select>
        </div>

        {searchView !== 'b2b' && (
          <button
            className='btn btn-primary'
            onClick={() => {
              if (value === '') {
                toast.error('Please enter a search term');
                return;
              }
              onSearch();
            }}
          >
            <i className='bi bi-search' />
          </button>
        )}
      </div>

      {showOptions && (
        <div className='mt-2'>
          {['t2b', 'b2b'].includes(searchView) && !!layout && !!setLayout && (
            <div className='d-flex align-items-center'>
              <h6 className='mb-0 fw-semibold text-sm'>Layout:</h6>
              <select
                className='form-select form-select-sm w-auto ms-1 border rounded-2'
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
              >
                <option value={'split'}>Show Embeddings</option>
                <option value={'table'}>Hide Embeddings</option>
              </select>

              {searchView === 't2b' && (
                <>
                  <h6 className='mb-0 fw-semibold ms-auto text-sm'>Genome:</h6>
                  <select
                    className='form-select form-select-sm w-auto ms-1 border rounded-2'
                    value={genome}
                    onChange={(e) => setGenome(String(e.target.value))}
                  >
                    <option value={''}>All</option>
                    {genomes?.results.map((genomeItem, index) => (
                      <option key={index} value={String(genomeItem)}>
                        {String(genomeItem)}
                      </option>
                    ))}
                  </select>

                  <h6 className='mb-0 fw-semibold ms-4 text-sm'>Assay:</h6>
                  <select
                    className='form-select form-select-sm w-auto ms-1 border rounded-2'
                    value={assay}
                    onChange={(e) => setAssay(String(e.target.value))}
                  >
                    <option value={''}>All</option>
                    {assays?.results.map((assayItem, index) => (
                      <option key={index} value={String(assayItem)}>
                        {String(assayItem)}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

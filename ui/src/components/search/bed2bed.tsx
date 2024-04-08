import { useRef, useCallback, Fragment, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { SearchResultsTable } from './search-results-table';
import { SearchingJumper } from './searching-jumper';
import { useBed2BedSearch } from '../../queries/useBed2BedSearch';
import { PaginationBar } from './pagination-bar';
import { TableToolbar } from './table-toolbar';

export const Bed2Bed = () => {
  const [file, setFile] = useState<File | null>(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { isDragActive, getRootProps, getInputProps } = useDropzone({ onDrop });

  const {
    isFetching: isSearching,
    data: results,
    refetch: onSearch,
  } = useBed2BedSearch({
    q: file,
    limit: limit,
    offset: offset,
    autoRun: false,
  });

  useEffect(() => {
    if (file) {
      setTimeout(() => {
        onSearch();
      }, 50);
    }
  }, [file, offset, limit, onSearch]);

  return (
    <div className="d-flex flex-column align-items-center">
      <div
        {...getRootProps()}
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.click();
          }
        }}
        className={
          isDragActive
            ? 'w-100 rounded border p-3 shadow-sm border-dashed b2b-drop-zone transition-all border-primary'
            : 'w-100 rounded border p-3 shadow-sm border-dashed b2b-drop-zone transition-all'
        }
      >
        {file ? (
          <Fragment>
            <p className="text-center">
              <span className="fw-bold me-1">Selected file:</span>
              {file.name}
            </p>
            <button
              className="btn btn-sm btn-outline-danger d-block mx-auto"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            >
              Remove
            </button>
          </Fragment>
        ) : (
          <Fragment>
            <p className="text-center fst-italic">Select a file or drag and drop one</p>
            <i className="bi bi-arrow-up-circle-fill d-block text-center text-primary fs-1 mt-3 opacity-75"></i>
          </Fragment>
        )}
      </div>
      <input {...getInputProps()} ref={inputRef} className="d-none" type="file" id="file" accept=".bed,.bed.gz" />
      <div className="w-100 my-2">
        {isSearching ? (
          <SearchingJumper />
        ) : (
          <div className="my-2">
            {results ? (
              <div className="p-2 border rounded shadow-sm">
                <TableToolbar limit={limit} setLimit={setLimit} total={results.count} />
                {/* @ts-expect-error: I know this works I can't figure out why the error */}
                <SearchResultsTable results={results || []} />{' '}
                <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={results.count} />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

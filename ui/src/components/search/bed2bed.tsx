import { useState, useRef, useCallback, Fragment } from 'react';
import { useDropzone } from 'react-dropzone';

export const Bed2Bed = () => {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { isDragActive, getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div
        {...getRootProps()}
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.click();
          }
        }}
        className={
          isDragActive
            ? 'rounded border p-5 shadow-sm border-dashed b2b-drop-zone transition-all border-primary'
            : 'rounded border p-5 shadow-sm border-dashed b2b-drop-zone transition-all'
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
    </div>
  );
};

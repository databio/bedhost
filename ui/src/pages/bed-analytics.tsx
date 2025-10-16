import { useState, useRef } from 'react';
import { Layout } from '../components/layout.tsx';
import { RegionSet } from '@databio/gtars';
import { handleBedFileInput, type BedEntry } from '../utils.ts';

export const BEDAnalytics = () => {
  const [regionsetRegions, setregionsetRegions] = useState<BedEntry[] | null>(null);
  const [Rs, setRs] = useState<RegionSet | null>(null);
  const [loadingRS, setLoadingRS] = useState(false);
  const regionsetFileInputRef = useRef<HTMLInputElement | null>(null);
  const [totalProcessingTime, setTotalProcessingTime] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const initializeRegionSet = async () => {
    if (selectedFile) {
      setLoadingRS(true);
      setTotalProcessingTime(null);

      try {
        // Start timing from the beginning of file loading
        const startTime = performance.now();

        // Create a synthetic event for handleBedFileInput
        const syntheticEvent = {
          target: { files: [selectedFile] },
        } as unknown as Event;

        await handleBedFileInput(syntheticEvent, (entries) => {
          setregionsetRegions(entries);

          // Process the RegionSet immediately after loading
          setTimeout(() => {
            const rs = new RegionSet(entries);
            const endTime = performance.now();
            const totalTimeMs = endTime - startTime;

            console.log(rs.digest());
            setRs(rs);
            setTotalProcessingTime(totalTimeMs);
            setLoadingRS(false);
          }, 10);
        });
      } catch (error) {
        setLoadingRS(false);
        console.error('Error loading file:', error);
      }
    }
  };

  return (
    <Layout footer title="BEDbase" fullHeight>
      <h1 className="text-center mt-4">BED analyzer</h1>
      <div className="container-fluid d-flex flex-column p-3">
        <div className="d-flex flex-column gap-1">
          <label className="fw-bold">Provide BED file</label>
          <input
            ref={regionsetFileInputRef}
            className="form-control p-3 border-2 border-dashed rounded shadow-sm"
            style={{
              borderColor: '#d1d5db',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
              }
            }}
          />
          {selectedFile && (
            <p className="text-muted small mx-1">
              Selected file: {selectedFile.name}
            </p>
          )}
          {regionsetRegions && (
            <p className="text-muted small mx-1">
              {regionsetRegions.length} regions loaded from BED file
            </p>
          )}
        </div>

        <div className="d-flex flex-row align-items-center justify-content-end gap-2 mt-1">
          <button
            disabled={selectedFile === null || Rs !== null || loadingRS}
            className="btn btn-primary"
            onClick={initializeRegionSet}
          >
            Analyze RegionSet
          </button>
          <button
            disabled={Rs === null && selectedFile === null}
            className="btn btn-danger"
            style={{ width: '150px' }}
            onClick={() => {
              setRs(null);
              setregionsetRegions(null);
              setTotalProcessingTime(null);
              setSelectedFile(null);
              if (regionsetFileInputRef.current) {
                regionsetFileInputRef.current.value = '';
              }
            }}
          >
            Unload
          </button>
        </div>

        <div className="mt-4">
          {loadingRS && (
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-pill">
              <div
                className="spinner-border spinner-border-sm text-success"
                role="status"
                style={{ width: '12px', height: '12px' }}
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="small text-success fw-medium">
                Loading and analyzing...
              </span>
            </div>
          )}

          {Rs && !loadingRS && (
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-2 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-pill">
              <div
                className="bg-primary rounded-circle"
                style={{ width: '8px', height: '8px' }}
              />
              <span className="small text-primary fw-medium">
                Results ready
              </span>
            </div>
          )}

          <div className="mt-3">
            {Rs && (
              <div>
                <table className="table table-sm mb-0">
                  <tbody>
                  <tr>
                    <th scope="row">Mean region width</th>
                    <td>{Rs.mean_region_width}</td>
                  </tr>
                  <tr>
                    <th scope="row">Total number of regions</th>
                    <td>{Rs.number_of_regions}</td>
                  </tr>
                  <tr>
                    <th scope="row">Total number of nucleotides</th>
                    <td>{Rs.total_nucleotides}</td>
                  </tr>
                  <tr>
                    <th scope="row">Identifier</th>
                    <td>{Rs.digest()}</td>
                  </tr>
                  {totalProcessingTime !== null && (
                    <tr>
                      <th scope="row">Total processing time</th>
                      <td>{(totalProcessingTime / 1000).toFixed(3)} seconds</td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
import { useState, useRef } from 'react';
import { Layout } from '../components/layout.tsx';
import { RegionSet } from '@databio/gtars';
import { handleBedFileInput, type BedEntry } from '../utils.ts';

export const BEDAnalytics = () => {
  const [regionsetRegions, setregionsetRegions] = useState<BedEntry[] | null>(null);
  const [Rs, setRs] = useState<RegionSet | null>(null);
  const [loadingRS, setLoadingRS] = useState(false);
  const regionsetFileInputRef = useRef<HTMLInputElement>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const initializeRegionSet = async (regionsetRegions: BedEntry[] | null) => {
    if (regionsetRegions) {
      console.log('initializing regionset');
      console.log(regionsetRegions);
      setLoadingRS(true);
      setProcessingTime(null);

      // Use setTimeout to allow the UI to update before processing
      setTimeout(() => {
        const startTime = performance.now();
        const rs = new RegionSet(regionsetRegions);
        const endTime = performance.now();
        const processingTimeMs = endTime - startTime;

        console.log(rs.digest());
        setRs(rs);
        setProcessingTime(processingTimeMs);
        setLoadingRS(false);
      }, 10);
    } else {
      setLoadingRS(false);
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
              const input = e.target as HTMLInputElement;
              const file = input.files?.[0];
              if (file) {
                // @ts-expect-error its fine :)
                handleBedFileInput(e, (entries) => {
                  setregionsetRegions(entries);
                });
              }
            }}
          />
          {regionsetRegions && (
            <p className="text-muted small mx-1">
              {regionsetRegions.length} regions in provided BED file
            </p>
          )}
        </div>

        <div className="d-flex flex-row align-items-center justify-content-end gap-2 mt-1">
          <button
            disabled={regionsetRegions === null || Rs !== null}
            className="btn btn-primary"
            onClick={() => {
              setLoadingRS(true);
              initializeRegionSet(regionsetRegions);
            }}
          >
            Analyze RegionSet
          </button>
          <button
            disabled={Rs === null}
            className="btn btn-danger"
            style={{ width: '150px' }}
            onClick={() => {
              setRs(null);
              setregionsetRegions(null);
              setProcessingTime(null);
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
        Analyzing RegionSet...
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
                <p> Mean region width: {Rs.mean_region_width} </p>
                <p> Total number of regions: {Rs.number_of_regions} </p>
                <p> Total number of nucleotides: {Rs.total_nucleotides} </p>
                <p> Identifier: {Rs.digest()} </p>
                {processingTime !== null && (
                  <p> Processing time: {(processingTime / 1000).toFixed(3)} seconds </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
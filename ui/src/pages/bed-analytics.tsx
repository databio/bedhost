import { useState, useRef } from 'react';
import { Layout } from '../components/layout.tsx';
import { RegionSet } from '@databio/gtars';
import { handleBedFileInput, type BedEntry } from '../utils.ts';

export const BEDAnalytics = () => {
  const [regionsetRegions, setregionsetRegions] = useState<BedEntry[] | null>(null);
  const [Rs, setRs] = useState<RegionSet | null>(null);
  const [loadingRS, setLoadingRS] = useState(false);
  const regionsetFileInputRef = useRef<HTMLInputElement>(null);

  const initializeRegionSet = (regionsetRegions) => {
    if (regionsetRegions) {
      console.log('initializing regionset');
      console.log(regionsetRegions);
      setLoadingRS(true);
      const rs = new RegionSet(regionsetRegions);
      setRs(rs);
      setLoadingRS(false);
    } else {
      setLoadingRS(false);
    }
  };

  return (
    <Layout footer title="BEDbase" fullHeight>
      <div className="container-fluid d-flex flex-column align-items-center p-3">
        <div className="d-flex flex-column gap-1">
          <label className="fw-bold">RegionSet test: </label>
          <input
            ref={regionsetFileInputRef}
            className="form-control p-3 border-2 border-dashed rounded shadow-sm"
            style={{
              borderColor: '#d1d5db',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
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
              {regionsetRegions.length} regions in universe
            </p>
          )}
        </div>

        <div className="mt-3">
          {Rs && <p>RegionSet initialized with {Rs.get_phi} regions</p>}
        </div>

        <div className="d-flex flex-row align-items-center gap-2 mt-3">
          <button
            disabled={regionsetRegions === null || Rs !== null}
            className="btn btn-primary"
            style={{ width: '150px' }}
            onClick={() => {
              setLoadingRS(true);
              initializeRegionSet(regionsetRegions);
            }}
          >
            Load RegionSet
          </button>
          <button
            disabled={Rs === null}
            className="btn btn-danger"
            style={{ width: '150px' }}
            onClick={() => {
              setRs(null);
              setregionsetRegions(null);
              if (regionsetFileInputRef.current) {
                regionsetFileInputRef.current.value = '';
              }
            }}
          >
            Unload
          </button>
        </div>

        <div className="mt-4">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-pill">
            <div
              className="bg-success rounded-circle"
              style={{ width: '8px', height: '8px' }}
            ></div>
            <span className="small text-success fw-medium">
              RegionSet ready
            </span>
          </div>
          <div className="mt-3">
            {Rs && (
              <div>
                <p> Mean region width: {Rs.mean_region_width} </p>
                <p> Total number of regions: {Rs.number_of_regions} </p>
                <p> Total number of nucleotides: {Rs.total_nucleotides} </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
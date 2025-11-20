import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout.tsx';
import { RegionSet } from '@databio/gtars';
import { handleBedFileInput } from '../utils.ts';
import { bytesToSize } from '../utils.ts';
import ChromosomeStatsPanel from '../components/bed-analytics-components/chromosome-stats-panel.tsx';
import RegionDistributionPlot from '../components/bed-analytics-components/bed-plots.tsx';

export const BEDAnalytics = () => {
  const [rs, setRs] = useState<RegionSet | null>(null);
  const [loadingRS, setLoadingRS] = useState(false);
  const [totalProcessingTime, setTotalProcessingTime] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [bedUrl, setBedUrl] = useState<string>('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParam = searchParams.get('bedUrl');
    if (urlParam) {
      setInputMode('url');
      setBedUrl(urlParam);
    }
  }, [searchParams]);

  const regionsetFileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchBedFromUrl = async (url: string): Promise<File> => {
    console.log(`${url[0]}, ${url[1]}, ${url}`);
    const fetchUrl =
      url.length === 32 && !url.startsWith('http')
        ? `https://api.bedbase.org/v1/files/files/${url[0]}/${url[1]}/${url}.bed.gz`
        : url;
    console.log(`${fetchUrl}`);
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch BED file: ${response.statusText}`);
    }
    const blob = await response.blob();
    const fileName = fetchUrl.split('/').pop() || 'remote-bed-file.bed';
    return new File([blob], fileName, { type: 'text/plain' });
  };

  const initializeRegionSet = async () => {
    let fileToProcess: File | null = null;

    if (inputMode === 'file' && selectedFile) {
      fileToProcess = selectedFile;
    } else if (inputMode === 'url' && bedUrl.trim()) {
      try {
        fileToProcess = await fetchBedFromUrl(bedUrl.trim());
      } catch (error) {
        console.error('Error fetching URL:', error);
        return;
      }
    }

    if (fileToProcess) {
      setLoadingRS(true);
      setTotalProcessingTime(null);

      try {
        const startTime = performance.now();

        const syntheticEvent = {
          target: { files: [fileToProcess] },
        } as unknown as Event;

        await handleBedFileInput(syntheticEvent, (entries) => {
          setTimeout(() => {
            const rs = new RegionSet(entries);
            const endTime = performance.now();
            const totalTimeMs = endTime - startTime;

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

  const unloadFile = () => {
    setRs(null);
    setTotalProcessingTime(null);
    setSelectedFile(null);
    setBedUrl('');
    if (regionsetFileInputRef.current) {
      regionsetFileInputRef.current.value = '';
    }
  };

  return (
    <Layout footer title='BEDbase' fullHeight>
      <h1 className='text-center mt-4'>BED analyzer</h1>
      <div className='container-fluid d-flex flex-column p-3'>
        <div className='d-flex flex-column gap-3'>
          <div className='d-flex gap-3'>
            <div className='form-check'>
              <input
                className='form-check-input'
                type='radio'
                name='inputMode'
                id='fileMode'
                checked={inputMode === 'file'}
                onChange={() => setInputMode('file')}
              />
              <label className='form-check-label' htmlFor='fileMode'>
                Upload file
              </label>
            </div>
            <div className='form-check'>
              <input
                className='form-check-input'
                type='radio'
                name='inputMode'
                id='urlMode'
                checked={inputMode === 'url'}
                onChange={() => setInputMode('url')}
              />
              <label className='form-check-label' htmlFor='urlMode'>
                From URL
              </label>
            </div>
          </div>

          {inputMode === 'file' ? (
            <div className='d-flex flex-column gap-1'>
              <label className='fw-bold'>Provide BED file</label>
              <input
                ref={regionsetFileInputRef}
                className='form-control p-3 border-2 border-dashed rounded'
                type='file'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    unloadFile();
                    setSelectedFile(file);
                  }
                }}
              />
              {selectedFile && (
                <div className='text-muted small mx-1'>
                  <div>Selected file: {selectedFile.name}</div>
                  <div>File size: {bytesToSize(selectedFile.size)}</div>
                </div>
              )}
            </div>
          ) : (
            <div className='d-flex flex-column gap-1'>
              <label className='fw-bold'>BED file URL</label>
              <input
                type='url'
                className='form-control'
                placeholder='https://example.com/file.bed'
                value={bedUrl || ''}
                onChange={(e) => {
                  const newUrl = e.target.value;
                  setBedUrl(newUrl);
                  if (rs) unloadFile();

                  // Update the URL query parameter
                  const params = new URLSearchParams(searchParams);
                  if (newUrl.trim()) {
                    params.set('bedUrl', newUrl);
                  } else {
                    params.delete('bedUrl');
                  }
                  navigate(`?${params.toString()}`);
                }}
              />
              {bedUrl && <div className='text-muted small mx-1'>URL: {bedUrl}</div>}
            </div>
          )}
          {inputMode === 'file' && !selectedFile && (
            <div className='text-muted small mx-1'>
              No file selected. Use this example{' '}
              <a
                href='#'
                onClick={(e) => {
                  e.preventDefault();
                  const exampleUrl =
                    'https://api.bedbase.org/v1/files/files/d/c/dcc005e8761ad5599545cc538f6a2a4d.bed.gz';
                  setInputMode('url');
                  setBedUrl(exampleUrl);

                  // Update the URL query parameter
                  const params = new URLSearchParams(searchParams);
                  params.set('bedUrl', exampleUrl);
                  navigate(`?${params.toString()}`);
                }}
              >
                example file
              </a>
              .
            </div>
          )}

          {rs && totalProcessingTime !== null && (
            <div className='text-muted small mx-1'>
              Total processing time: {(totalProcessingTime / 1000).toFixed(3)}s
            </div>
          )}
        </div>

        <div className='d-flex flex-row align-items-center justify-content-end gap-2 mt-3'>
          <button
            disabled={
              (inputMode === 'file' && !selectedFile) ||
              (inputMode === 'url' && !bedUrl.trim()) ||
              rs !== null ||
              loadingRS
            }
            className='btn btn-primary'
            onClick={initializeRegionSet}
          >
            Analyze RegionSet
          </button>
          <button
            disabled={rs === null && selectedFile === null && !bedUrl.trim()}
            className='btn btn-danger w-25'
            onClick={unloadFile}
          >
            Unload
          </button>
        </div>

        <div className='mt-4'>
          {loadingRS && (
            <div className='d-inline-flex align-items-center gap-2 px-3 py-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-pill'>
              <div className='spinner-border spinner-border-sm text-success'>
                <span className='visually-hidden'>Loading...</span>
              </div>
              <span className='small text-success fw-medium'>Loading and analyzing...</span>
            </div>
          )}

          {rs && !loadingRS && (
            <div className='d-inline-flex align-items-center gap-2 px-3 py-2 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-pill'>
              <div className='bg-primary rounded-circle p-1' />
              <span className='small text-primary fw-medium'>Results ready</span>
            </div>
          )}

          <div className='mt-3'>
            {rs && (
              <div>
                <div className='mt-3 p-3 border rounded bg-white'>
                  <table className='table table-sm mb-0'>
                    <tbody>
                      <tr>
                        <th scope='row'>Identifier</th>
                        <td>{rs.identifier}</td>
                      </tr>
                      <tr>
                        <th scope='row'>Mean region width</th>
                        <td>{rs.meanRegionWidth}</td>
                      </tr>
                      <tr>
                        <th scope='row'>Total number of regions</th>
                        <td>{rs.numberOfRegions}</td>
                      </tr>
                      <tr>
                        <th scope='row'>Total number of nucleotides</th>
                        <td>{rs.nucleotidesLength}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className='mt-5'>
                  <h3>Interval chromosome length statistics</h3>
                  {rs && <ChromosomeStatsPanel rs={rs} selectedFile={selectedFile} />}
                </div>
                <div className='mt-5'>
                  {rs && (
                    // <div className="mt-3 p-3 border rounded bg-light">
                    //   <h5>Region Distribution Data</h5>
                    //   <pre className="bg-white p-3 rounded border"
                    //        style={{ fontSize: '0.875rem', maxHeight: '400px', overflow: 'auto' }}>
                    //     {JSON.stringify(rs.calculateRegionDistribution(300), null, 2)}
                    //   </pre>
                    // </div>
                    <div className='mb-3'>
                      <RegionDistributionPlot data={rs.regionDistribution(300)} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

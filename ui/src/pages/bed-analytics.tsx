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
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [bedUrl, setBedUrl] = useState<string>('');
  const [triggerSearch, setTriggerSearch] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urlParam = searchParams.get('bedUrl');
    if (urlParam) {
      setInputMode('url');
      setBedUrl(urlParam);
    }
  }, [searchParams]);

  useEffect(() => {
    initializeRegionSet();
  }, [triggerSearch])

  const fetchBedFromUrl = async (url: string): Promise<File> => {
    // console.log(`${url[0]}, ${url[1]}, ${url}`);
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
    setSelectedFile(undefined);
    setBedUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      if (inputMode === 'url') {
        const params = new URLSearchParams(searchParams);
        params.set('bedUrl', bedUrl);
        navigate(`?${params.toString()}`);
      }
      setTriggerSearch(triggerSearch + 1);
    }
  }

  return (
    <Layout footer title='BEDbase' fullHeight>
      <div className='container-fluid d-flex flex-column p-3'>
        <div className='row'>
          <div className='col-12'>
            <h4 className='text-center mt-2 mb-3 fw-bolder'>BED Analyzer</h4>
          </div>
        </div>
        <div className='row'>
          <div className='col-12 d-flex gap-2'>
            <div className='input-group bg-white'>
              {inputMode === 'file' ? (
                <>
                  {!!selectedFile ? (
                    <>
                      <input
                        className='form-control border cursor-pointer'
                        type='text'
                        value={selectedFile.name}
                        onClick={() => fileInputRef.current?.click()}
                        readOnly
                      />
                      <input
                        ref={fileInputRef}
                        className='d-none'
                        type='file'
                        accept='.bed,.gz,application/gzip,application/x-gzip'
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            unloadFile();
                            setSelectedFile(file);
                            setTriggerSearch(triggerSearch + 1);
                          }
                        }}
                      />
                    </>
                  ) : (
                    <input
                      ref={fileInputRef}
                      key='file-input'
                      className='form-control border'
                      type='file'
                      accept='.bed,.gz,application/gzip,application/x-gzip'
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          unloadFile();
                          setSelectedFile(file);
                          setTriggerSearch(triggerSearch + 1);
                        }
                      }}
                    />
                  )}
                </>
              ) : (
                <input
                  key='text-input'
                  className='form-control border'
                  type='text'
                  placeholder='https://example.com/file.bed'
                  value={bedUrl}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setBedUrl(newUrl);
                    if (rs) unloadFile();
                  }}
                  onKeyDown={handleOnKeyDown}
                />
              )}
              {(!!rs || !!selectedFile || !!bedUrl.trim()) && (
                <button
                  className='btn btn-outline-secondary border'
                  onClick={() => {
                    unloadFile();
                  }}
                  title='Remove file'
                >
                  <i className='bi bi-x-circle' />
                </button>
              )}
              <select
                className='form-select'
                style={{ maxWidth: '163px' }}
                aria-label='analyzer input selector'
                value={inputMode}
                onChange={(e) => {
                  unloadFile();
                  setInputMode(e.target.value as 'file'|'url');
                }}
              >
                <option value='file'>File Upload</option>
                <option value='url'>URL</option>
              </select>
            </div>
            <button
              className='btn btn-primary'
              type='button'
              onClick={() => {
                if (inputMode === 'url') {
                  const params = new URLSearchParams(searchParams);
                  params.set('bedUrl', bedUrl);
                  navigate(`?${params.toString()}`);
                }
                setTriggerSearch(triggerSearch + 1);
              }}
              disabled={
                (inputMode === 'file' && !selectedFile) ||
                (inputMode === 'url' && !bedUrl.trim()) ||
                rs !== null ||
                loadingRS
              }
            >
              <i className='bi bi-search' />
            </button>
          </div>
        </div>

        <div className='row mt-1'>
          <div className='col-12 text-muted text-sm text-center'>
            {inputMode === 'file' ? (
              <p className='mb-0'>
                {selectedFile && (
                  <>
                    <div>Selected file: {selectedFile.name}</div>
                    <div>File size: {bytesToSize(selectedFile.size)}</div>
                  </>
                )}
              </p>
            ) : (
              <p className='mb-0'>
                {(!!rs && bedUrl) && (
                  <div>
                    Source: {bedUrl}
                  </div>
                )}
              </p>
            )}
            {!(!!rs || !!selectedFile || !!bedUrl.trim()) && (
              <p className='mb-0'>
                No inputs provided. Try this {' '}
                <a
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    const exampleUrl =
                      'https://api.bedbase.org/v1/files/files/d/c/dcc005e8761ad5599545cc538f6a2a4d.bed.gz';
                    setInputMode('url');
                    setBedUrl(exampleUrl);
                    
                    const params = new URLSearchParams(searchParams);
                    params.set('bedUrl', exampleUrl);
                    navigate(`?${params.toString()}`);
                    setTriggerSearch(triggerSearch + 1);
                  }}
                >
                  example file
                </a>
                .
              </p>
            )}

            {(rs && !!totalProcessingTime) && (
              <p className='mb-0'>
                Total processing time: {(totalProcessingTime / 1000).toFixed(3)}s
              </p>
            )}
          </div>
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
                <div className='mt-3 border rounded bg-white p-0 overflow-hidden'>
                  <table className='table table-sm mb-2'>
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
                <div className='mt-3'>
                  <h4 className='fw-bolder'>Interval Chromosome Length Statistics</h4>
                  {rs && <ChromosomeStatsPanel rs={rs} selectedFile={selectedFile} />}
                </div>
                <div className='mt-3'>
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

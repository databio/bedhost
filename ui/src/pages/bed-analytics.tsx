import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout.tsx';
import { RegionSet, ChromosomeStatistics } from '@databio/gtars';
import { bytesToSize } from '../utils.ts';
import ChromosomeStatsPanel from '../components/bed-analytics-components/chromosome-stats-panel.tsx';
import RegionDistributionPlot from '../components/bed-analytics-components/bed-plots.tsx';
import { RefGenomeModal } from '../components/bed-splash-components/refgenome-modal.tsx';
import { useAnalyzeGenome } from '../queries/useAnalyzeGenome.ts';
import type { components } from '../../bedbase-types.d.ts';

type BedGenomeStats = components['schemas']['RefGenValidReturnModel'];

export const BEDAnalytics = () => {
  const [rs, setRs] = useState<RegionSet | null>(null);
  const [loadingRS, setLoadingRS] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; status: string } | null>(null);
  const [totalProcessingTime, setTotalProcessingTime] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [bedUrl, setBedUrl] = useState<string>('');
  const [triggerSearch, setTriggerSearch] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [showGenomeModal, setShowGenomeModal] = useState(false);
  const [genomeStats, setGenomeStats] = useState<BedGenomeStats | null>(null);
  const analyzeGenomeMutation = useAnalyzeGenome();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/bedAnalyzerWorker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current.onmessage = (e) => {
      const { type } = e.data;

      if (type === 'status') {
        setProgress((prev) => ({ percent: prev?.percent ?? 0, status: e.data.message }));
      } else if (type === 'progress') {
        setProgress({
          percent: e.data.percent,
          status: 'Processing file...',
        });
      } else if (type === 'result') {
        const endTime = performance.now();
        const regionSet = new RegionSet(e.data.entries);
        setRs(regionSet);
        setTotalProcessingTime(endTime - startTimeRef.current);
        setLoadingRS(false);
        setProgress(null);
      } else if (type === 'error') {
        console.error('Worker error:', e.data.message);
        setLoadingRS(false);
        setProgress(null);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    const urlParam = searchParams.get('bedUrl');
    if (urlParam) {
      setInputMode('url');
      setBedUrl(urlParam);
    }
  }, [searchParams]);

  useEffect(() => {
    initializeAnalysis();
  }, [triggerSearch]);

  const initializeAnalysis = useCallback(() => {
    if (!workerRef.current) return;

    if (inputMode === 'file' && selectedFile) {
      setLoadingRS(true);
      setRs(null);
      setTotalProcessingTime(null);
      setProgress({ percent: 0, status: 'Starting...' });
      startTimeRef.current = performance.now();
      workerRef.current.postMessage({ file: selectedFile });
    } else if (inputMode === 'url' && bedUrl.trim()) {
      setLoadingRS(true);
      setRs(null);
      setTotalProcessingTime(null);
      setProgress({ percent: 0, status: 'Starting...' });
      startTimeRef.current = performance.now();
      workerRef.current.postMessage({ url: bedUrl.trim() });
    }
  }, [inputMode, selectedFile, bedUrl]);

  const unloadFile = () => {
    setRs(null);
    setTotalProcessingTime(null);
    setSelectedFile(null);
    setBedUrl('');
    setProgress(null);
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
  };

  const handleAnalyzeGenome = () => {
    if (!rs) return;

    const chromStats = rs.chromosomeStatistics();
    if (!chromStats) return;

    const bedFileData: Record<string, number> = {};
    chromStats.forEach((stats: ChromosomeStatistics, chrom: string) => {
      bedFileData[chrom] = stats.end_nucleotide_position;
    });

    analyzeGenomeMutation.mutate(bedFileData, {
      onSuccess: (data) => {
        setGenomeStats(data);
        setShowGenomeModal(true);
      },
      onError: (error) => {
        console.error('Error analyzing genome:', error);
      },
    });
  };

  const classify = rs?.classify;

  return (
    <Layout footer title="BEDbase" fullHeight>
      <h1 className="text-center mt-4">BED analyzer</h1>
      <div className="container-fluid d-flex flex-column p-3">
        <div className="row">
          <div className="col-12 d-flex gap-2">
            <div className="input-group bg-white">
              {inputMode === 'file' ? (
                <>
                  {!!selectedFile ? (
                    <>
                      <input
                        className="form-control border cursor-pointer"
                        type="text"
                        value={selectedFile.name}
                        onClick={() => fileInputRef.current?.click()}
                        readOnly
                      />
                      <input
                        ref={fileInputRef}
                        className="d-none"
                        type="file"
                        accept=".bed,.gz,application/gzip,application/x-gzip"
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
                      key="file-input"
                      className="form-control border"
                      type="file"
                      accept=".bed,.gz,application/gzip,application/x-gzip"
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
                  key="text-input"
                  className="form-control border"
                  type="text"
                  placeholder="https://example.com/file.bed"
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
                  className="btn btn-outline-secondary border"
                  onClick={() => {
                    unloadFile();
                  }}
                  title="Remove file"
                >
                  <i className="bi bi-x-circle" />
                </button>
              )}
              <select
                className="form-select"
                style={{ maxWidth: '163px' }}
                aria-label="analyzer input selector"
                value={inputMode}
                onChange={(e) => {
                  unloadFile();
                  setInputMode(e.target.value as 'file' | 'url');
                }}
              >
                <option value="file">File Upload</option>
                <option value="url">URL</option>
              </select>
            </div>
            <button
              className="btn btn-primary"
              type="button"
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
              Analyze!
            </button>
          </div>
        </div>

        <div className="row mt-1">
          <div className="col-12 text-muted">
            {inputMode === 'file' ? (
              <p className="mb-0">
                {selectedFile && (
                  <>
                    <div>Selected file: {selectedFile.name}</div>
                    <div>File size: {bytesToSize(selectedFile.size)}</div>
                  </>
                )}
              </p>
            ) : (
              <p className="mb-0">{!!rs && bedUrl && <div>Source: {bedUrl}</div>}</p>
            )}
            {!(!!rs || !!selectedFile || !!bedUrl.trim()) && (
              <p className="mb-0">
                No input provided. Try this{' '}
                <a
                  href="#"
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

            {rs && !!totalProcessingTime && (
              <p className="mb-0">Total processing time: {(totalProcessingTime / 1000).toFixed(3)}s</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          {loadingRS && progress && (
            <div className="mb-3">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-pill mb-2">
                <div className="spinner-border spinner-border-sm text-success">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="small text-success fw-medium">{progress.status}</span>
              </div>
              {progress.percent >= 0 && (
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${progress.percent}%`, transition: 'width 0.1s ease' }}
                    aria-valuenow={progress.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              )}
            </div>
          )}

          {rs && !loadingRS && (
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-pill">
              <div className="bg-primary rounded-circle p-1" />
              <span className="small text-primary fw-medium">Results ready</span>
            </div>
          )}

          <div className="mt-3">
            {rs && (
              <div>
                <div className="mt-3 p-3 border rounded shadow-sm bg-white">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <th scope="row">Identifier</th>
                        <td>{rs.identifier}</td>
                      </tr>
                      <tr>
                        <th scope="row">Mean region width</th>
                        <td>{rs.meanRegionWidth}</td>
                      </tr>
                      <tr>
                        <th scope="row">Total number of regions</th>
                        <td>{rs.numberOfRegions}</td>
                      </tr>
                      <tr>
                        <th scope="row">Total number of nucleotides</th>
                        <td>{rs.nucleotidesLength}</td>
                      </tr>
                      <tr>
                        <th scope="row">Data Format</th>
                        <td>{classify?.data_format}</td>
                      </tr>
                      <tr>
                        <th scope="row">BED compliance</th>
                        <td>{classify?.bed_compliance}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-3">
                    <button
                      className="btn btn-outline-primary"
                      onClick={handleAnalyzeGenome}
                      disabled={analyzeGenomeMutation.isPending}
                    >
                      {analyzeGenomeMutation.isPending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Analyzing...
                        </>
                      ) : (
                        'Analyze reference genome compatibility'
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-5">
                  <h5>Interval chromosome length statistics</h5>
                  {rs && (
                    <ChromosomeStatsPanel rs={rs} selectedFile={selectedFile} />
                  )}
                </div>
                <div className="mt-5">
                  {rs && (
                    <div className="mb-3">
                      <h5>Regions distribution over chromosomes</h5>
                      <RegionDistributionPlot
                        data={rs.regionDistribution(300)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {genomeStats && (
        <RefGenomeModal
          show={showGenomeModal}
          onHide={() => {
            setShowGenomeModal(false);
            setGenomeStats(null);
          }}
          genomeStats={genomeStats}
        />
      )}
    </Layout>
  );
};

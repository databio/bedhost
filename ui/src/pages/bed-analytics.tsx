import {useState, useRef, useEffect} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import {Layout} from '../components/layout.tsx';
import {bytesToSize} from '../utils.ts';
import ChromosomeStatsPanel from '../components/bed-analytics-components/chromosome-stats-panel.tsx';
import RegionDistributionPlot from '../components/bed-analytics-components/bed-plots.tsx';
import {RefGenomeModal} from '../components/bed-splash-components/refgenome-modal.tsx';
import {useAnalyzeGenome} from '../queries/useAnalyzeGenome.ts';
import type {components} from '../../bedbase-types.d.ts';

type BedGenomeStats = components['schemas']['RefGenValidReturnModel'];

// Type for pre-computed analysis result from worker
interface BedAnalysisResult {
  number_of_regions: number;
  mean_region_width: number;
  nucleotides_length: number;
  identifier: string;
  chromosome_statistics: Record<string, {
    chromosome: string;
    number_of_regions: number;
    minimum_region_length: number;
    maximum_region_length: number;
    mean_region_length: number;
    median_region_length: number;
    start_nucleotide_position: number;
    end_nucleotide_position: number;
  }>;
  region_distribution: Array<{
    chr: string;
    start: number;
    end: number;
    n: number;
    rid: number;
  }>;
  classify: {
    bed_compliance: string;
    data_format: string;
    compliant_columns: number;
    non_compliant_columns: number;
  };
}

interface WorkerProgress {
  bytesProcessed: number;
  totalSize: number;
  percent: number;
  regionsFound: number;
  linesProcessed: number;
}

export const BEDAnalytics = () => {
  const [analysisResult, setAnalysisResult] = useState<BedAnalysisResult | null>(null);
  const [loadingRS, setLoadingRS] = useState(false);
  const [totalProcessingTime, setTotalProcessingTime] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [bedUrl, setBedUrl] = useState<string>('');
  const [triggerSearch, setTriggerSearch] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Worker state
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<WorkerProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);

  const [showGenomeModal, setShowGenomeModal] = useState(false);
  const [genomeStats, setGenomeStats] = useState<BedGenomeStats | null>(null);
  const analyzeGenomeMutation = useAnalyzeGenome();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize worker on mount
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/bedAnalyzerWorker.js', import.meta.url),
      {type: 'module'}
    );

    workerRef.current.onmessage = (e) => {
      const {type, result, message, bytesProcessed, totalSize, percent, regionsFound, linesProcessed} = e.data;

      if (type === 'status') {
        setStatus(message);
      } else if (type === 'progress') {
        setProgress({bytesProcessed, totalSize, percent, regionsFound, linesProcessed});
      } else if (type === 'result') {
        const endTime = performance.now();
        setAnalysisResult(result);
        setTotalProcessingTime(endTime - startTimeRef.current);
        setStatus(null);
        setProgress(null);
        setLoadingRS(false);
      } else if (type === 'error') {
        setError(message);
        setStatus(null);
        setProgress(null);
        setLoadingRS(false);
        console.error('Worker error:', message);
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    const urlParam = searchParams.get('bedUrl');
    if (urlParam) {
      setInputMode('url');
      setBedUrl(urlParam);
    }
  }, [searchParams]);

  useEffect(() => {
    initializeRegionSet();
  }, [triggerSearch]);

  const initializeRegionSet = async () => {
    if (!workerRef.current) return;

    let shouldProcess = false;
    let fileToProcess: File | null = null;
    let urlToProcess: string | null = null;

    if (inputMode === 'file' && selectedFile) {
      fileToProcess = selectedFile;
      shouldProcess = true;
    } else if (inputMode === 'url' && bedUrl.trim()) {
      // Convert bedbase ID to URL if needed
      const url = bedUrl.trim();
      urlToProcess = url.length === 32 && !url.startsWith('http')
        ? `https://api.bedbase.org/v1/files/files/${url[0]}/${url[1]}/${url}.bed.gz`
        : url;
      shouldProcess = true;
    }

    if (shouldProcess) {
      setLoadingRS(true);
      setAnalysisResult(null);
      setTotalProcessingTime(null);
      setProgress(null);
      setError(null);
      setStatus('Starting...');
      startTimeRef.current = performance.now();

      if (fileToProcess) {
        workerRef.current.postMessage({type: 'analyze', file: fileToProcess});
      } else if (urlToProcess) {
        workerRef.current.postMessage({type: 'analyze', url: urlToProcess});
      }
    }
  };

  const unloadFile = () => {
    setAnalysisResult(null);
    setTotalProcessingTime(null);
    setSelectedFile(null);
    setBedUrl('');
    setProgress(null);
    setStatus(null);
    setError(null);
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
    if (!analysisResult) return;

    const chromStats = analysisResult.chromosome_statistics;
    if (!chromStats) return;

    const bedFileData: Record<string, number> = {};
    Object.entries(chromStats).forEach(([chrom, stats]) => {
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

  const classify = analysisResult?.classify;

  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
    return `${bytes} bytes`;
  };

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
                    if (analysisResult) unloadFile();
                  }}
                  onKeyDown={handleOnKeyDown}
                />
              )}
              {(!!analysisResult || !!selectedFile || !!bedUrl.trim()) && (
                <button
                  className="btn btn-outline-secondary border"
                  onClick={() => {
                    unloadFile();
                  }}
                  title="Remove file"
                >
                  <i className="bi bi-x-circle"/>
                </button>
              )}
              <select
                className="form-select"
                style={{maxWidth: '163px'}}
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
                analysisResult !== null ||
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
              <p className="mb-0">{!!analysisResult && bedUrl && <div>Source: {bedUrl}</div>}</p>
            )}
            {!(!!analysisResult || !!selectedFile || !!bedUrl.trim()) && (
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

            {analysisResult && !!totalProcessingTime && (
              <p className="mb-0">Total processing time: {(totalProcessingTime / 1000).toFixed(3)}s</p>
            )}
          </div>
        </div>


        <div className="mt-4">
          {/* Progress display */}
          {loadingRS && (
            <div className="mb-3">
              <div className="d-flex align-items-center mb-2">
                <div className="spinner-border spinner-border-sm text-success me-2">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="small text-success fw-medium">
                  {status || 'Processing...'}
                </span>
              </div>

              {progress && progress.totalSize > 0 && (
                <>
                  <div className="progress" style={{height: '20px'}}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                      role="progressbar"
                      style={{width: `${progress.percent}%`}}
                      aria-valuenow={progress.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      {progress.percent}%
                    </div>
                  </div>
                  <small className="text-muted">
                    {formatSize(progress.bytesProcessed)} / {formatSize(progress.totalSize)}
                    {progress.regionsFound > 0 && ` - ${progress.regionsFound.toLocaleString()} regions found`}
                  </small>
                </>
              )}

              {progress && progress.totalSize === 0 && progress.regionsFound > 0 && (
                <small className="text-muted">
                  {formatSize(progress.bytesProcessed)} processed - {progress.regionsFound.toLocaleString()} regions
                  found
                </small>
              )}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {analysisResult && !loadingRS && (
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-2 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-pill">
              <div className="bg-primary rounded-circle p-1"/>
              <span className="small text-primary fw-medium">
                Results ready
              </span>
            </div>
          )}

          <div className="mt-3">
            {analysisResult && (
              <div>
                <div className="mt-3 p-3 border rounded shadow-sm bg-white">
                  <table className="table table-sm mb-0">
                    <tbody>
                    <tr>
                      <th scope="row">Identifier</th>
                      <td>{analysisResult.identifier}</td>
                    </tr>
                    <tr>
                      <th scope="row">Mean region width</th>
                      <td>{analysisResult.mean_region_width}</td>
                    </tr>
                    <tr>
                      <th scope="row">Total number of regions</th>
                      <td>{analysisResult.number_of_regions.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th scope="row">Total number of nucleotides</th>
                      <td>{analysisResult.nucleotides_length.toLocaleString()}</td>
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
                          <span className="spinner-border spinner-border-sm me-2" role="status"
                                aria-hidden="true"></span>
                          Analyzing...
                        </>
                      ) : (
                        'Analyze reference genome compatibility'
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-5">
                  <h3>Interval chromosome length statistics</h3>
                  {analysisResult && (
                    <ChromosomeStatsPanel
                      chromosomeStatistics={analysisResult.chromosome_statistics}
                      selectedFile={selectedFile}
                    />
                  )}
                </div>
                <div className="mt-5">
                  {analysisResult && (
                    <div className="mb-3">
                      <RegionDistributionPlot
                        data={analysisResult.region_distribution}
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

import { useState, useRef } from 'react';
import { Layout } from '../components/layout';
import { useNavigate } from 'react-router-dom';

import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import toast from 'react-hot-toast';
import { BBCONF_SNIPPETS } from '../const';
// import { useExampleBed } from '../queries/useExampleBed';
import { useExampleBedSet } from '../queries/useExampleBedSet';
import { useStats } from '../queries/useStats.ts';
import { EmbeddingContainer } from '../components/umap/embedding-container.tsx';
import type { EmbeddingContainerRef } from '../components/umap/embedding-container.tsx';
import { FileSearchGraphic } from '../components/graphics/file-search-graphic.tsx';
import { BedAnalyzerGraphic } from '../components/graphics/bed-analyzer-graphic.tsx';


export const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const [copiedClient, setCopiedClient] = useState(false);
  const [searchType, setSearchType] = useState('t2b');
  const [activeClientTab, setActiveClientTab] = useState(BBCONF_SNIPPETS[0].language);

  const embeddingContainerRef = useRef<EmbeddingContainerRef>(null);

  const navigate = useNavigate();

  // const { data: exampleBedMetadata } = useExampleBed(); # if example will be dynamic again
  const exampleBedId = 'dcc005e8761ad5599545cc538f6a2a4d';
  const { data: exampleBedSetMetadata } = useExampleBedSet();
  const { data: bedbaseStats } = useStats();

  const handleSearch = () => {
    if (!searchTerm) {
      toast.error('Please enter a search term.');
      return;
    }
    navigate(`/search?q=${searchTerm}&view=${searchType}`);
  };

  return (
    <Layout footer title='BEDbase' fullHeight>
      <div className='d-flex flex-column w-100 align-items-center p-2'>
        <div className='d-flex flex-column align-items-center justify-content-center text-center w-100' style={{ minHeight: '77vh' }}>
          <h1 className='fw-lighter text-primary text-7xl mb-4'>BEDbase</h1>
          <div className='col-12 col-lg-9 text-muted'>
            <p className='text-center mb-0 text-muted'>
              The open access platform for aggregating, analyzing, and serving genomic region data.
            </p>
            <p className='text-center mb-5'>
              Explore thousands of BED files (including{' '}
              <a
                href='https://genome.ucsc.edu/FAQ/FAQformat.html#format1'
                target='_blank'
                rel='noopener noreferrer'
                className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover'
              >
                <i className='fw-medium text-primary'>.bed</i>
              </a>
              ,{' '}
              <a
                href='https://genome.ucsc.edu/goldenPath/help/bigBed.html'
                target='_blank'
                rel='noopener noreferrer'
                className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover fw-medium fst-italic'
              >
                .bigbed
              </a>
              ,{' '}
              <a
                href='https://genome.ucsc.edu/goldenPath/help/wiggle.html'
                target='_blank'
                rel='noopener noreferrer'
                className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover fw-medium fst-italic'
              >
                .wig
              </a>
              ,{' '}
              <a
                href='https://genome.ucsc.edu/goldenPath/help/bigWig.html'
                target='_blank'
                rel='noopener noreferrer'
                className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover fw-medium fst-italic'
              >
                .bw
              </a>
              ,{' '}
              <a
                href='https://genome.ucsc.edu/goldenPath/help/bedgraph.html'
                target='_blank'
                rel='noopener noreferrer'
                className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover fw-medium fst-italic'
              >
                .bdg
              </a>
              ) from ENCODE, GEO, and more.
            </p>
          </div>

          <div className='col-12 col-lg-9 d-flex gap-2'>
            <div className='input-group bg-white'>
              {searchType === 'b2b' ? (
                <input
                  key='file-input'
                  className='form-control border'
                  type='file'
                  accept='.bed,.gz,application/gzip,application/x-gzip'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      navigate(`/search?view=b2b`, { state: { file: file } });
                    }
                  }}
                />
              ) : (
                <input
                  key='text-input'
                  className='form-control border'
                  type='text'
                  placeholder={searchType === 't2b' ? 'Search for BED files' : 'Search for BEDsets'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              )}

              <select
                className='form-select'
                style={{ maxWidth: '163px' }}
                aria-label='search type selector'
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value='t2b'>Text-to-BED</option>
                <option value='b2b'>BED-to-BED</option>
                <option value='t2bs'>Text-to-BEDset</option>
              </select>
            </div>
            <button className='btn btn-primary' type='button' onClick={handleSearch}>
              <i className='bi bi-search' />
            </button>
          </div>

          <div className='text-muted d-flex flex-column flex-md-row align-items-center justify-content-center gap-1 mt-1 mb-5'>
            <span>
              Or, visit a random{' '}
              <a href={`/bed/${exampleBedId}`} className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover fw-medium fst-italic'>BED file</a>
            </span>
            <span>
              or <a href={`/bedset/${exampleBedSetMetadata?.id || 'not-found'}`} className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover fw-medium fst-italic'> BEDset</a>
            </span>
          </div>

          <div className='my-3'></div>

          <div className='d-flex flex-row gap-4 justify-content-center mb-5 pb-2 text-muted'>
            <span>
              <strong className='text-primary'>{(bedbaseStats?.bedfiles_number || 0).toLocaleString()}</strong> BED files
            </span>
            <span>•</span>
            <span>
              <strong className='text-success'>{(bedbaseStats?.bedsets_number || 0).toLocaleString()}</strong> BEDsets
            </span>
            <span>•</span>
            <span>
              <strong className='text-info'>{(bedbaseStats?.genomes_number || 0).toLocaleString()}</strong> genomes
            </span>
            <span>•</span>
            <a
              className='text-muted link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover'
              href={`/metrics`}
            >
              <strong>more</strong> metrics
              <i className='bi bi-reply-fill ms-1' style={{ transform: 'scale(-1, 1)', display: 'inline-block' }}></i>
            </a>
          </div>
        </div>

        <div className='col-12 col-lg-12'>
          <div className='row align-items-center py-5'>
            <div className='col-12 col-md-6 mb-4 mb-md-0'>
              <h5 className='fw-medium'>Download and cache your data locally</h5>
              <p className='text-balance text-muted pe-md-4'>
                Use the BEDbase clients to access BED files and BED sets programmatically.
                The clients handle downloading and caching, enabling efficient reuse of genomic region
                data without manual API calls and redundancy.
                Available in Python: {' '}
                <a href='https://pypi.org/project/geniml/' className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover'>
                  <i className='bi bi-box-fill me-1' />
                  geniml
                </a>
                , Rust: {' '}
                <a href='https://crates.io/crates/gtars' className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover'>
                  <i className='bi bi-box-fill me-1' />
                  gtars
                </a>
                , and R: {' '}
                <a href='https://github.com/waldronlab/bedbaser' className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover'>
                  <i className='bi bi-github me-1' />
                  BEDbaser
                </a>
                .
              </p>
            </div>
            <div className='col-12 col-md-6 d-flex flex-column align-items-center justify-content-center h-100 ps-md-4'>
              <div className='card h-100 border overflow-hidden rounded-3 w-100'>
                <div className='d-flex flex-column'>
                  <div className='position-relative' style={{ height: '210px' }}>
                    <div className='d-flex flex-row align-items-center text-sm p-1'>
                      <ul className='nav nav-pills flex-row'>
                        {BBCONF_SNIPPETS.map((snippet) => (
                          <li className='nav-item' key={snippet.language}>
                            <button
                              className={`nav-link py-0 px-2 m-1 ${activeClientTab === snippet.language ? 'active' : ''}`}
                              onClick={() => setActiveClientTab(snippet.language)}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {snippet.language}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className='w-100 h-100 overflow-auto' style={{ maxHeight: '160px' }}>
                      {BBCONF_SNIPPETS.map((snippet) => (
                        <div key={snippet.language} className={activeClientTab === snippet.language ? '' : 'd-none'}>
                          <Markdown className='h-100' rehypePlugins={[rehypeHighlight]}>
                            {snippet.code}
                          </Markdown>
                        </div>
                      ))}
                    </div>
                    <div className='position-absolute top-0 end-0 me-2 mt-1'>
                      <button
                        onClick={() => {
                          const activeSnippet = BBCONF_SNIPPETS.find((s) => s.language === activeClientTab);
                          if (activeSnippet) {
                            navigator.clipboard.writeText(activeSnippet.raw);
                            setCopiedClient(true);
                            setTimeout(() => setCopiedClient(false), 2000);
                          }
                        }}
                        className='btn btn-outline-primary py-0 px-2 m-1'
                        style={{ fontSize: '0.7rem' }}
                      >
                        {copiedClient ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='row align-items-center py-5'>
            <div className='col-12 col-md-6 order-2 order-md-1 pe-md-4'>
              <div className='border rounded-3 overflow-hidden cursor-pointer' style={{ height: '220px' }} onClick={() => navigate('/search')}>
                <FileSearchGraphic />
              </div>
            </div>
            <div className='col-12 col-md-6 order-1 order-md-2 mb-4 mb-md-0 ps-md-4'>
              <h5 className='fw-medium'>Search for BED files</h5>
              <p className='text-balance text-muted'>
                BEDbase indexes genomic intervals directly, enabling similarity-based search grounded in the actual
                content of BED files rather than unstructured or inconsistent user-provided metadata.
                Users can search by submitting a query string or by uploading a BED file, allowing precise
                and reproducible discovery of relevant genomic region datasets.
              </p>
            </div>
          </div>

          <div className='row align-items-center py-5'>
            <div className='col-12 col-md-6 mb-4 mb-md-0'>
              <h5 className='fw-medium'>Visualize BED file similarity</h5>
              <p className='text-balance text-muted pe-md-4'>
                Explore BED file similarity using an interactive UMAP of hg38-based embeddings.
                Compare existing BEDbase data and upload your own BED file to see how
                it relates to other genomic region sets in embedding space.
              </p>
            </div>
            <div className='col-12 col-md-6 d-flex justify-content-center ps-md-4'>
              <div className='w-100 border rounded-3 overflow-hidden' style={{ height: '220px' }}>
                <EmbeddingContainer
                  ref={embeddingContainerRef}
                  bedIds={undefined}
                  height={219}
                  preselectPoint={false}
                  centerInitial={false}
                  tooltipInitial={false}
                  simpleTooltip={false}
                  blockCompact={true}
                  showBorder={false}
                  rounded={'rounded-3'}
                />
              </div>
            </div>
          </div>

          <div className='row align-items-center py-5'>
            <div className='col-12 col-md-6 order-2 order-md-1 d-flex justify-content-center'>
              <div className='w-100 border rounded-3 overflow-hidden cursor-pointer' style={{ height: '220px' }} onClick={() => navigate('/analyze')}>
                <BedAnalyzerGraphic />
              </div>
            </div>
            <div className='col-12 col-md-6 order-1 order-md-2 mb-4 mb-md-0 ps-md-4'>
              <h5 className='fw-medium'>Analyze your BED files</h5>
              <p className='text-balance text-muted'>
                Upload a BED file or provide a URL to quickly explore its contents.
                The BED Analyzer generates key statistics, summary tables, and visualizations,
                giving you an immediate overview of region counts, lengths, genome coverage,
                and other essential properties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

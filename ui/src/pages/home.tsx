import { useState } from 'react';
import { Layout } from '../components/layout';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import toast from 'react-hot-toast';
import { CODE_SNIPPETS, BBCONF_SNIPPETS } from '../const';
// import { useExampleBed } from '../queries/useExampleBed';
import { useExampleBedSet } from '../queries/useExampleBedSet';
import { useStats } from '../queries/useStats.ts';
import { AnimatedEmbeddingsBackground } from '../components/animated-embeddings-background.tsx';

export const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const [copiedAPI, setCopiedAPI] = useState(false);
  const [copiedClient, setCopiedClient] = useState(false);
  const [searchType, setSearchType] = useState('t2b');
  const [activeApiTab, setActiveApiTab] = useState(CODE_SNIPPETS[0].language);
  const [activeClientTab, setActiveClientTab] = useState(BBCONF_SNIPPETS[0].language);

  const navigate = useNavigate();

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
      {/* Hero Section with Animated Background */}
      <div className='position-relative w-100' style={{ height: '85vh', overflow: 'hidden' }}>
        <AnimatedEmbeddingsBackground />

        {/* Hero Content */}
        <div className='position-relative d-flex flex-column align-items-center' style={{ height: '85vh', zIndex: 1, paddingTop: '10vh' }}>
          <div className='text-center w-100'>
            <h1 className='fw-lighter text-primary mb-4' style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
              BEDbase
            </h1>
            <div className='col-12 col-lg-10 mx-auto text-muted mb-4'>
              <p className='fs-4 mb-3' style={{ fontWeight: 300 }}>
                The open access platform for aggregating, analyzing, and serving genomic region data.
              </p>
              <p className='mb-4'>
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
                  className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover'
                >
                  <i className='fw-medium text-primary'>.bigbed</i>
                </a>
                ,{' '}
                <a
                  href='https://genome.ucsc.edu/goldenPath/help/wiggle.html'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover'
                >
                  <i className='fw-medium text-primary'>.wig</i>
                </a>
                ,{' '}
                <a
                  href='https://genome.ucsc.edu/goldenPath/help/bigWig.html'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover'
                >
                  <i className='fw-medium text-primary'>.bw</i>
                </a>
                ,{' '}
                <a
                  href='https://genome.ucsc.edu/goldenPath/help/bedgraph.html'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover'
                >
                  <i className='fw-medium text-primary'>.bdg</i>
                </a>
                ) from ENCODE, GEO, and more.
              </p>
            </div>

            {/* Search Bar */}
            <div className='col-12 col-lg-8 col-xl-6 mx-auto mb-4'>
              <div className='d-flex gap-2'>
                <div className='input-group bg-white rounded shadow-sm'>
                  {searchType === 'b2b' ? (
                    <input
                      key='file-input'
                      className='form-control border-0'
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
                      className='form-control border-0'
                      type='text'
                      placeholder={searchType === 't2b' ? 'Search for BED files' : 'Search for BEDsets'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  )}

                  <select
                    className='form-select border-0'
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
                <button className='btn btn-primary px-4' type='button' onClick={handleSearch}>
                  <i className='bi bi-search' />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className='d-flex flex-wrap gap-4 justify-content-center mb-4 text-muted'>
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

            {/* Quick Links */}
            <div className='text-sm text-muted'>
              <span>
                Visit a <a href='/umap'>full embedding atlas</a>, explore a{' '}
                <a href={`/bedset/${exampleBedSetMetadata?.id || 'not-found'}`}>BEDset</a>, or{' '}
                <a href='/analyze'>analyze your own BED file</a>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className='d-flex flex-column w-100 align-items-center p-2 bg-white'>

        <div className='col-12 col-lg-10 mb-5'>
          <div className='row g-2'>
            <div className='col-md-4'>
              <div className='d-flex flex-column gap-2 h-100'>
                <div className='card border overflow-hidden flex-fill'>
                  <div className='card-body d-flex flex-column h-100'>
                    <div className='d-flex align-items-center mb-2'>
                      <i className='bi bi-body-text fs-5 text-primary me-2'></i>
                      <h6 className='mb-0 fw-bold'>Vector Search</h6>
                    </div>
                    <p className='text-muted flex-grow-1 text-sm'>
                      Search by text, upload BED files for similarity matching, or browse BEDsets. Explore results
                      directly in their region embedding space.
                    </p>
                    <div className='d-flex gap-2'>
                      <a href='/search' className='btn btn-outline-primary btn-sm align-self-start'>
                        Search
                      </a>
                      <a href='/umap' className='btn btn-outline-primary btn-sm align-self-start'>
                        Embedding Atlas
                      </a>
                    </div>
                  </div>
                </div>

                <div className='card border overflow-hidden flex-fill'>
                  <div className='card-body d-flex flex-column h-100'>
                    <div className='d-flex align-items-center mb-2'>
                      <i className='bi bi-graph-up fs-5 text-primary me-2'></i>
                      <h6 className='mb-0 fw-bold'>BED Analyzer</h6>
                    </div>
                    <p className='text-muted flex-grow-1 text-sm'>
                      Analyze any BED file in your browser with gtars-wasm. Get file statistics, region distributions,
                      and chromosome coverage instantly.
                    </p>
                    <a href='/analyze' className='btn btn-outline-primary btn-sm align-self-start'>
                      BED Analyzer
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className='col-md-8'>
              <div className='card h-100 border overflow-hidden'>
                <div className='border-bottom position-relative' style={{ height: '210px' }}>
                  <div className='d-flex flex-row align-items-center text-sm p-1'>
                    <ul className='nav nav-pills flex-row'>
                      {CODE_SNIPPETS.map((snippet) => (
                        <li className='nav-item' key={snippet.language}>
                          <button
                            className={`nav-link py-0 px-2 m-1 ${activeApiTab === snippet.language ? 'active' : ''}`}
                            onClick={() => setActiveApiTab(snippet.language)}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {snippet.language}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='w-100 h-100 overflow-auto' style={{ maxHeight: '160px' }}>
                    {CODE_SNIPPETS.map((snippet) => (
                      <div key={snippet.language} className={activeApiTab === snippet.language ? '' : 'd-none'}>
                        <Markdown className='h-100' rehypePlugins={[rehypeHighlight]}>
                          {snippet.code}
                        </Markdown>
                      </div>
                    ))}
                  </div>
                  <div className='position-absolute top-0 end-0 me-2 mt-1'>
                    <button
                      onClick={() => {
                        const activeSnippet = CODE_SNIPPETS.find((s) => s.language === activeApiTab);
                        if (activeSnippet) {
                          navigator.clipboard.writeText(activeSnippet.raw);
                          setCopiedAPI(true);
                          setTimeout(() => setCopiedAPI(false), 2000);
                        }
                      }}
                      className='btn btn-outline-primary py-0 px-2 m-1'
                      style={{ fontSize: '0.7rem' }}
                    >
                      {copiedAPI ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className='card-body'>
                  <div className='d-flex align-items-center mb-2'>
                    <i className='bi bi-hdd-stack-fill fs-5 text-primary me-2'></i>
                    <h6 className='mb-0 fw-bold'>REST API</h6>
                  </div>
                  <p className='text-muted small mb-3 text-sm'>
                    Programmatic access to the BEDbase web server with a RESTful API. Query, retrieve, and analyze
                    genomic regions with simple HTTP requests from any language.
                  </p>
                  <a href='/api' className='btn btn-outline-primary btn-sm'>
                    API Docs
                  </a>
                </div>
              </div>
            </div>

            <div className='col-md-12'>
              <div className='card h-100 border overflow-hidden'>
                <div className='border-bottom position-relative' style={{ height: '210px' }}>
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
                <div className='card-body'>
                  <div className='d-flex align-items-center mb-2'>
                    <i className='bi bi-terminal fs-5 text-primary me-2'></i>
                    <h6 className='mb-0 fw-bold'>BEDbase Clients</h6>
                  </div>
                  <p className='text-muted small mb-3 text-sm'>
                    Download, cache, and analyze BED files programmatically with native Python and R packages.
                    Simplifies API interaction through high-level interfaces.
                  </p>
                  <div className='d-flex gap-2'>
                    <a
                      href='https://pypi.org/project/geniml/'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='btn btn-outline-primary btn-sm'
                    >
                      <i className='bi bi-box-fill me-1'></i> Python
                    </a>
                    <a
                      href='https://github.com/waldronlab/bedbaser'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='btn btn-outline-primary btn-sm'
                    >
                      <i className='bi bi-github me-1'></i> R
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

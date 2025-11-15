import { useState } from 'react';
import { Layout } from '../components/layout';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { CODE_SNIPPETS, BBCONF_SNIPPETS } from '../const';
// import { useExampleBed } from '../queries/useExampleBed';
import { useExampleBedSet } from '../queries/useExampleBedSet';
import { useStats } from '../queries/useStats.ts';
import { BEDEmbeddingPlot } from '../components/umap/bed-embedding-plot.tsx';

export const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const [copiedAPI, setCopiedAPI] = useState(false);
  const [copiedClient, setCopiedClient] = useState(false);
  // const [searchOptions, setSearchOptions] = useState(false);
  const [activeApiTab, setActiveApiTab] = useState(CODE_SNIPPETS[0].language);
  const [activeClientTab, setActiveClientTab] = useState(BBCONF_SNIPPETS[0].language);
  const navigate = useNavigate();

  // const { data: exampleBedMetadata } = useExampleBed(); # if example will be dynamic again
  const exampleBedId = 'dcc005e8761ad5599545cc538f6a2a4d'
  const { data: exampleBedSetMetadata } = useExampleBedSet();
  const { data: bedbaseStats } = useStats();

  return (
    <Layout footer title='BEDbase' fullHeight>
      <div className='d-flex flex-column w-100 align-items-center p-2'>
        <div className='my-3'></div>
        <h1 className='fw-bolder text-primary text-4xl mb-2'>BEDbase</h1>
        <div className='col-12 col-lg-10'>
          <p className='text-md-center text-sm mb-4'>
            The open access platform for aggregating, analyzing, and serving genomic regions.
          </p>
        </div>
        <div className='col-12 col-lg-10 d-flex flex-row align-items-center col-12 col-lg-10 gap-2'>
          <div className='input-group'>
            <input
              className='form-control border'
              type='text'
              placeholder='Start searching for BED files'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchTerm.length === 0) {
                    return;
                  }
                  navigate(`/search?q=${searchTerm}`);
                }
              }}
            />
            {/* <button 
              className='btn btn-outline-secondary border' 
              type='button'
              onClick={() => setSearchOptions(!searchOptions)}
            >
              <i className='bi bi-sliders' />
            </button> */}
          </div>
          <button
            className='btn btn-primary'
            type='button'
            onClick={() => {
              if (searchTerm.length === 0) {
                return;
              }
              navigate(`/search?q=${searchTerm}&view=t2b`);
            }}
          >
            <i className='bi bi-search' />
          </button>
        </div>

        {/* {searchOptions && (
          <div>
            test
          </div>
        )} */}

        <div className='d-flex flex-row align-items-center col-12 col-lg-10 mt-2 border rounded overflow-hidden'>
          <BEDEmbeddingPlot bedId={exampleBedId} height={330}/>
        </div>
        <div className='text-xs text-muted d-flex flex-column flex-md-row align-items-center justify-content-center gap-1 mt-1 mb-5'>
          <span>explore the BED file embedding space above, or visit a <a href={`/bed/${exampleBedId}`}>random BED file</a></span>
          <span>or <a href={`/bedset/${exampleBedSetMetadata?.id || 'not-found'}`}> BEDset</a></span>
        </div>

        <div className='d-flex flex-row gap-4 justify-content-center mb-5 text-muted'>
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
          <a className='text-muted link-underline link-offset-1 link-underline-opacity-0 link-underline-opacity-75-hover' href={`/metrics`}>
            <strong>more</strong> metrics
            <i className='bi bi-reply-fill ms-1' style={{transform: 'scale(-1, 1)', display: 'inline-block'}}></i>
          </a>
        </div>

        <div className='col-12 col-lg-10 mb-5'>
          <div className='row g-3'>
            <div className='col-md-4'>
              <div className='d-flex flex-column gap-3 h-100'>
                <div className='card border overflow-hidden flex-fill'>
                  <div className='card-body d-flex flex-column h-100'>
                    <div className='d-flex align-items-center mb-1'>
                      <i className='bi bi-body-text fs-5 text-primary me-2'></i>
                      <h6 className='mb-0 fw-bold' style={{ fontSize: '0.9rem' }}>Vector Search</h6>
                    </div>
                    <p className='text-muted flex-grow-1' style={{ fontSize: '0.8rem' }}>
                      Search by text, upload BED files for similarity matching, or browse BEDsets. Explore results directly within their region embedding space.
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
                    <div className='d-flex align-items-center mb-1'>
                      <i className='bi bi-graph-up fs-5 text-primary me-2'></i>
                      <h6 className='mb-0 fw-bold' style={{ fontSize: '0.9rem' }}>BED Analyzer</h6>
                    </div>
                    <p className='text-muted flex-grow-1' style={{ fontSize: '0.8rem' }}>
                      Analyze any BED file in your browser with our gtars-wasm integration. Get file statistics, region distributions, and chromosome coverage instantly.
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
                    <ul className='nav nav-pills flex-row' style={{ fontSize: '0.7rem' }}>
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
                      <div
                        key={snippet.language}
                        className={activeApiTab === snippet.language ? '' : 'd-none'}
                      >
                        <Markdown className='h-100' rehypePlugins={[rehypeHighlight]}>
                          {snippet.code}
                        </Markdown>
                      </div>
                    ))}
                  </div>
                  <div className='position-absolute top-0 end-0 me-2 mt-1'>
                    <button
                      onClick={() => {
                        const activeSnippet = CODE_SNIPPETS.find(s => s.language === activeApiTab);
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
                  <p className='text-muted small mb-3'>
                    Programmatic access to the BEDbase web server with a RESTful API. Query, retrieve, and analyze genomic regions with simple HTTP requests from any language.
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
                    <ul className='nav nav-pills flex-row' style={{ fontSize: '0.7rem' }}>
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
                      <div
                        key={snippet.language}
                        className={activeClientTab === snippet.language ? '' : 'd-none'}
                      >
                        <Markdown className='h-100' rehypePlugins={[rehypeHighlight]}>
                          {snippet.code}
                        </Markdown>
                      </div>
                    ))}
                  </div>
                  <div className='position-absolute top-0 end-0 me-2 mt-1'>
                    <button
                      onClick={() => {
                        const activeSnippet = BBCONF_SNIPPETS.find(s => s.language === activeClientTab);
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
                  <p className='text-muted small mb-3'>
                    Download, cache, and analyze BED files programmatically with native Python and R packages. Simplifies API interaction through high-level interfaces.
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

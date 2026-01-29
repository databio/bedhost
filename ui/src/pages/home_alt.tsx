import {useState} from 'react';
import {Layout} from '../components/layout';
import {useNavigate} from 'react-router-dom';
// import {InPaths, OutPaths} from '../motions/landing-animations';
import {Col, Image, Nav, Row, Tab} from 'react-bootstrap';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
// import { CODE_SNIPPETS } from '../const';
import {BBCONF_SNIPPETS} from '../const';
// import { useExampleBed } from '../queries/useExampleBed';
import toast from 'react-hot-toast';
import {useExampleBedSet} from '../queries/useExampleBedSet';
import {useStats} from '../queries/useStats.ts';
import {motion} from 'framer-motion';


export const HomeAlt = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermSmall, setSearchTermSmall] = useState('Kidney cancer in humans');
  const [copied, setCopied] = useState(false);
  const [searchType, setSearchType] = useState('t2b');

  const navigate = useNavigate();

  const handleSearch = () => {
    if (!searchTerm) {
      toast.error('Please enter a search term.');
      return;
    }
    navigate(`/search?q=${searchTerm}&view=${searchType}`);
  };


  // const { data: exampleBedMetadata } = useExampleBed(); # if example will be dynamic again
  const {data: exampleBedSetMetadata} = useExampleBedSet();
  const {data: bedbaseStats} = useStats();
  // const apiDocsUrl = import.meta.env.VITE_API_BASE;

  return (
    <Layout footer title="BEDbase" fullHeight>
      <div className="d-flex flex-column w-100 align-items-center p-2">
        <div className="d-flex flex-column justify-content-center text-center" style={{minHeight: '80vh'}}>
          <motion.h1
            className="fw-bolder text-primary text-6xl mb-4"
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6}}
          >
            BEDbase
          </motion.h1>
          <motion.h3
            className="text-secondary text-3xl mt-2 mb-3"
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.1}}
          >
            Find, analyze, and understand genomic region data - all in one place
          </motion.h3>

          <div className="my-2"></div>
          <motion.div
            className="col-12 d-flex gap-2 mx-auto"
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.2}}
          >
            <div className="input-group bg-white">
              {searchType === 'b2b' ? (
                <input
                  key="file-input"
                  className="form-control border fs-5"
                  type="file"
                  accept=".bed,.gz,application/gzip,application/x-gzip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      navigate(`/search?view=b2b`, {state: {file: file}});
                    }
                  }}
                />
              ) : (
                <input
                  key="text-input"
                  className="form-control border fs-5"
                  type="text"
                  placeholder={searchType === 't2b' ? 'Search for BED files' : 'Search for BEDsets'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              )}

              <select
                className="form-select"
                style={{maxWidth: '159px'}}
                aria-label="search type selector"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="t2b">Text-to-BED</option>
                <option value="b2b">BED-to-BED</option>
                <option value="t2bs">Text-to-BEDset</option>
              </select>
            </div>
            <button className="btn btn-primary" type="button" onClick={handleSearch}>
              <i className="bi bi-search"/>
            </button>
          </motion.div>
          <motion.div
            className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-1 mt-2 mb-5"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.6, delay: 0.3}}
          >
            <span>Or, explore an <a href={`/bed/dcc005e8761ad5599545cc538f6a2a4d`}>example BED file</a></span>
            <span>or an{' '} <a href={`/bedset/${exampleBedSetMetadata?.id || 'not-found'}`}>example BEDset</a></span>
          </motion.div>

          <div className="my-4"></div>
          <motion.div
            className='d-flex flex-row gap-4 justify-content-center mb-5 pb-2 text-muted'
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.6, delay: 0.4}}
          >
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
              <i className='bi bi-reply-fill ms-1' style={{transform: 'scale(-1, 1)', display: 'inline-block'}}></i>
            </a>
          </motion.div>
        </div>

        <div className="my-2 w-100">
          <Row className="w-100 align-items-center py-4">
            <Col xs={12} md={6} className="mb-4 mb-md-0">
              <h3 className="fw-bold">Download and cache your data locally</h3>
              <p className="text-balance pe-md-4">
                Use the BEDbase clients to access BED files and BED sets programmatically.
                The clients handle downloading and caching, enabling efficient reuse of genomic region
                data without manual API calls and redundancy.
                Available in Python: {' '}
                <a href="https://pypi.org/project/geniml/" className="bi bi-box-fill">
                  {' '}
                  geniml
                </a>
                , Rust: {' '}
                <a href="https://crates.io/crates/gtars" className="bi bi-box-fill">
                  {' '}
                  gtars
                </a>
                , and R: {' '}
                <a href="https://github.com/waldronlab/bedbaser" className="bi bi-github">
                  {' '}
                  BEDbaser
                </a>
                .
              </p>
            </Col>
            <Col xs={12} md={6} className="d-flex flex-column align-items-center justify-content-center h-100 ps-md-4">
              <div
                className="border border-2 border-dark p-2 rounded w-100 position-relative landing-code-snippet-container">
                <Tab.Container id="code-snippets-client" defaultActiveKey={BBCONF_SNIPPETS[0].language}>
                  <div className="d-flex flex-row align-items-center text-sm">
                    <Nav variant="pills" className="flex-row">
                      {BBCONF_SNIPPETS.map((snippet) => (
                        <Nav.Item key={snippet.language}>
                          <Nav.Link className="py-1 px-2 mx-1" eventKey={snippet.language}>
                            {snippet.language}
                          </Nav.Link>
                        </Nav.Item>
                      ))}
                    </Nav>
                  </div>
                  <Tab.Content className="w-100 h-100">
                    {BBCONF_SNIPPETS.map((snippet) => (
                      <Tab.Pane key={snippet.language} eventKey={snippet.language}>
                        <Markdown className="h-100 mt-3" rehypePlugins={[rehypeHighlight]}>
                          {snippet.code}
                        </Markdown>
                        <div className="position-absolute top-0 end-0 me-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(snippet.raw);
                              setCopied(true);
                              setTimeout(() => {
                                setCopied(false);
                              }, 2000);
                            }}
                            className="btn btn-outline-primary btn-sm mt-2"
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </Tab.Pane>
                    ))}
                  </Tab.Content>
                </Tab.Container>
              </div>
            </Col>
          </Row>

          <Row className="w-100 align-items-center py-4">
            <Col xs={12} md={6} className="order-2 order-md-1 pe-md-4">
              <div className="d-flex flex-row align-items-center width-100 justify-content-center h-100 gap-1">
                <input
                  value={searchTermSmall}
                  onChange={(e) => setSearchTermSmall(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (searchTermSmall.length === 0) {
                        return;
                      }
                      navigate(`/search?q=${searchTermSmall}`);
                    }
                  }}
                  className="p-2 rounded border w-100 shadow-sm"
                />
                <button
                  onClick={() => {
                    if (searchTermSmall.length === 0) {
                      return;
                    }
                    navigate(`/search?q=${searchTermSmall}&view=t2b`);
                  }}
                  className="btn btn-primary btn-lg"
                >
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </Col>
            <Col xs={12} md={6} className="order-1 order-md-2 mb-4 mb-md-0 ps-md-4">
              <h3 className="fw-bold">Search for BED Files</h3>
              <p className="text-balance">
                BEDbase indexes genomic intervals directly, enabling similarity-based search grounded in the actual
                content of BED files rather than unstructured or inconsistent user-provided metadata.
                Users can search by submitting a query string or by uploading a BED file, allowing precise
                and reproducible discovery of relevant genomic region datasets.
              </p>
            </Col>
          </Row>

          <Row className="w-100 align-items-center py-4">
            <Col xs={12} md={6} className="mb-4 mb-md-0">
              <h3 className="fw-bold">Visualize BED file similarity</h3>
              <p className="text-balance pe-md-4">
                Explore BED file similarity using an interactive UMAP of hg38-based embeddings.
                Compare existing BEDbase data and upload your own BED file to see how
                it relates to other genomic region sets in embedding space.
              </p>
            </Col>
            <Col xs={12} md={6} className="d-flex justify-content-center ps-md-4">
              <a href="/umap">
                <Image src="/visualizer.svg" alt="UMAP visualization" height="400px"
                       className="mb-0 mx-auto d-block img-fluid"/>
              </a>
            </Col>
          </Row>

          <Row className="w-100 align-items-center py-4">
            <Col xs={12} md={6} className="order-2 order-md-1 d-flex justify-content-center">
              <a href="/analyze">
                <Image src="/bed_analyzer.svg" alt="BED analyzer" height="300px"
                       className="mb-0 mx-auto d-block img-fluid"/>
              </a>
            </Col>
            <Col xs={12} md={6} className="order-1 order-md-2 mb-4 mb-md-0 ps-md-4">
              <h3 className="fw-bold">Analyze your BED files</h3>
              <p className="text-balance">
                Upload a BED file or provide a URL to quickly explore its contents.
                The BED Analyzer generates key statistics, summary tables, and visualizations,
                giving you an immediate overview of region counts, lengths, genome coverage,
                and other essential properties.
              </p>
            </Col>
          </Row>
        </div>
      </div>
    </Layout>
  );
};

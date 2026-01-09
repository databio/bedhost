import { useState } from 'react';
import { Layout } from '../components/layout';
import { useNavigate } from 'react-router-dom';
import { InPaths, OutPaths } from '../motions/landing-animations';
import { Col, Image, Nav, Row, Tab } from 'react-bootstrap';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { CODE_SNIPPETS } from '../const';
import { BBCONF_SNIPPETS } from '../const';
// import { useExampleBed } from '../queries/useExampleBed';
import toast from 'react-hot-toast';
import { useExampleBedSet } from '../queries/useExampleBedSet';
import { useStats } from '../queries/useStats.ts';
import { motion } from 'framer-motion';

// type FileBadgeProps = {
//   children?: React.ReactNode;
// };

// const FileBadge = (props: FileBadgeProps) => {
//   const { children } = props;
//   return <div className="w-100 py-1 px-3 text-center rounded-pill border border-dark bg-light">{children}</div>;
// };

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
  const { data: exampleBedSetMetadata } = useExampleBedSet();
  const { data: bedbaseStats } = useStats();

  return (
    <Layout footer title="BEDbase" fullHeight>
      <div className="d-flex flex-column w-100 align-items-center p-2">
        <div className="my-5"></div>
        {/*<div className="d-flex flex-row align-items-center mt-5 gap-2 mb-2 mb-4">*/}
        {/*  <a href="https://github.com/databio/bedhost">*/}
        {/*    <span className="badge bg-primary text-sm bg-opacity-10 text-primary border border-primary">*/}
        {/*      <i className="bi bi-github me-2" />*/}
        {/*      GitHub*/}
        {/*    </span>*/}
        {/*  </a>*/}
        {/*  <a href="https://docs.bedbase.org">*/}
        {/*    <span className="badge bg-primary text-sm bg-opacity-10 text-primary border border-primary">*/}
        {/*      <i className="bi bi-file-earmark-text-fill me-2" />*/}
        {/*      Documentation*/}
        {/*    </span>*/}
        {/*  </a>*/}
        {/*</div>*/}
        <h1 className="fw-bolder text-primary text-6xl mb-4">BEDbase</h1>
        <h3 className="text-primary text-2xl mt-2 mb-0">Find, analyze, and understand genomic region data - all in one
          place</h3>

        <div className="my-2"></div>
        <div className="col-12 col-lg-9">
          <p className="text-md-center text-base mb-5">
            BEDbase is a unified platform for searching, analyzing, visualizing and serving genomic region data.
            BEDbase redefines the way to manage genomic region data and allows users to search for BED files of
            interest, visualize them, and create
            collections tailored to research needs. Users can explore
            comprehensive descriptions of specific BED files via a user-oriented web interface and programmatically
            interact with the data via an OpenAPI-compatible API.
          </p>
        </div>
        <div className="col-12 col-lg-9 d-flex gap-2">
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
                    navigate(`/search?view=b2b`, { state: { file: file } });
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
              style={{ maxWidth: '159px' }}
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
            <i className="bi bi-search" />
          </button>
        </div>
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-1 mt-2 mb-0">
          <span>Or, explore an <a href={`/bed/dcc005e8761ad5599545cc538f6a2a4d`}>example BED file</a></span>
          <span>or an{' '} <a href={`/bedset/${exampleBedSetMetadata?.id || 'not-found'}`}>example BEDset</a></span>
        </div>

        <div
          className="d-flex flex-row w-100 landing-animation-container hidden large-flex justify-content-center my-1">
          <div className="d-flex flex-column align-items-center justify-content-center gap-3 px-2">
            {/*Added everywhere motion div for better visualization */}
            <motion.div
              className="d=flex flex-column"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a href="/search" className="text-decoration-none text-dark">
                <p className="mb-0 fw-bold text-center">Search</p>
                <div className="p-1">
                  <Image src="/search.svg" alt="Search icon" width="75px" className="ms-2" />
                </div>
              </a>
            </motion.div>
            <motion.div
              className="d=flex flex-column"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <a href="/analyze" className="text-decoration-none text-dark">
                <p className="mb-0 fw-bold text-center">Analyzer</p>
                <div className="p-1">
                  <Image src="/analyzer_icon.svg" alt="Analyzer icon" height="70px" className="ms-2" />
                </div>
              </a>
            </motion.div>
            <motion.div
              className="d=flex flex-column"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <a href="https://docs.bedbase.org/bedbase/" className="text-decoration-none text-dark">
                <p className="mb-0 fw-bold text-center">API and Clients</p>
                <div className="p-1">
                  <Image src="/api_icon.svg" alt="API icon" height="75px" className="ms-2" />
                </div>
              </a>
            </motion.div>
          </div>
          <InPaths />
          <motion.div
            className="d-flex flex column h-100 align-items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="p-2 border border-primary rounded rounded border-2 landing-main-logo-shadow">
              <Image src="/bedbase_icon.svg" alt="BEDbase logo" height="100px" className="landing-animation-logo" />
            </div>
          </motion.div>
          <OutPaths />
          <div className="d-flex flex-column align-items-center justify-content-center gap-3 px-2">
            <motion.div
              className="d=flex flex-column"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a href="/bed/dcc005e8761ad5599545cc538f6a2a4d" className="text-decoration-none text-dark">
                <p className="mb-0 fw-bold text-center">Statistics</p>
                <div className="p-1">
                  <Image src="/stats_icon.svg" alt="Statistics icon" width="75px" className="ms-2" />
                </div>
              </a>
            </motion.div>
            <motion.div
              className="d=flex flex-column"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <a href="/search?view=t2bs" className="text-decoration-none text-dark">
                <p className="mb-0 fw-bold text-center">BED sets</p>
                <div className="p-1">
                  <Image src="/bedset.svg" alt="Statistics icon" height="70px" className="ms-2" />
                </div>
              </a>
            </motion.div>
            <motion.div
              className="d=flex flex-column"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <a href="/umap" className="text-decoration-none text-dark">
                <p className="mb-0 fw-bold text-center">Embeddings</p>
                <div className="p-1">
                  <Image src="/embeddings.svg" alt="Statistics icon" height="75px" className="ms-2" />
                </div>
              </a>
            </motion.div>
          </div>
        </div>
        <div className="my-2 w-100">
          <Row className="w-100 align-items-center mb-5">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">Web Server and API</h2>
              <p className="text-balance pe-4">
                The BEDbase web server and API are designed to provide a user-friendly interface for exploring and
                working with genomic region data. The web server allows users to search for BED files and BED sets, view
                detailed information about specific files, and create collections of files.
              </p>
            </Col>
            <Col sm={6} md={6} className="d-flex flex-column align-items-center justify-content-center h-100">
              <div
                className="border border-2 border-dark p-2 rounded w-100 position-relative landing-code-snippet-container">
                <Tab.Container id="code-snippets" defaultActiveKey={CODE_SNIPPETS[0].language}>
                  <div className="d-flex flex-row align-items-center text-sm">
                    <Nav variant="pills" className="flex-row">
                      {CODE_SNIPPETS.map((snippet) => (
                        <Nav.Item key={snippet.language}>
                          <Nav.Link className="py-1 px-2 mx-1" eventKey={snippet.language}>
                            {snippet.language}
                          </Nav.Link>
                        </Nav.Item>
                      ))}
                    </Nav>
                  </div>
                  <Tab.Content className="w-100 h-100">
                    {CODE_SNIPPETS.map((snippet) => (
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
          <Row className="w-100 align-items-center mb-3">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">BED Embedding Visualization</h2>
              <p className="text-balance pe-4">
                BEDbase provides visualization of UMAP of hg38 BED embeddings. It allows users to explore the
                similarity of genomic regions based on their embeddings, and
                providing insights into the relationships between different BED files.
                The visualization is available on the <a href="/umap">UMAP visualization</a>.
              </p>
            </Col>
            <Col>
              <a href="/umap">
                <Image src="/bed_umap.svg" alt="UMAP visualization" height="400px"
                       className="mb-0 mx-auto d-block img-fluid" />
              </a>
            </Col>
          </Row>
          <Row className="w-100 mb-5">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">Search for BED Files</h2>
              <p className="text-balance pe-4">
                BEDbase offers three search endpoints for discovering BED files and BEDsets, distinguishing itself from
                other platforms by utilizing vector search to index and search through bed file regions. This approach
                enhances search accuracy and efficiency compared to platforms relying on unstructured user-provided
                metadata, which can be ambiguous and less reliable. User can search for BED files by providing a query
                string, or a BED file.
              </p>
            </Col>
            <Col sm={6} md={6}>
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
          </Row>
          {/* <div className="my-5"></div> */}
          <Row className="w-100 align-items-center mb-5 mb-md-2">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">BEDbase Client </h2>
              <p className="text-balance pe-4">
                BEDbase provides a Python an R client for interacting with the BEDbase API. The client allows users to
                download, cache, and analyze BED files and BED sets programmatically, without the need to interact with
                the native API. BBclient is available on PyPI in geniml package with other useful tools for genomic data
                analysis. Python Geniml package:{' '}
                <a href="https://pypi.org/project/geniml/" className="bi bi-box-fill">
                  {' '}
                  PyPI geniml
                </a>
                .
                R package:{' '}
                <a href="https://github.com/waldronlab/bedbaser" className="bi bi-github">
                  {' '}
                  BEDbaser
                </a>
                .
              </p>
            </Col>

            <Col sm={6} md={6} className="d-flex flex-column align-items-center justify-content-center h-100 mb-5">
              <div
                className="border border-2 border-dark p-2 rounded w-100 position-relative landing-code-snippet-container">
                <Tab.Container id="code-snippets" defaultActiveKey={CODE_SNIPPETS[0].language}>
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
          <Row className="w-100 align-items-center mb-5">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">BED Analyzer</h2>
              <p className="text-balance pe-4">
                BEDbase includes an interactive BED Analyzer that lets you quickly explore any BED file.
                You can upload your own file or provide a URL, and the analyzer will generate key
                statistics, summary tables, and visualizations. It gives you an instant overview of
                region counts, lengths, genome coverage, and other useful properties. Analyze your file: <a
                href="/analyze"> Analyzer</a>.
              </p>
            </Col>
            <Col>
              <a href="/analyze">
                <Image src="/bed_analyzer.svg" alt="BED analyzer" height="300px"
                       className="mb-3 mx-auto d-block img-fluid" />
              </a>
            </Col>
          </Row>
          <Row className="w-100 align-items-center">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">Data Availability Summary</h2>
              <p className="text-balance pe-4">
                Comprehensive metrics about BEDbase file statistics is available on the {' '}
                <a href={`/metrics`}>metrics page</a>.
              </p>
            </Col>
            <Col sm={6} md={6} className="d-flex flex-column align-items-center justify-content-center h-100">
              <div className="mt-0 mt-md-5 mb-5 w-100">
                <ul className="list-group w-100">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Number of bed files available:
                    <span
                      className="badge bg-primary rounded-pill">{(bedbaseStats?.bedfiles_number || 0).toLocaleString()}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Number of bed sets available:
                    <span
                      className="badge bg-success rounded-pill">{(bedbaseStats?.bedsets_number || 0).toLocaleString()}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Number of genomes available:
                    <span
                      className="badge bg-info rounded-pill">{(bedbaseStats?.genomes_number || 0).toLocaleString()}</span>
                  </li>
                </ul>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </Layout>
  );
};

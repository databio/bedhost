import { useState } from 'react';
import { Layout } from '../components/layout';
import { useNavigate } from 'react-router-dom';
import { InPaths, OutPaths } from '../motions/landing-animations';
import { Col, Image, Nav, Row, Tab } from 'react-bootstrap';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { CODE_SNIPPETS } from '../const';
import { BBCONF_SNIPPETS } from '../const';
import { useExampleBed } from '../queries/useExampleBed';
import { useExampleBedSet } from '../queries/useExampleBedSet';

type FileBadgeProps = {
  children?: React.ReactNode;
};

const FileBadge = (props: FileBadgeProps) => {
  const { children } = props;
  return <div className="w-100 py-1 px-3 text-center rounded-pill border border-dark bg-light">{children}</div>;
};

export const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermSmall, setSearchTermSmall] = useState('Kidney cancer in humans');
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();

  const { data: exampleBedMetadata } = useExampleBed();
  const { data: exampleBedSetMetadata } = useExampleBedSet();

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
        <h1 className="fw-bolder text-primary text-6xl mb-4">Welcome to BEDbase</h1>
        <div className="my-3"></div>
        <div className="w-75">
          <p className="text-center text-base mb-4">
            BEDbase is a unified platform for aggregating, analyzing, and serving genomic region data. BEDbase redefines
            the way to manage genomic region data and allows users to search for BED files of interest and create
            collections tailored to research needs. BEDbase is composed of a web server and an API. Users can explore
            comprehensive descriptions of specific BED files via a user-oriented web interface and programmatically
            interact with the data via an OpenAPI-compatible API.
          </p>
        </div>
        <div className="d-flex flex-row align-items-center w-75 gap-1">
          <input
              className="form-control form-control-lg"
              type="text"
              placeholder="Start searching for BED files"
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
          <button
              className="btn btn-primary btn-lg"
              onClick={() => {
                if (searchTerm.length === 0) {
                  return;
                }
                navigate(`/search?q=${searchTerm}&view=t2b`);
              }}
          >
            <span className="d-flex align-items-center">
              <i className="bi bi-search me-1"></i>
              Search
            </span>
          </button>
        </div>
        <div className="d-flex flex-row align-items-center justify-content-center gap-2 my-3">
          Or, explore an <a href={`/bed/${exampleBedMetadata?.id || 'not-found'}`}>example BED file</a> or a{' '}
          <a href={`/bedset/${exampleBedSetMetadata?.id || 'not-found'}`}>example BED set</a>
        </div>
        <div className="flex-row w-100 landing-animation-container hidden large-flex">
          <div
              className="d-flex flex-column align-items-center justify-content-center gap-3 px-2 text-center"
              style={{width: '23%'}}
          >
            <FileBadge>
              <a
                  href="https://genome.ucsc.edu/FAQ/FAQformat.html#format1"
                  className="fw-bold text-sm text-decoration-none"
              >
                Bed files
              </a>
              <Image src="/bed.svg" alt="BED file icon" height="30px" className="ms-2"/>
            </FileBadge>
            <FileBadge>
              <a
                  href="https://genome.ucsc.edu/goldenPath/help/bigBed.html"
                  className="fw-bold text-sm text-decoration-none"
              >
                {' '}
                BigBed files
              </a>
              <Image src="/bigbed.svg" alt="BigBed file icon" height="30px" className="ms-2"/>
            </FileBadge>
            <FileBadge>
              <a
                  href="https://genome.ucsc.edu/goldenPath/help/wiggle.html"
                  className="fw-bold text-sm text-decoration-none"
              >
                Wig files
              </a>
              <Image src="/wig.svg" alt="Wiggle file icon" height="30px" className="ms-2"/>
            </FileBadge>
            <FileBadge>
              <a
                  href="https://genome.ucsc.edu/goldenPath/help/bigWig.html"
                  className="fw-bold text-sm text-decoration-none"
              >
                BigWig files
              </a>
              <Image src="/big_wig.svg" alt="BigWig file icon" height="30px" className="ms-2"/>
            </FileBadge>
            <FileBadge>
              <a
                  href="https://genome.ucsc.edu/goldenPath/help/bedgraph.html"
                  className="fw-bold text-sm text-decoration-none"
              >
                BedGraph files
              </a>
              <Image src="/bdg.svg" alt="BDG file icon" height="30px" className="ms-2"/>
            </FileBadge>
          </div>
          <InPaths/>
          <div className="d-flex flex column h-100 align-items-center">
            <div className="p-2 border border-primary rounded rounded border-2 landing-main-logo-shadow">
              <Image src="/bedbase_icon.svg" alt="BEDbase logo" height="125px" className="landing-animation-logo"/>
            </div>
          </div>
          <OutPaths/>
          <div className="d-flex flex-column align-items-center justify-content-center gap-3 px-2">
            <div className="d=flex flex-column">
              <p className="mb-0 fw-bold text-center">Statistics</p>
              <div className="border border-dark rounded p-1 shadow">
                <Image src="/stats.svg" alt="Statistics icon" width="100px" className="ms-2"/>
              </div>
            </div>
            <div className="d=flex flex-column">
              <p className="mb-0 fw-bold text-center">BED sets</p>
              <div className="border border-dark rounded p-1 shadow">
                <Image src="/bedset.svg" alt="Statistics icon" height="90px" className="ms-2"/>
              </div>
            </div>
            <div className="d=flex flex-column">
              <p className="mb-0 fw-bold text-center">Embeddings</p>
              <div className="border border-dark rounded p-1 shadow">
                <Image src="/embeddings.svg" alt="Statistics icon" height="100px" className="ms-2"/>
              </div>
            </div>
          </div>
        </div>
        <div className="my-2 w-100">
          <Row className="w-100 align-items-center mb-5">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">Web server and API</h2>
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
          <Row className="w-100 mb-5">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">Search for BED files</h2>
              <p className="text-balance pe-4">
                BEDbase offers three search endpoints for discovering BED files and BEDsets, distinguishing itself from
                other platforms by utilizing Elasticsearch to index and search through bed file regions. This approach
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
          <Row className="w-100 align-items-center">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">BEDbase client </h2>
              <p className="text-balance pe-4">
                BEDbase provides a Python an R client for interacting with the BEDbase API. The client allows users to
                download, cache, and analyze BED files and BED sets programmatically, without the need to interact with
                the native API. BBclient is available on PyPI in geniml package with other useful tools for genomic data
                analysis. Geniml package:{' '}
                <a href="https://pypi.org/project/geniml/" className="bi bi-box-fill">
                  {' '}
                  PyPI geniml
                </a>
                .
              </p>
            </Col>

            <Col sm={6} md={6} className="d-flex flex-column align-items-center justify-content-center h-100">
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
        </div>
      </div>
    </Layout>
  );
};

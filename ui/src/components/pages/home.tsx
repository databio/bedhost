import { useState } from 'react';
import { Layout } from '../layout';
import { useNavigate } from 'react-router-dom';
import { useBedbaseStats } from '../../queries/useBedbaseStats';

const LoadingBar = () => {
  return <div className="animate-pulse w-100 p-1 bg-secondary bg-opacity-25"></div>;
};

export const Home = () => {
  const { isFetching: bedbaseStatsLoading, data: bedbaseStats } = useBedbaseStats();

  const bedCount = bedbaseStats?.bedfiles_number || 0;
  const bedsetCount = bedbaseStats?.bedsets_number || 0;
  const genomes = bedbaseStats?.genomes_number || 0;

  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  return (
    <Layout footer title="BEDbase">
      <div className="h80 mt-2">
        <div className="d-flex flex-column h-100 align-items-center justify-content-center">
          <div className="d-flex flex-row justify-content-start w-100">
            <h1 className="fw-bolder text-primary">Welcome to BEDbase</h1>
          </div>
          <div className="d-flex flex-row align-items-center w-100 gap-1">
            <input
              type="text"
              className="form-control border-dark shadow-sm p-2"
              placeholder="Search for bedfiles"
              aria-label="Search for bedfiles"
              aria-describedby="button-addon2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/search?q=${searchTerm}`);
                }
              }}
            />
            <button
              className="btn btn-primary py-2"
              type="button"
              id="button-addon2"
              onClick={() => navigate(`/search?q=${searchTerm}`)}
            >
              <i className="bi bi-search"></i>
            </button>
          </div>
          <div className="row align-items-center mt-5">
            <div className="col-lg-6 col-sm-12">
              <p>
                BEDbase is a unified platform for aggregating, analyzing, and serving genomic region data. BEDbase
                redefines the way to manage genomic region data and allows users to search for BED files of interest and
                create collections tailored to research needs. BEDbase is composed of a web server and an API. Users can
                explore comprehensive descriptions of specific BED files via a user-oriented web interface and
                programmatically interact with the data via an OpenAPI-compatible API.
              </p>
              <br />
              <p>
                Start searching for bedfiles, or{' '}
                <a href="/bed/bbad85f21962bb8d972444f7f9a3a932">check out an example</a>
              </p>
              <div className="d-flex flex-row align-items-center flex-wrap">
                <button className="btn btn btn-primary btn-lg me-3">
                  <i className="bi bi-search"></i> Search for bedfiles
                </button>
                <a href="https://github.com/databio/bedhost">
                  <button className="btn btn-outline-primary btn-lg me-3">
                    <i className="bi bi-github me-1"></i>GitHub
                  </button>
                </a>
              </div>
            </div>
            <div className="col-lg-6 col-sm-12 align-items-center">
              <h2 className="fw-bolder text-center text-primary w-100">Currently hosting</h2>
              <div className="d-flex flex-row align-items-center justify-content-center mt-5 w-100 gap-2">
                <div className="w-25 text-center">
                  <h1 className="fw-bold text-primary">{bedbaseStatsLoading ? <LoadingBar /> : bedCount}</h1>
                  <p className="fw-light">BED files</p>
                </div>
                <div className="w-25 text-center">
                  <h1 className="fw-bold text-primary">{bedbaseStatsLoading ? <LoadingBar /> : bedsetCount}</h1>
                  <p className="fw-light">Bedsets</p>
                </div>
                <div className="w-25 text-center">
                  <h1 className="fw-bold text-primary">{bedbaseStatsLoading ? <LoadingBar /> : genomes}</h1>
                  <p className="fw-light">Genomes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

import { components } from '../../../bedbase-types';
import { Col, Row } from 'react-bootstrap';
import { SearchBar } from './search-bar';
import { SearchResultsTable } from './search-results-table';

type Props = {
  isSearching: boolean;
  searchTerm: string;
  offset: number;
  limit: number;
  refetch: () => void;
  setOffset: (value: number) => void;
  setSearchTerm: (value: string) => void;
  data: components['schemas']['BedListSearchResult'] | undefined;
};

export const Text2Bed = (props: Props) => {
  const { isSearching, searchTerm, offset, limit, setSearchTerm, setOffset, refetch, data } = props;
  return (
    <div className="my-2">
      <Row>
        <Col sm={12} md={12}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} onSearch={() => refetch()} />
        </Col>
      </Row>
      <div>
        {isSearching ? (
          <div className="mt-5 pt-5 d-flex flex-column align-items-center">
            <img src="/bedbase_icon.svg" alt="loading" width="60px" className="animate-bounce" />
            <p className="fst-italic text-sm text-center">Searching...</p>
          </div>
        ) : (
          <div className="my-2">
            {data ? (
              <div className="p-2 border rounded shadow-sm">
                <SearchResultsTable results={data || []} />{' '}
                <div className="d-flex flex-row align-items-center justify-content-center gap-1">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      setOffset(offset - limit);
                      refetch();
                    }}
                    disabled={offset === 0}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      setOffset(offset + limit);
                      refetch();
                    }}
                    disabled={data.count < limit}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center mt-5 fst-italic">
                Try seaching for some BED files!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

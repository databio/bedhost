/* eslint-disable react-hooks/exhaustive-deps */
import { Col, Row } from 'react-bootstrap';
import { SearchBar } from '../search-bar';
import { Text2BedSearchResultsTable } from './t2b-search-results-table';
import { SearchingJumper } from '../searching-jumper';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useText2BedSearch } from '../../../queries/useText2BedSearch';
import { TableToolbar } from '../table-toolbar';
import { PaginationBar } from '../pagination-bar';
import { SearchError } from '../search-error';
import { AxiosError } from 'axios';
import { BEDEmbeddingPlot, BEDEmbeddingPlotRef } from '../../../components/umap/bed-embedding-plot.tsx';

export const Text2Bed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [genome, setGenome] = useState(searchParams.get('genome') || '');
  const [assay, setAssay] = useState(searchParams.get('assay') || '');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [containerHeight, setContainerHeight] = useState(660);
  const embeddingPlotRef = useRef<BEDEmbeddingPlotRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isFetching: isSearching,
    data: results,
    error,
    refetch: onSearch,
  } = useText2BedSearch({
    q: searchTerm,
    genome: genome,
    assay: assay,
    limit: limit, // TODO: make this a variable
    offset: offset,
    autoRun: false,
  });

  console.log(results)

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (genome) params.set('genome', genome);
    if (assay) params.set('assay', assay);
    setSearchParams(params);
  }, [searchTerm, genome, assay]);

  useEffect(() => {
    if (searchTerm || genome || assay) {
      onSearch();
    }
  }, [limit, offset, genome, assay, onSearch]);

  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top; // 40px margin from bottom
        setContainerHeight(Math.max(400, Math.min(availableHeight, 800))); // min 400px, max 800px
      }
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  if (error) {
    if (error) {
      return <SearchError title="BEDbase | Search" error={error as AxiosError} />;
    }
  }

  return (
    <div className="my-2">
      <Row>
        <Col sm={12} md={12}>
          <SearchBar
            limit={limit}
            setLimit={setLimit}
            value={searchTerm}
            onChange={setSearchTerm}
            genome={genome}
            setGenome={setGenome}
            assay={assay}
            setAssay={setAssay}
            onSearch={() => {
              setOffset(0);
              setTimeout(() => {
                onSearch();
              }, 100);
            }}
          />
        </Col>
      </Row>
      <div>
        {isSearching ? (
          <SearchingJumper />
        ) : (
          <div className="my-2" ref={containerRef}>
            {results ? (
              <div className='row gx-2'>
                <div className='col-6' style={{height: `${containerHeight}px`}}>
                  <div className='d-flex border rounded overflow-hidden'>
                    <BEDEmbeddingPlot
                      ref={embeddingPlotRef}
                      bedIds={results?.results?.map((result: any) => result.id)}
                      height={containerHeight}
                    />
                  </div>
                </div>
                <div className='col-6 d-flex flex-column overflow-hidden' style={{height: `${containerHeight}px`}}>
                  <div className="overflow-y-auto overflow-x-hidden flex-grow-1">
                    <TableToolbar limit={limit} setLimit={setLimit} total={results.count} />
                    <Text2BedSearchResultsTable
                      results={results || []}
                      search_query={searchTerm}
                      onCardClick={(bedId) => {
                        embeddingPlotRef.current?.centerOnBedId(bedId);
                      }}
                    />{' '}
                    <PaginationBar limit={limit} offset={offset} setOffset={setOffset} total={results.count} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center mt-5 fst-italic">
                Try searching for some BED files! e.g. K562
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

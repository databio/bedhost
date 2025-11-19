import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';

import { SearchSelector } from '../components/search/search-selector';
import { SearchBar } from '../components/search/bed2bed/search-bar.tsx';
import { Text2Bed } from '../components/search/text2bed/text2bed';
import { Bed2Bed } from '../components/search/bed2bed/bed2bed';
import { Text2BedSet } from '../components/search/text2bedset';
import { Layout } from '../components/layout';
import { SearchViewProvider } from '../contexts/search-view-context.tsx';
import { useBedUmap } from '../queries/useBedUmap.ts';
import { BEDEmbeddingPlotRef } from '../components/umap/bed-embedding-plot.tsx';

type SearchView = 't2b' | 'b2b' | 't2bs';

export const SearchPage = () => {
  const location = useLocation();
  const embeddingPlotRef = useRef<BEDEmbeddingPlotRef>(null);
  const uploadedFile = location.state?.file as File | undefined;

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchView, setSearchView] = useState<SearchView>((searchParams.get('view') as SearchView) || 't2b');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [genome, setGenome] = useState(searchParams.get('genome') || '');
  const [assay, setAssay] = useState(searchParams.get('assay') || '');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [layout, setLayout] = useState('split');
  const [triggerSearch, setTriggerSearch] = useState(0);
  const [file, setFile] = useState<File | null>(uploadedFile || null);
  const [customCoordinates, setCustomCoordinates] = useState<number[] | null>(null);

  const { mutateAsync: getUmapCoordinates } = useBedUmap();

  const handleSearch = () => {
    setOffset(0);
    setTriggerSearch(prev => prev + 1);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchView) params.set('view', searchView);
    if (searchView !== 'b2b') {
      if (searchTerm) params.set('q', searchTerm);
    }
    if (searchView === 't2b') {
      if (genome) params.set('genome', genome);
      if (assay) params.set('assay', assay);
    }
    setSearchParams(params);
  }, [searchTerm, genome, assay, searchView, setSearchParams]);

  useEffect(() => {
    if (!file) return;
    (async () => {
      const coordinates = await getUmapCoordinates(file);
      setCustomCoordinates(coordinates);
    })();
  }, [file])

  return (
    <Layout title='BEDbase | Search' footer fullHeight>
      <SearchViewProvider searchView={searchView}>
        <SearchSelector
          view={searchView}
          setView={(view) => {
            setSearchView(view);
          }}
          setOffset={setOffset}
        />
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          genome={genome}
          setGenome={setGenome}
          assay={assay}
          setAssay={setAssay}
          limit={limit}
          setLimit={setLimit}
          layout={layout}
          setLayout={setLayout}
          onSearch={handleSearch}
          file={file}
          setFile={setFile}
          embeddingPlotRef={embeddingPlotRef}
        />
        {searchView === 't2b' ? (
          <Text2Bed
            searchTerm={searchTerm}
            genome={genome}
            assay={assay}
            limit={limit}
            offset={offset}
            setOffset={setOffset}
            layout={layout}
            triggerSearch={triggerSearch}
          />
        ) : searchView === 'b2b' ? (
          <Bed2Bed
            limit={limit}
            offset={offset}
            setOffset={setOffset}
            layout={layout}
            file={file}
            customCoordinates={customCoordinates}
            embeddingPlotRef={embeddingPlotRef}
          />
        ) : searchView === 't2bs' ? (
          <Text2BedSet
            searchTerm={searchTerm}
            limit={limit}
            setLimit={setLimit}
            offset={offset}
            setOffset={setOffset}
            triggerSearch={triggerSearch}
          />
        ) : (
          <div>Unknown searchView selected.</div>
        )}
      </SearchViewProvider>
    </Layout>
  );
};

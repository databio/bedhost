import { Layout } from '../components/layout';

import { useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';

import { SearchSelector } from '../components/search/search-selector';
import { Text2Bed } from '../components/search/text2bed/text2bed';
import { Bed2Bed } from '../components/search/bed2bed/bed2bed';
import { Text2BedSet } from '../components/search/text2bedset';

import { SearchViewProvider } from '../contexts/search-view-context.tsx';

type SearchView = 't2b' | 'b2b' | 't2bs';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [searchView, setSearchView] = useState<SearchView>((searchParams.get('view') as SearchView) || 't2b');

  const uploadedFile = location.state?.file as File | undefined;

  return (
    <Layout title="BEDbase | Search" footer fullHeight>
      <SearchViewProvider searchView={searchView}>
        <SearchSelector
          view={searchView}
          setView={(view) => {
            setSearchView(view);
          }}
        />
        {searchView === 't2b' ? (
          <Text2Bed />
        ) : searchView === 'b2b' ? (
          <Bed2Bed uploadedFile={uploadedFile} />
        ) : searchView === 't2bs' ? (
          <Text2BedSet />
        ) : (
          <div>Unknown searchView selected.</div>
        )}
      </SearchViewProvider>
    </Layout>
  );
};

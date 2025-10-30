import { Layout } from '../components/layout';

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { SearchSelector } from '../components/search/search-selector';
import { Text2Bed } from '../components/search/text2bed/text2bed';
import { Bed2Bed } from '../components/search/bed2bed/bed2bed';
import { Text2BedSet } from '../components/search/text2bedset';
import { BEDAtlas } from '../components/search/bed-atlas.tsx';

import { SearchViewProvider } from '../contexts/search-view-context.tsx';

type SearchView = 't2b' | 'b2b' | 't2bs' | 'embedding';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchView, setSearchView] = useState<SearchView>((searchParams.get('view') as SearchView) || 't2b');

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
          <Bed2Bed />
        ) : searchView === 't2bs' ? (
          <Text2BedSet />
        ) : searchView === 'embedding' ? (
          <BEDAtlas />
        ) : (
          <div>Unknown searchView selected.</div>
        )}
      </SearchViewProvider>
    </Layout>
  );
};

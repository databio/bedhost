import { Layout } from '../components/layout';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearch } from '../queries/useSearch';
import { ErrorPage } from '../components/common/error-page';

import { SearchSelector } from '../components/search/search-selector';
import { Text2Bed } from '../components/search/text2bed';
import { Bed2Bed } from '../components/search/bed2bed';

type SearchView = 't2b' | 'b2b' | 't2bs';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  // const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [searchView, setSearchView] = useState<SearchView>('t2b');

  const limit = 25;

  const {
    isFetching: isSearching,
    data: searchResults,
    error,
    refetch,
  } = useSearch({
    q: searchTerm,
    limit: limit, // TODO: make this a variable
    offset: offset,
    autoRun: false,
  });

  useEffect(() => {
    if (searchParams.get('q')) {
      refetch();
    }
  }, []);

  if (error) {
    return <ErrorPage title="BEDbase | Search" error={error} />;
  }

  return (
    <Layout title="BEDbase | Search" footer fullHeight>
      <SearchSelector
        view={searchView}
        setView={(view) => {
          setSearchView(view);
        }}
      />
      {searchView === 't2b' ? (
        <Text2Bed
          isSearching={isSearching}
          searchTerm={searchTerm}
          offset={offset}
          limit={limit}
          setSearchTerm={setSearchTerm}
          setOffset={setOffset}
          refetch={refetch}
          data={searchResults}
        />
      ) : searchView === 'b2b' ? (
        <Bed2Bed />
      ) : searchView === 't2bs' ? (
        <div>Render t2bs interface</div>
      ) : (
        <div>Unknown searchView selected.</div>
      )}
    </Layout>
  );
};

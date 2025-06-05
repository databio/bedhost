import React, { createContext, useContext } from 'react';

type ProviderProps = {
  children: React.ReactNode;
  searchView: string;
};

// @ts-expect-error - its fine to start with undefined
const SearchViewContext = createContext<{ searchView: string }>(undefined);

export const SearchViewProvider = ({ children, searchView }: ProviderProps) => {
  return (
    <SearchViewContext.Provider
      value={{ searchView }}
    >
      {children}
    </SearchViewContext.Provider>
  );
};

export const useSearchView = () => {
  const context = useContext(SearchViewContext);
  if (context === undefined) {
    throw new Error('useSearchView must be used within a SearchViewProvider');
  }
  return context;
};

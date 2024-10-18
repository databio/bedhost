import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';
import { components } from '../../bedbase-types';

type SearchResponse = components['schemas']['BedListSearchResult'];
type SearchQuery = {
  q: File | null;
  autoRun?: boolean;
};

export const useBed2BedSearch = (query: SearchQuery) => {
  const { api } = useBedbaseApi();
  const { q, autoRun } = query;

  let enabled = false;
  if (autoRun !== undefined && autoRun === true && !!q) {
    enabled = true;
  }

  // set hardcoded limit
  // because we want to do client-side pagination.
  // see: https://github.com/databio/bedhost/issues/146
  const limit = 100;

  return useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      if (!q) {
        return {
          count: 0,
          results: [],
        };
      }
      const formData = new FormData();

      formData.append('file', q);
      const { data } = await api.post<SearchResponse>(`/bed/search/bed?limit=${limit}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    enabled: enabled,
    staleTime: 0,
  });
};

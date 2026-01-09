import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';
import { components } from '../../bedbase-types';

type SearchResponse = components['schemas']['BedListSearchResult'];
type SearchQuery = {
  q: File | undefined;
  limit?: number;
  offset?: number;
  autoRun?: boolean;
};

export const useBed2BedSearchPaginate = (query: SearchQuery) => {
  const { api } = useBedbaseApi();
  const { q, limit, offset, autoRun } = query;
  let enabled = false;
  if (autoRun !== undefined && autoRun === true && !!q) {
    enabled = true;
  }

  return useQuery({
    queryKey: ['search', q, limit, offset],
    queryFn: async () => {
      if (!q) {
        return {
          count: 0,
          results: [],
        };
      }
      const formData = new FormData();
      formData.append('file', q);
      const { data } = await api.post<SearchResponse>(
        `/bed/search/bed?limit=${limit || 20}&offset=${offset || 0}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return data;
    },
    enabled: enabled,
    staleTime: 0,
  });
};

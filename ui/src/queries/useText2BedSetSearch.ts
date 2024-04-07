import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';
import { components } from '../../bedbase-types';

type SearchResponse = components['schemas']['BedListSearchResult'];
type SearchQuery = {
  q: string;
  limit?: number;
  offset?: number;
  autoRun?: boolean;
};

export const useText2BedSetSearch = (query: SearchQuery) => {
  const { api } = useBedbaseApi();
  const { q, limit, offset, autoRun } = query;
  let enabled = false;
  if (autoRun !== undefined && autoRun === true && !!q) {
    enabled = true;
  }

  return useQuery({
    queryKey: ['search', q, limit, offset],
    queryFn: async () => {
      const { data } = await api.get<SearchResponse>(`/bedset/list?query=${q}&limit=${limit}&offset=${offset}`);
      return data;
    },
    enabled: enabled,
    staleTime: 0,
  });
};

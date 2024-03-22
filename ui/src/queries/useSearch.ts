import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';
import { components } from '../../bedbase-types';

type SearchHit = {
  id: string;
  score: number;
  payload: {
    description: string;
  };
  metadata: components['schemas']['BedMetadata'];
};
export type SearchResponse = SearchHit[];

type SearchQuery = {
  q: string;
  limit?: number;
  offset?: number;
  autoRun?: boolean;
};

export const useSearch = (query: SearchQuery) => {
  const { api } = useBedbaseApi();
  const { q, limit, offset, autoRun } = query;
  let enabled = false;
  if (autoRun !== undefined && autoRun === true && !!q) {
    enabled = true;
  }
  return useQuery({
    queryKey: ['search', q, limit, offset],
    queryFn: async () => {
      const { data } = await api.get<SearchResponse>(`/search/bed/${q}?limit=${limit || 10}&offset=${offset || 0}`);
      return data;
    },
    enabled: enabled,
    staleTime: 0,
  });
};

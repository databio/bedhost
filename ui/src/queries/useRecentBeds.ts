import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';
import { components } from '../../bedbase-types';

type RecentBedsResponse = components['schemas']['BedListResult'];

type RecentBedsQuery = {
  limit?: number;
  offset?: number;
  genome?: string;
};

export const useRecentBeds = (query: RecentBedsQuery) => {
  const { api } = useBedbaseApi();
  const { limit, offset, genome } = query;

  return useQuery({
    queryKey: ['recent-beds', limit, offset, genome],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', String(limit ?? 25));
      params.set('offset', String(offset ?? 0));
      if (genome) {
        params.set('genome', genome);
      }
      const { data } = await api.get<RecentBedsResponse>(`/bed/recent?${params.toString()}`);
      return data;
    },
    staleTime: 0,
  });
};

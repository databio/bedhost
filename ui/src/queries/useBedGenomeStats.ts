import type { components } from '../../bedbase-types.d.ts';
import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';

type BedGenomeStatsResponse = components['schemas']['RefGenValidReturnModel'];

type BedGenomeStatsQuery = {
  md5?: string;
  autoRun?: boolean;
};

export const useBedGenomeStats = (query: BedGenomeStatsQuery) => {
  const { api } = useBedbaseApi();
  const { md5 } = query;

  return useQuery({
    queryKey: ['bed-genome-stats', md5],
    queryFn: async () => {
      const { data } = await api.get<BedGenomeStatsResponse>(`/bed/${md5}/genome-stats`);
      return data;
    },
    enabled: !!md5,
    staleTime: 0,
  });
};

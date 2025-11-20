import { useQuery } from '@tanstack/react-query';
import { components } from '../../bedbase-types';
import { useBedbaseApi } from '../contexts/api-context';

type BEDBASEStatistics = components['schemas']['FileStats'];

export const useDetailedStats = () => {
  const { api } = useBedbaseApi();
  return useQuery({
    queryKey: ['detailed-stats'],
    queryFn: async () => {
      const { data } = await api.get<BEDBASEStatistics>('/detailed-stats?concise=true');
      return data;
    },
  });
};

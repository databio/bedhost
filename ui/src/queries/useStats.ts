import { useQuery } from '@tanstack/react-query';
import { components } from '../../bedbase-types';
import { useBedbaseApi } from '../contexts/api-context';

type BEDBASEStatistics = components['schemas']['StatsReturn'];

export const useStats = () => {
  const { api } = useBedbaseApi();
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get<BEDBASEStatistics>('/stats');
      return data;
    },
  });
};

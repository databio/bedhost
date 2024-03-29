import { useQuery } from '@tanstack/react-query';
import { components } from '../../bedbase-types';
import { useBedbaseApi } from '../contexts/api-context';

type StatsResponse = components['schemas']['StatsReturn'];

export const useBedbaseStats = () => {
  const { api } = useBedbaseApi();
  return useQuery({
    queryKey: ['bedbase-stats'],
    queryFn: async () => {
      const { data } = await api.get<StatsResponse>('/stats');
      return data;
    },
  });
};

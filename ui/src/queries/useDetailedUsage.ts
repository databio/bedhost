import { useQuery } from '@tanstack/react-query';
import { components } from '../../bedbase-types';
import { useBedbaseApi } from '../contexts/api-context';

type BEDBASEStatistics = components['schemas']['UsageStats'];

export const useDetailedUsage = () => {
  const { api } = useBedbaseApi();
  return useQuery({
    queryKey: ['detailed-usage'],
    queryFn: async () => {
      const { data } = await api.get<BEDBASEStatistics>('/detailed-usage');
      return data;
    },
  });
};

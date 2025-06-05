import { useQuery } from '@tanstack/react-query';
import { components } from '../../bedbase-types';
import { useBedbaseApi } from '../contexts/api-context';

type AvailableGenomesResponse = components['schemas']['BaseListResponse'];

export const useAvailableGenomes = () => {
  const { api } = useBedbaseApi();
  return useQuery({
    queryKey: ['availableGenomes'],
    queryFn: async () => {
      const { data } = await api.get<AvailableGenomesResponse>('/genomes');
      return data;
    },
  });
};

import { useQuery } from '@tanstack/react-query';
import { components } from '../../bedbase-types';
import { useBedbaseApi } from '../contexts/api-context';

type AvailableAssaysResponse = components['schemas']['BaseListResponse'];

export const useAvailableAssays = () => {
  const { api } = useBedbaseApi();
  return useQuery({
    queryKey: ['availableAssays'],
    queryFn: async () => {
      const { data } = await api.get<AvailableAssaysResponse>('/assays');
      return data;
    },
  });
};

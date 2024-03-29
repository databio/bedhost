import { useQuery } from '@tanstack/react-query';
import { components } from '../../bedbase-types';
import { useBedbaseApi } from '../contexts/api-context';

type ServiceInfoResponse = components['schemas']['ServiceInfoResponse'];

export const useServiceInfo = () => {
  const { api } = useBedbaseApi();
  return useQuery({
    queryKey: ['service-info'],
    queryFn: async () => {
      const { data } = await api.get<ServiceInfoResponse>('/service-info');
      return data;
    },
  });
};

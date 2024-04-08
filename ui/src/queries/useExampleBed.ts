import { useQuery } from '@tanstack/react-query';
import { components } from '../../bedbase-types';
import { useBedbaseApi } from '../contexts/api-context';

type ExampleBedResponse = components['schemas']['BedMetadata'];

export const useExampleBed = () => {
  const { api } = useBedbaseApi();
  return useQuery({
    queryKey: ['bed-example'],
    queryFn: async () => {
      const { data } = await api.get<ExampleBedResponse>('/bed/example');
      return data;
    },
  });
};

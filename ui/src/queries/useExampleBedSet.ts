import { useQuery } from '@tanstack/react-query';
import { components } from '../../bedbase-types';
import { useBedbaseApi } from '../contexts/api-context';

type ExampleBedSetResponse = components['schemas']['BedSetMetadata'];

export const useExampleBedSet = () => {
  const { api } = useBedbaseApi();
  return useQuery({
    queryKey: ['bedset-example'],
    queryFn: async () => {
      const { data } = await api.get<ExampleBedSetResponse>('/bedset/example');
      return data;
    },
  });
};

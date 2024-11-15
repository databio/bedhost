import type { components } from '../../bedbase-types';
import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';

type BedSetBedfilesResponse = components['schemas']['BedSetBedFiles'];

type BedSetBedfilesQuery = {
  id?: string;
  autoRun?: boolean;
};

export const useBedsetBedfiles = (query: BedSetBedfilesQuery) => {
  const { api } = useBedbaseApi();
  const { id } = query;

  return useQuery({
    queryKey: ['bedset-bedfiles', id],
    queryFn: async () => {
      const { data } = await api.get<BedSetBedfilesResponse>(`/bedset/${id}/bedfiles`);
      return data;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // This replaces cacheTime in newer versions
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

import type { components } from '../../bedbase-types';
import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context.tsx';

type BedSetBedfilesResponse = components['schemas']['BedSetBedFiles'];

type BedSetBedfilesQuery = {
  id?: string;
  autoRun?: boolean;
};

export const useBedsetBedfiles = (query: BedSetBedfilesQuery) => {
  const { api } = useBedbaseApi();
  const { id, autoRun } = query;
  let enabled = false;
  if (autoRun !== undefined && autoRun && id) {
    enabled = true;
  }

  return useQuery({
    queryKey: ['bedset-bedfiles', id],
    queryFn: async () => {
      const { data } = await api.get<BedSetBedfilesResponse>(`/bedset/${id}/bedfiles`);
      return data;
    },
    enabled: enabled,
    staleTime: 0,
  });
};

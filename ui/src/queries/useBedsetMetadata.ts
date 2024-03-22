import type { components } from '../../bedbase-types';
import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context.tsx';

type BedSetMetadataResponse = components['schemas']['BedSetMetadata'];

type BedSetMetadataQuery = {
  md5?: string;
  autoRun?: boolean;
};

export const useBedsetMetadata = (query: BedSetMetadataQuery) => {
  const { api } = useBedbaseApi();
  const { md5, autoRun } = query;
  let enabled = false;
  if (autoRun !== undefined && autoRun && md5) {
    enabled = true;
  }

  return useQuery({
    queryKey: ['bedset-metadata', md5],
    queryFn: async () => {
      const { data } = await api.get<BedSetMetadataResponse>(`/bedset/${md5}/metadata`);
      return data;
    },
    enabled: enabled,
    staleTime: 0,
  });
};

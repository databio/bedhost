import type { components } from '../../bedbase-types';
import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';

type BedSetMetadataResponse = components['schemas']['BedSetMetadata'];

type BedSetMetadataQuery = {
  md5?: string;
  autoRun?: boolean;
};

export const useBedsetMetadata = (query: BedSetMetadataQuery) => {
  const { api } = useBedbaseApi();
  const { md5 } = query;

  return useQuery({
    queryKey: ['bedset-metadata', md5],
    queryFn: async () => {
      const { data } = await api.get<BedSetMetadataResponse>(`/bedset/${md5}/metadata`);
      return data;
    },
    enabled: Boolean(md5),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // This replaces cacheTime in newer versions
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
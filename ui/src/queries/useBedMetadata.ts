import type { components } from '../../bedbase-types.d.ts';
import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';

type BedMetadataResponse = components['schemas']['BedMetadata'];

type BedMetadataQuery = {
  md5?: string;
  autoRun?: boolean;
  full?: boolean;
};

export const useBedMetadata = (query: BedMetadataQuery) => {
  const { api } = useBedbaseApi();
  const { md5, autoRun, full } = query;
  let enabled = false;
  if (autoRun !== undefined && autoRun && md5) {
    enabled = true;
  }
  let getFull = false;
  if (full !== undefined && full && md5) {
    getFull = true;
  }

  return useQuery({
    queryKey: ['bed-metadata', md5],
    queryFn: async () => {
      const { data } = await api.get<BedMetadataResponse>(`/bed/${md5}/metadata?full=${getFull}`);
      return data;
    },
    enabled: enabled,
    staleTime: 0,
  });
};

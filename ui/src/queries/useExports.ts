import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';

// NOTE: The /bed/exports endpoint is not yet part of the generated
// bedbase-types.d.ts, so the response shape is typed inline here.
export type BedSnapshotFileType = 'metadata' | 'bedsets' | 'bedset_membership' | 'manifest';

export type BedSnapshotResult = {
  file_path: string; // absolute https URL to the export file
  file_type: BedSnapshotFileType;
  creation_date: string; // ISO timestamp
  record_count: number | null;
  file_size: number | null; // bytes
  checksum: string | null; // sha256
  schema_version: number | null;
};

export type BedSnapshotListResult = {
  count: number;
  results: BedSnapshotResult[];
};

export const useExports = () => {
  const { api } = useBedbaseApi();
  return useQuery({
    queryKey: ['exports'],
    queryFn: async () => {
      const { data } = await api.get<BedSnapshotListResult>('/bed/exports');
      return data;
    },
  });
};

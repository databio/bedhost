import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';

// NOTE: The /files endpoint is not yet part of the generated
// bedbase-types.d.ts, so the response shape is typed inline here.
export type AnalysisFileResult = {
  id: number | null;
  name: string;
  file_path: string; // absolute https URL to the file
  file_type: string | null;
  genome: string | null;
  description: string | null;
  tags: string[] | null;
  file_size: number | null; // bytes
  checksum: string | null; // sha256
  creation_date: string; // ISO timestamp
};

export type AnalysisFileListResult = {
  count: number;
  results: AnalysisFileResult[];
};

type UseAnalysisFilesParams = {
  fileType?: string;
  genome?: string;
  tag?: string;
};

export const useAnalysisFiles = (params: UseAnalysisFilesParams = {}) => {
  const { api } = useBedbaseApi();
  const { fileType, genome, tag } = params;
  return useQuery({
    queryKey: ['analysis-files', fileType ?? null, genome ?? null, tag ?? null],
    queryFn: async () => {
      const { data } = await api.get<AnalysisFileListResult>('/files', {
        params: {
          ...(fileType ? { file_type: fileType } : {}),
          ...(genome ? { genome } : {}),
          ...(tag ? { tag } : {}),
        },
      });
      return data;
    },
  });
};

import type { components } from '../../bedbase-types.d.ts';
import { useMutation } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';

type GenomeAnalysisResponse = components['schemas']['RefGenValidReturnModel'];

type BedFileData = Record<string, number>;

export const useAnalyzeGenome = () => {
  const { api } = useBedbaseApi();

  return useMutation({
    mutationFn: async (bedFile: BedFileData) => {
      const { data } = await api.post<GenomeAnalysisResponse>('/bed/analyze-genome', {
        bed_file: bedFile,
      });
      return data;
    },
  });
};
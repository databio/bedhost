import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

type UmapResponse = number[];

type UmapQuery = {
  bedFile: File | null;
  autoRun?: boolean;
};

export const useBedUmap = (query: UmapQuery) => {
  const { bedFile, autoRun } = query;

  let enabled = false;
  if (autoRun !== undefined && autoRun === true && !!bedFile) {
    enabled = true;
  }

  return useQuery({
    queryKey: ['bed-umap', bedFile?.name, bedFile?.size],
    queryFn: async () => {
      if (!bedFile) {
        return null;
      }

      try {
        const formData = new FormData();
        formData.append('file', bedFile);

        const { data } = await axios.post<UmapResponse>(
          'https://api-dev.bedbase.org/v1/bed/umap',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        console.log('UMAP response:', data, `(${data?.length} values)`);
        return data;
      } catch (error) {
        console.error('Error calling UMAP endpoint:', error);
        if (axios.isAxiosError(error)) {
          console.error('Response data:', error.response?.data);
          console.error('Response status:', error.response?.status);
        }
        throw error;
      }
    },
    enabled: enabled,
    staleTime: 0,
    retry: 1,
  });
};

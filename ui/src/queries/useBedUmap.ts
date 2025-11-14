import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosInstance } from 'axios';
import { useBedbaseApi } from '../contexts/api-context';

type UmapResponse = number[];

const getBedUmap = async (file: File, axiosInstance: AxiosInstance) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axiosInstance.post<UmapResponse>('/bed/umap', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const useBedUmap = () => {
  const queryClient = useQueryClient();
  const { api } = useBedbaseApi();

  return useMutation({
    mutationFn: (file: File) => getBedUmap(file, api),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bed-umap'] });
    },
  });
};

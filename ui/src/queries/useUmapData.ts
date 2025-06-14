import { useQuery } from '@tanstack/react-query';

export const useUmap = () => {
  return useQuery({
    queryKey: ['umapData'],
    queryFn: async () => {
      const response = await fetch('https://raw.githubusercontent.com/databio/bedbase-loader/refs/heads/master/umap/hg38_umap.json');
      if (!response.ok) {
        throw new Error('Failed to fetch UMAP data');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });
};
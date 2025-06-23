import { useQuery } from '@tanstack/react-query';

export const useUmapEmbeddings = () => {
  return useQuery({
    queryKey: ['umapData'],
    queryFn: async () => {
      const response = await fetch('https://raw.githubusercontent.com/databio/bedbase-loader/refs/heads/master/umap/hg38_umap.json');
      if (!response.ok) {
        throw new Error('Failed to fetch UMAP data');
      }
      const data = await response.json();
      return data;
      // TODO: we need to cache it!!!
    },
  });
};
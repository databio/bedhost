import { useQuery } from '@tanstack/react-query';

export const useUmapEmbeddings = () => {
  return useQuery({
    queryKey: ['umapData'],
    queryFn: async () => {
      const cachedDataString = localStorage.getItem('umapData');
      if (cachedDataString) {
        try {
          return JSON.parse(cachedDataString);
        } catch (e) {
          console.error('Failed to parse cached UMAP data:', e);
        }
      }

      const response = await fetch(
        'https://raw.githubusercontent.com/databio/bedbase-loader/refs/heads/master/umap/hg38_umap.json',
      );
      if (!response.ok) {
        throw new Error('Failed to fetch UMAP data');
      }
      const data = await response.json();

      try {
        localStorage.setItem('umapData', JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to cache UMAP data in localStorage:', e);
      }
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });
};

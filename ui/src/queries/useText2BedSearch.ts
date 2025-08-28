import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';
import { components } from '../../bedbase-types';

type SearchResponse = components['schemas']['BedListSearchResult'];
type SearchQuery = {
  q: string;
  genome?: string;
  assay?: string;
  limit?: number;
  offset?: number;
  autoRun?: boolean;
};

export const useText2BedSearch = (query: SearchQuery) => {

  const { api } = useBedbaseApi();

  const { q, limit, offset, autoRun, genome, assay } = query;
  let enabled = false;
  if (autoRun !== undefined && autoRun === true && !!q) {
    enabled = true;
  }
  console.log(assay)
  return useQuery({
    queryKey: ['search', q, limit, offset, genome, assay],
    queryFn: async () => {
      const { data } = await api.get<SearchResponse>(`/bed/search/text?query=${q}&limit=${limit}&offset=${offset}&genome=${genome}&assay=${assay}`);
      return data;
    },
    enabled: enabled,
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });
};

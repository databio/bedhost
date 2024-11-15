import { useQuery } from '@tanstack/react-query';
import { useBedbaseApi } from '../contexts/api-context';
import { components } from '../../bedbase-types';

type BedNeighboursResponse = components['schemas']['BedNeighboursResult'];
type BedNeighboursQuery = {
  md5?: string;
  limit?: number;
  offset?: number;
};

export const useBedNeighbours = (query: BedNeighboursQuery) => {
  const { api } = useBedbaseApi();

  const { md5, limit } = query;

  return useQuery({
    queryKey: ['neighbours', md5],
    queryFn: async () => {
      const { data } = await api.get<BedNeighboursResponse>(`/bed/${md5}/neighbours?limit=${limit}`);
      return data;
    }
  });
};

import { components } from '../../../../bedbase-types';
import { useNavigate } from 'react-router-dom';


type SearchResponse = components['schemas']['BedSetListResult'];

type Props = {
  results: SearchResponse;
};

export const SearchBedSetResultTable = (props: Props) => {
  const { results } = props;
  const navigate = useNavigate();

  const handleRowClick = (id?: string) => (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('button')) {
      navigate(`/bedset/${id}`);
    }
  };

  return (
    <div className='table-responsive border bg-white rounded'>
      <table className="table table-hover text-sm">
        <thead>
          <tr>
            <th className='text-nowrap' scope="col">BEDset ID</th>
            <th className='text-nowrap' scope="col">Name</th>
            <th className='text-nowrap' scope="col">Description</th>
            <th className='text-nowrap' scope={'col'}>Number of BEDs</th>

          </tr>
        </thead>
        <tbody>
          {results.results?.map((result) => (
            <tr key={result.id} onClick={handleRowClick(result?.id)} className="cursor-pointer position-relative">
              <td>{result?.id || 'Unknown Id'}</td>
              <td>{result?.name || 'Unknown Name'}</td>
              <td>{result?.description || 'Unknown Description'}</td>
              <td>{result?.bed_ids?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

import { components } from '../../../bedbase-types';

type SearchResponse = components['schemas']['BedSetListResult'];

type Props = {
  results: SearchResponse;
};

export const SearchBedSetResultTable = (props: Props) => {
  const { results } = props;

  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Bedset ID</th>
          <th scope="col">Name</th>
          <th scope="col">Description</th>
          <th scope={'col'}>Number of Beds</th>
          <th scope="col" style={{ minWidth: '140px' }}>
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {results.results?.map((result) => (
          <tr key={result.id}>
            <td>{result?.id || 'Unknown Id'}</td>
            <td>{result?.name || 'Unknown Name'}</td>
            <td>{result?.description || 'Unknown Description'}</td>
            <td>{result?.bed_ids?.length || 0}</td>
            <td>
              <a className="me-1 align-content-center" href={`/bedset/${result?.id}`}>
                <button className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-eye"></i>
                </button>
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

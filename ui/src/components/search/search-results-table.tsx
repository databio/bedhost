import { ProgressBar } from 'react-bootstrap';
import { components } from '../../../bedbase-types';
import { roundToTwoDecimals } from '../../utils';
import { useBedCart } from '../../contexts/bedcart-context';
import toast from 'react-hot-toast';

type SearchResponse = components['schemas']['BedListSearchResult'];

type Props = {
  results: SearchResponse;
};

export const SearchResultsTable = (props: Props) => {
  const { results } = props;
  const { cart, addBedToCart, removeBedFromCart } = useBedCart();
  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Score</th>
          <th scope="col">BEDbase ID</th>
          <th scope="col" style={{ minWidth: '140px' }}>
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {results.results?.map((result) => (
          <tr key={result.id}>
            <td>{result?.metadata?.name || 'No name'}</td>
            <td>
              <ProgressBar
                min={5}
                now={result.score * 100}
                label={`${roundToTwoDecimals(result.score * 100)}%`}
                variant="primary"
              />
            </td>
            <td>{result?.metadata?.id}</td>
            <td>
              <a className="me-1" href={`/bed/${result.metadata?.id}`}>
                <button className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-eye"></i>
                </button>
              </a>
              {cart.includes(result?.metadata?.id || '') ? (
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    if (result.metadata?.id === undefined) {
                      toast.error('No bed ID found', { position: 'top-center' });
                      return;
                    }
                    removeBedFromCart(result.metadata?.id);
                  }}
                >
                  Remove
                  <i className="bi bi-cart-dash ms-1"></i>
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    if (result.metadata?.id === undefined) {
                      toast.error('No bed ID found', { position: 'top-center' });
                      return;
                    }
                    addBedToCart(result.metadata?.id || '');
                  }}
                >
                  Add
                  <i className="bi bi-cart-plus ms-1"></i>
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

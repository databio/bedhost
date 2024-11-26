import { ProgressBar } from 'react-bootstrap';
import { components } from '../../../../bedbase-types';
import { roundToTwoDecimals } from '../../../utils';
import { useBedCart } from '../../../contexts/bedcart-context';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import toast from 'react-hot-toast';
import YAML from 'js-yaml';

type SearchResponse = components['schemas']['BedListSearchResult'];
// type BedNeighboursResponse = components['schemas']['BedNeighboursResult'];

type Props = {
  results: SearchResponse;
  search_query?: string | undefined;
};

const IsUnique = (name: string, found_id: string, search_id: string) => {
  if (found_id === search_id) {
    return (
      <div className="d-flex">
        {name} &nbsp;
        <OverlayTrigger
          placement="top"
          overlay={
            <div className="tooltip">
              <div className="tooltip-arrow" />
              <div className="tooltip-inner">Exact match</div>
            </div>
          }
        >
          <div className="bi bi-patch-check-fill text-success">
          </div>
        </OverlayTrigger>

      </div>
    );
  } else {
    return name;
  }
};

export const Text2BedSearchResultsTable = (props: Props) => {
  const { results, search_query } = props;
  const { cart, addBedToCart, removeBedFromCart } = useBedCart();

  const handleRowClick = (id?: string) => (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('button')) {
      window.location.href = `/bed/${id}`;
    }
  };

  return (
    <div className="table-responsive">
      <table className="table text-sm table-hover">
        <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Genome</th>
          <th scope="col">Tissue</th>
          <th scope="col">Cell Line</th>
          <th scope="col">Cell Type</th>
          <th scope="col">Description</th>
          <th scope="col">Assay</th>
          <th scope="col">Info</th>
          <th scope="col">Score</th>
          <th scope="col" style={{ minWidth: '110px' }}>
            Actions
          </th>
        </tr>
        </thead>
        <tbody>
        {results.results?.map((result) => (
          <tr
            key={result.id}
            onClick={handleRowClick(result.metadata?.id)}
            className="cursor-pointer position-relative"
          >
            <td>{IsUnique(result?.metadata?.name || 'No name', result.id, search_query || '') || 'No name'}</td>
            <td>
              <span className="badge text-bg-primary">{result?.metadata?.genome_alias || 'N/A'}</span>
            </td>
            <td>{result?.metadata?.annotation?.tissue || 'N/A'}</td>
            <td>{result?.metadata?.annotation?.cell_line || 'N/A'}</td>
            <td>{result?.metadata?.annotation?.cell_type || 'N/A'}</td>
            <td>{result?.metadata?.description || ''}</td>
            <td>{result?.metadata?.annotation?.assay || 'N/A'}</td>
            <td className="text-start">
              <OverlayTrigger
                placement="left"
                overlay={
                  <Tooltip id={`tooltip-${result.id}`} className="moreinfo-tooltip">
                    <pre className="text-start">
                      {YAML.dump(result?.metadata, {
                        indent: 2,
                        noRefs: true,
                      }) || 'No description'}
                    </pre>
                  </Tooltip>
                }
              >
                <span className="bi bi-info-circle position-relative" style={{ zIndex: 2 }}></span>
              </OverlayTrigger>
            </td>
            <td>
              <ProgressBar
                min={5}
                now={result.score * 100}
                label={`${roundToTwoDecimals(result.score * 100)}`}
                variant="primary"
              />
            </td>
            <td>
              {cart.includes(result?.metadata?.id || '') ? (
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={(e) => {
                    e.stopPropagation();
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
                  className="btn btn-sm btn-outline-primary small-font"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (result.metadata?.id === undefined) {
                      toast.error('No bed ID found', { position: 'top-center' });
                      return;
                    }
                    addBedToCart(result.metadata?.id);
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
    </div>
  );
};

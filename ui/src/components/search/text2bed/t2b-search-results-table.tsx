import { ProgressBar } from 'react-bootstrap';
import { components } from '../../../../bedbase-types';
import { roundToTwoDecimals } from '../../../utils';
import { useBedCart } from '../../../contexts/bedcart-context';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import toast from 'react-hot-toast';
import YAML from 'js-yaml';

type SearchResponse = components['schemas']['BedListSearchResult'];

type Props = {
  results: SearchResponse;
};

export const Text2BedSearchResultsTable = (props: Props) => {
  const { results } = props;
  const { cart, addBedToCart, removeBedFromCart } = useBedCart();
  return (
    <table className="table text-sm table-hover">
      <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Genome</th>
        <th scope="col">Tissue</th>
        <th scope="col">Cell Line</th>
        <th scope="col">Cell Type</th>
        {/*<th scope="col">Target </th>*/}
        {/*<th scope="col">Antibody</th>*/}
        <th scope="col">Description</th>
        <th scope="col">Assay</th>
        <th scope="col">Info</th>
        <th scope="col">Score</th>
        {/* <th scope="col">BEDbase ID</th> */}
        <th scope="col" style={{ minWidth: '110px' }}>
          Actions
        </th>
      </tr>
      </thead>
      <tbody>
      {results.results?.map((result) => (
          <tr key={result.id} className="position-relative">
            <td>{result?.metadata?.name || 'No name'}</td>
            <td>
              <span className="badge text-bg-primary">{result?.metadata?.genome_alias || 'N/A'}</span>
            </td>
            <td>{result?.metadata?.annotation?.tissue || 'N/A'}</td>
            <td>{result?.metadata?.annotation?.cell_line || 'N/A'}</td>
            <td>{result?.metadata?.annotation?.cell_type || 'N/A'}</td>
            {/*<td>{result?.metadata?.annotation?.target || 'N/A'}</td>*/}
            {/*<td>{result?.metadata?.annotation?.antibody || 'N/A'}</td>*/}

            <td>{result?.metadata?.description || ''}</td>
            <td>{result?.metadata?.annotation?.assay || 'N/A'}</td>
            {/*<td className="bi bi-info-circle text-truncate text-center"></td>*/}
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
                <span className="bi bi-info-circle position-relative" style={{ zIndex: 999 }}></span>
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

            {/* <td>{result?.metadata?.id || 'No id'}</td> */}
            {/*<td>*/}
            {/*  /!*{result?.metadata?.submission_date === undefined*!/*/}
            {/*  /!*  ? 'No date'*!/*/}
            {/*  /!*  : new Date(result.metadata?.submission_date).toLocaleDateString()}*!/\*/}
            {/*  */}
            {/*</td>*/}
            <td>
              <a className="me-1 stretched-link" href={`/bed/${result.metadata?.id}`}>
                {/*<button className="btn btn-sm btn-outline-primary position-relative" style={{zIndex: 999}}>*/}
                {/*  <i className="bi bi-eye"></i>*/}
                {/*</button>*/}
              </a>
              {cart.includes(result?.metadata?.id || '') ? (
                <button
                  className="btn btn-sm btn-outline-danger position-relative"
                  style={{ zIndex: 999 }}
                  onClick={() => {
                    if (result.metadata?.id === undefined) {
                      toast.error('No bed ID found', { position: 'top-center' });
                      return;
                    }
                    removeBedFromCart(result.metadata?.id || '');
                  }}
                >
                  Remove
                  <i className="bi bi-cart-dash ms-1"></i>
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-outline-primary position-relative small-font"
                  style={{ zIndex: 999 }}
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

import { Modal } from 'react-bootstrap';
import { components } from '../../../bedbase-types';

type BedGenomeStats = components['schemas']['RefGenValidReturnModel'];

type Props = {
  show: boolean;
  onHide: () => void;
  genomeStats: BedGenomeStats;
};

export const RefGenomeModal = (props: Props) => {
  const { show, onHide, genomeStats } = props;

  return (
    <Modal
      animation={false}
      show={show}
      onHide={() => onHide()}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>Reference Genome Compatibility</Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column align-items-center">
          <div className="d-flex flex-column">
            <table>
              <thead>
                <tr>
                  <th>Genome</th>
                  <th>Compatibility Ranking (1 is best)</th>
                </tr>
              </thead>
              <tbody>
              {genomeStats?.compared_genome
              ?.sort((a, b) => a.tier_ranking - b.tier_ranking)
              .map(item => (
                <tr key={item.compared_genome}>
                  <td>{item.compared_genome}</td>
                  <td className='text-center'>{item.tier_ranking}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

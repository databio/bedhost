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

  console.log(genomeStats.compared_genome);

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
        <p className='text-sm'>
          Ranking and score breakdown; the closer the compatibility rank is to 1, the more compatible the genome is with the given reference genome.
        </p>

        {genomeStats?.compared_genome?.sort((a, b) => a.tier_ranking - b.tier_ranking)
          .map(genome => (
            <div className='card mb-3 shadow-sm' key={genome.compared_genome}>
              <div className='card-body'>
                <h5 className='d-inline'>{genome.compared_genome}</h5>
                <span className='d-inline float-end fw-medium'>Compatibility Rank: {genome.tier_ranking}</span>

                <p className='mt-2 mb-0 text-sm'>xs</p>
                <div className="rounded" style={{backgroundColor: 'lightgrey'}}>
                  <div 
                    className="mb-1 rounded"
                    style={{ backgroundColor: 'darkslateblue', height: '10px', width: `${(genome.xs || 0) * 100}%` }}
                  />
                </div>

                <p className='mb-0 text-sm'>oobr</p>
                <div className="rounded" style={{backgroundColor: 'lightgrey'}}>
                  <div 
                    className="mb-1 rounded"
                    style={{ backgroundColor: 'sandybrown', height: '10px', width: `${(genome.oobr || 0) * 100}%` }}
                  />
                </div>

                <p className='mb-0 text-sm'>sequence fit</p>
                <div className="rounded" style={{backgroundColor: 'lightgrey'}}>
                  <div 
                    className="bg-success mb-1 rounded"
                    style={{ backgroundColor: 'darkseagreen', height: '10px', width: `${(genome.sequence_fit || 0) * 100}%` }}
                  />
                </div>

              </div>
            </div>
        ))}   
      </Modal.Body>
    </Modal>
  );
};

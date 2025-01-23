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
          <strong>Note:</strong> Below is a ranking of the compatibility various reference genomes to this BED file (rank 1 is best).
        </p>

        <div className='row mb-1'>
          <div className='col-12'>
            <div className='d-flex align-items-center gap-2 px-3 fw-medium text-sm'>
              <p className='mb-1' style={{width: '33%'}}>Genome</p>
              <p className='mb-1 mx-2' style={{width: '14%'}}>xs</p>
              <p className='mb-1 mx-2' style={{width: '14%'}}>oobr</p>
              <p className='mb-1 mx-2' style={{width: '14%'}}>sequence fit</p>
              <p className='mb-1 ms-auto'>Rank</p>
            </div>
          </div>
        </div>

        {genomeStats?.compared_genome?.sort((a, b) => a.tier_ranking - b.tier_ranking)
          .map(genome => (
            <div 
              className='card mb-3 shadow-sm' 
              style={{backgroundColor: (genome.tier_ranking == 1 ? '#C8EFB3' : (genome.tier_ranking == 2 ? '#FFF7BA' : (genome.tier_ranking == 3 ? '#F9D39D' : '#FCB6B6'))) }} 
              key={genome.compared_genome}
            >
              <div className='card-body'>

                <div className='row'>
                  <div className='col-12'>
                    <div className='d-flex align-items-center gap-2'>
                      <p className='mb-1 fw-semibold' style={{width: '33%'}}>{genome.compared_genome}</p>

                      <div className="rounded-1 mx-2 bg-white position-relative" style={{width: '14%'}}>
                        <span className={`text-xs position-absolute start-50 top-50 translate-middle ${(genome.xs || 0) * 100 > 30 ? 'text-white' : 'text-dark'}`}>
                          {((genome.xs || 0) * 100).toFixed(2) + '%'}
                        </span>
                        <div className="rounded-1 bg-primary" style={{height: '16px', width: `${(genome.xs || 0) * 100}%` }} />
                      </div>

                      <div className="rounded-1 mx-2 bg-white position-relative" style={{width: '14%'}}>
                        <span className={`text-xs position-absolute start-50 top-50 translate-middle ${(genome.oobr || 0) * 100 > 30 ? 'text-white' : 'text-dark'}`}>
                          {((genome.oobr || 0) * 100).toFixed(2) + '%'}
                        </span>
                        <div className="rounded-1 bg-primary" style={{height: '16px', width: `${(genome.oobr || 0) * 100}%` }} />
                      </div>
                      
                      <div className="rounded-1 mx-2 bg-white position-relative" style={{width: '14%'}}>
                        <span className={`text-xs position-absolute start-50 top-50 translate-middle ${(genome.sequence_fit || 0) * 100 > 30 ? 'text-white' : 'text-dark'}`}>
                          {((genome.sequence_fit || 0) * 100).toFixed(2) + '%'}
                        </span>
                        <div className="rounded-1 bg-primary" style={{height: '16px', width: `${(genome.sequence_fit || 0) * 100}%` }} />
                      </div>

                      <p className='mb-1 fw-medium ms-auto'>Rank {genome.tier_ranking}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
        ))}   
      </Modal.Body>
    </Modal>
  );
};

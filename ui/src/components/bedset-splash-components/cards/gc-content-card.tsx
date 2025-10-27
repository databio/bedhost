import { components } from '../../../../bedbase-types';
import { formatNumberWithCommas } from '../../../utils';
import { StatCard } from './stat-card-wrapper';

type BedSetMetadata = components['schemas']['BedSetMetadata'];
type Props = {
  metadata: BedSetMetadata;
};

export const GCContentCard = (props: Props) => {
  const { metadata } = props;

  return (
    <StatCard title="GC Content" tooltip="The percentage of guanine and cytosine nucleotides in the sequence.">
      <div className="text-primary w-100">
        <h4 className="text-primary fw-bolder w-100 mb-0">
          {metadata.statistics?.mean?.gc_content
            ? `${formatNumberWithCommas(Math.round((metadata.statistics?.mean?.gc_content || 0)*100)/100)}` : 'N/A'}
            <span className='fs-5 fw-semibold'> {' '} ± {formatNumberWithCommas(Math.round((metadata.statistics?.sd?.gc_content || 0)*100)/100)}</span>
        </h4>
      </div>
    </StatCard>
  );
};

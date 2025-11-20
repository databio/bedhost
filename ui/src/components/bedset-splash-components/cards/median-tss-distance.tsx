import { components } from '../../../../bedbase-types';
import { formatNumberWithCommas } from '../../../utils';
import { StatCard } from './stat-card-wrapper';

type BedSetMetadata = components['schemas']['BedSetMetadata'];
type Props = {
  metadata: BedSetMetadata;
};

export const MedianTssDistCard = (props: Props) => {
  const { metadata } = props;
  return (
    <StatCard
      title='Median TSS Distance'
      tooltip='The median distance of the regions to the nearest transcription start site.'
    >
      <div className='text-primary w-100'>
        <h4 className='text-primary fw-bolder w-100 mb-0'>
          {formatNumberWithCommas(Math.round(metadata?.statistics?.mean?.median_tss_dist || 0))}
          <span className='fs-5 fw-semibold'>
            {' '}
            ± {formatNumberWithCommas(Math.round(metadata?.statistics?.sd?.median_tss_dist || 0))} bp
          </span>
        </h4>
      </div>
    </StatCard>
  );
};

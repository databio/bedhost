import { components } from '../../../../bedbase-types';
import { formatNumberWithCommas } from '../../../utils';
import { StatCard } from './stat-card-wrapper';

type BedMetadata = components['schemas']['BedMetadataAll'];
type Props = {
  metadata: BedMetadata;
};

export const MedianTssDistCard = (props: Props) => {
  const { metadata } = props;
  return (
    <StatCard
      title='Median TSS Distance'
      stat={`${formatNumberWithCommas(metadata.stats?.median_tss_dist || 0)} bp`}
      tooltip='The median distance of the regions to the nearest transcription start site.'
    />
  );
};

import { components } from '../../../../bedbase-types';
import { formatNumberWithCommas } from '../../../utils';
import { StatCard } from './stat-card-wrapper';

type BedMetadata = components['schemas']['BedMetadataAll'];
type Props = {
  metadata: BedMetadata;
};

export const MeanRegionWidthCard = (props: Props) => {
  const { metadata } = props;

  return (
    <StatCard
      title='Mean Region Width'
      stat={`${formatNumberWithCommas(metadata.stats?.mean_region_width || 0)} bp`}
      tooltip='The average width of the regions in the bed file.'
    />
  );
};

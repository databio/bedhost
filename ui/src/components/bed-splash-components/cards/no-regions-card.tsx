import { components } from '../../../../bedbase-types';
import { formatNumberWithCommas } from '../../../utils';
import { StatCard } from './stat-card-wrapper';

type BedMetadata = components['schemas']['BedMetadataAll'];
type Props = {
  metadata: BedMetadata;
};

export const NoRegionsCard = (props: Props) => {
  const { metadata } = props;
  return (
    <StatCard
      title='Number of Regions'
      stat={`${formatNumberWithCommas(metadata.stats?.number_of_regions || 0)}`}
      tooltip='The number of regions in the bed file.'
    />
  );
};

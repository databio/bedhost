import { components } from '../../../../bedbase-types';
import { formatNumberWithCommas } from '../../../utils';
import { StatCard } from './stat-card-wrapper';

type BedMetadata = components['schemas']['BedMetadata'];
type Props = {
  metadata: BedMetadata;
};

export const MeanRegionWidthCard = (props: Props) => {
  const { metadata } = props;

  return (
    <StatCard
      title="Mean region width"
      stat={`${formatNumberWithCommas(metadata.stats?.mean_region_width || 0)} bp`}
      learnMoreHref="#"
    />
  );
};

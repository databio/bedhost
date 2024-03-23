import { components } from '../../../../bedbase-types';
import { formatNumberWithCommas } from '../../../utils';
import { StatCard } from './stat-card-wrapper';

type BedMetadata = components['schemas']['BedMetadata'];
type Props = {
  metadata: BedMetadata;
};

export const MedianTssDistCard = (props: Props) => {
  const { metadata } = props;
  return (
    <StatCard
      title="Median TSS Distance"
      stat={`${formatNumberWithCommas(metadata.stats?.median_tss_dist || 0)} bp`}
      learnMoreHref="#"
    />
  );
};

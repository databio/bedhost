import { components } from '../../../../bedbase-types';
import { formatNumberWithCommas } from '../../../utils';
import { StatCard } from './stat-card-wrapper';

type BedMetadata = components['schemas']['BedMetadataAll'];
type Props = {
  metadata: BedMetadata;
};

export const GCContentCard = (props: Props) => {
  const { metadata } = props;

  return (
    <StatCard
      title='GC Content'
      stat={`${metadata.stats?.gc_content ? formatNumberWithCommas(metadata.stats?.gc_content) : 'N/A'}`}
      tooltip='The percentage of guanine and cytosine nucleotides in the sequence.'
    />
  );
};

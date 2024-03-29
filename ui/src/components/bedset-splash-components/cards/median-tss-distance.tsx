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
    <StatCard title="Median TSS Distance" learnMoreHref="#">
      <div className="text-primary w-100">
        <h2 className="fw-bolder text-center w-100 text-3xl mb-0">
          {formatNumberWithCommas(Math.round(metadata?.statistics?.mean?.median_tss_dist || 0))} bp
        </h2>
        {/* plus minus */}
        <h4 className="text-xl">
          ± {formatNumberWithCommas(Math.round(metadata?.statistics?.sd?.median_tss_dist || 0))} bp
        </h4>
      </div>
    </StatCard>
  );
};

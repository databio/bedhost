import { components } from '../../../../bedbase-types';
import { formatNumberWithCommas } from '../../../utils';
import { StatCard } from './stat-card-wrapper';

type BedSetMetadata = components['schemas']['BedSetMetadata'];
type Props = {
  metadata: BedSetMetadata;
};

export const MeanRegionWidthCard = (props: Props) => {
  const { metadata } = props;

  return (
    <StatCard title="Mean Region Width" tooltip="The average width of the regions in the bed file.">
      <div className="text-primary w-100">
        <h4 className="text-primary fw-bolder w-100 mb-0">
          {formatNumberWithCommas(Math.round(metadata.statistics?.mean?.mean_region_width || 0))} {' '}
          ± {formatNumberWithCommas(Math.round(metadata.statistics?.sd?.mean_region_width || 0))} bp
        </h4>
      </div>
    </StatCard>
  );
};

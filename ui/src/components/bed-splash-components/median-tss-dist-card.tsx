import { components } from '../../../bedbase-types';
import { formatNumberWithCommas } from '../../utils';

type BedMetadata = components['schemas']['BedMetadata'];
type Props = {
  metadata: BedMetadata;
};

export const MedianTssDistCard = (props: Props) => {
  const { metadata } = props;
  return (
    <div className="border rounded p-2 shadow-sm stat-card-height">
      <div className="d-flex flex-column align-items-center justify-content-between h-100">
        <h4 className="fw-bold text-base">Median TSS Distance</h4>
        <div className="d-flex w-100 text-center">
          <h2 className="text-center text-primary fw-bolder w-100 mb-0 text-4xl">
            {formatNumberWithCommas(metadata.stats?.median_tss_dist || 0)} bp
          </h2>
        </div>
        <div className="text-end">
          <p className="text-center mb-0 text-sm text-primary">Learn more</p>
        </div>
      </div>
    </div>
  );
};

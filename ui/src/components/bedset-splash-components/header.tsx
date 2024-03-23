import { components } from '../../../bedbase-types';

type BedSetMetadata = components['schemas']['BedSetMetadata'];
type Props = {
  metadata: BedSetMetadata;
};

export const BedsetSplashHeader = (props: Props) => {
  const { metadata } = props;
  return (
    <div className="border-bottom py-2">
      <div className="d-flex flex-row align-items-start justify-content-between mb-2 ">
        <div className="d-flex flex-column align-items-start">
          <h4 className="fw-bold">
            <i className="bi bi-file-earmark-text me-2" />
            {metadata?.name || 'No name available'}
          </h4>
          <p className="mb-0">{metadata?.description || 'No description available'}</p>
        </div>
      </div>
      <div className="d-flex flex-row align-items-end justify-content-start">
        <div className="badge bg-primary text-wrap me-2">
          <i className="bi bi-hash me-1" />
          {metadata.md5sum}
        </div>
      </div>
    </div>
  );
};

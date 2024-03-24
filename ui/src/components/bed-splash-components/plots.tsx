import { useState } from 'react';
import { Image } from 'react-bootstrap';
import { components } from '../../../bedbase-types';
import { makeThumbnailImageLink } from '../../utils';
import { Fragment } from 'react';
import { FigureModal } from '../modals/figure-modal';

type BedMetadata = components['schemas']['BedMetadata'];

type PlotsProps = {
  metadata: BedMetadata;
};

type PlotProps = {
  src: string;
  alt: string;
  title: string;
};

const Plot = (props: PlotProps) => {
  const { src, alt, title } = props;
  const [show, setShow] = useState(false);
  return (
    <div className="border rounded p-1 shadow-sm">
      <div className="px-1 d-flex flex-row justify-content-between w-100 mb-1">
        <span className="fw-bold text-sm">{title}</span>
        <button onClick={() => setShow(true)} className="btn btn-sm btn-outline-primary text-xs">
          <i className="bi bi-eye" />
        </button>
      </div>
      <Image height="200px" src={src} alt={alt} />
      <FigureModal show={show} setShow={setShow} title={title} src={src} alt={alt} />
    </div>
  );
};

export const Plots = (props: PlotsProps) => {
  const { metadata } = props;
  return (
    <Fragment>
      <div className="d-flex align-items-center flex-row flex-wrap gap-2">
        {metadata.plots &&
          Object.keys(metadata.plots).map((plot) => {
            // @ts-expect-error - we know this is a valid key
            const plotData = metadata?.plots[plot];
            if (metadata.plots && plotData !== undefined && plotData !== null) {
              return (
                <Plot
                  key={plot}
                  src={makeThumbnailImageLink(metadata.id, plot)}
                  alt={plotData?.title || `A plot for ${plot}`}
                  title={plotData?.title || plot}
                />
              );
            }
          })}
      </div>
    </Fragment>
  );
};

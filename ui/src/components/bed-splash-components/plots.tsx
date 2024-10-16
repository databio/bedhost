import { useState } from 'react';
import { Col, Image, Row } from 'react-bootstrap';
import { components } from '../../../bedbase-types';
import { chunkArray, makeThumbnailImageLink } from '../../utils';
import { Fragment } from 'react';
import { FigureModal } from '../modals/figure-modal';

type BedMetadata = components['schemas']['BedMetadataAll'];

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
    <div
      onClick={() => {
        // conditional required to prevent double click
        if (show !== true) {
          setShow(true);
        }
      }}
      className="h-100 border rounded p-1 shadow-sm hover-border-primary transition-all"
    >
      <div className="px-1 d-flex flex-row justify-content-between w-100 mb-1">
        <span className="fw-bold text-sm text-center w-100 mb-1">{title}</span>
        {/* <button onClick={() => setShow(true)} className="btn btn-sm btn-outline-primary text-xs">
          <i className="bi bi-eye" />
        </button> */}
      </div>
      <div className="d-flex flex-row align-items-center w-100 justify-content-center">
        <Image height="300px" src={src} alt={alt} />
      </div>
      <FigureModal
        show={show}
        onHide={() => {
          setShow(false);
        }}
        title={title}
        src={src}
        alt={alt}
      />
    </div>
  );
};

export const Plots = (props: PlotsProps) => {
  const { metadata } = props;
  const plotNames = metadata.plots ? Object.keys(metadata.plots) : [];
  return (
    <Fragment>
      <div className="my-2">
        {metadata.plots &&
          chunkArray(plotNames, 3).map((chunk, idx) => (
            <Row key={idx} className="mb-2">
              {chunk.map((plotName) => {
                // this is for type checking
                const plotNameKey = plotName as keyof typeof metadata.plots;
                const plotExists = metadata.plots && metadata.plots[plotNameKey];
                // @ts-expect-error: type checking here is just too much
                const title = plotExists ? metadata.plots[plotNameKey]?.title : plotName;
                const alt = plotExists
                  ? // @ts-expect-error: type checking here is just too much
                    metadata.plots[plotNameKey]?.description || metadata.plots[plotNameKey].title
                  : plotName;
                return (
                  <Col key={plotName} sm={12} md={4} className="px-1">
                    <Plot
                      key={plotName}
                      src={plotExists ? makeThumbnailImageLink(metadata.id, plotName, 'bed') : '/fignotavl_png.svg'}
                      alt={alt || 'No description available'}
                      title={title || 'No title available'}
                    />
                  </Col>
                );
              })}
            </Row>
          ))}
      </div>
    </Fragment>
  );
};

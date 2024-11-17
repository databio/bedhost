import { useState } from 'react';
import { Col, Image, Row } from 'react-bootstrap';
import { components } from '../../../bedbase-types';
import { chunkArray, makeThumbnailImageLink, makePDFImageLink } from '../../utils';
import { Fragment } from 'react';
import { FigureModal } from '../modals/figure-modal';

type BedMetadata = components['schemas']['BedMetadataAll'];

type PlotsProps = {
  metadata: BedMetadata;
};

type PlotProps = {
  src: string;
  pdf: string;
  alt: string;
  title: string;
};

const Plot = (props: PlotProps) => {
  const { src, pdf, alt, title } = props;
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
      <div className="px-1 text-center">
        <span className="fw-bold text-sm mb-1">{title}</span>
        {/* <button onClick={() => setShow(true)} className="btn btn-sm btn-outline-primary text-xs">
          <i className="bi bi-eye" />
        </button> */}
      </div>
      <div className="text-center">
        <Image height="300px" src={src} alt={alt} />
      </div>
      <FigureModal
        show={show}
        onHide={() => {
          setShow(false);
        }}
        title={title}
        src={src}
        pdf={pdf}
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
      <Row className="mb-2">
        {metadata.plots &&
          chunkArray(plotNames, 3).map((chunk, idx) => (
            <Fragment key={idx}>
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
                  <Col key={plotName}>
                    <Plot
                      key={plotName}
                      src={plotExists ? makeThumbnailImageLink(metadata.id, plotName, 'bed') : '/fignotavl_png.svg'}
                      pdf={plotExists ? makePDFImageLink(metadata.id, plotName, 'bed') : '/fignotavl_png.svg'}
                      alt={alt || 'No description available'}
                      title={title || 'No title available'}
                    />
                  </Col>
                );
              })}
            </Fragment>
          ))}
      </Row>
    </Fragment>
  );
};

import { EmbeddingViewMosaic } from 'embedding-atlas/react';
import { useEffect, useState, useRef, useMemo } from 'react';
import * as vg from '@uwdata/vgplot'

import { tableau20 } from '../../utils';
import { AtlasTooltip } from './atlas-tooltip';
import { useMosaicCoordinator } from '../../contexts/mosaic-coordinator-context';

type Props = {
  bedId?: string,
  height?: number;
}

export const BEDEmbeddingPlot = (props: Props) => {
  const { bedId, height } = props;
  const { coordinator, initializeData } = useMosaicCoordinator();

  const containerRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(900);
  const [isReady, setIsReady] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [tooltipPoint, setTooltipPoint] = useState<any>(null);
  const [colorGrouping] = useState('cell_line_category');
  const [viewportState, setViewportState] = useState<any>(null);

  const filter = useMemo(() => vg.Selection.intersect(), []);

  useEffect(() => { // initialize data
    initializeData().then(() => {
      setIsReady(true);
    });
  }, []);

  useEffect(() => { // resize width of view
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, [isReady]);

    useEffect(() => { // fetch initial bed id and neighbors
    if (isReady && !!bedId) {
      setTimeout(async () => {
        const currentBed: any = await coordinator.query(
          `SELECT
            x, y,
            ${colorGrouping} as category,
            name as text,
            id as identifier,
            {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
           FROM data
           WHERE id = '${bedId}'`,
          { type: 'json' }
        );
        if (!currentBed || currentBed.length === 0) return;
        setTooltipPoint(currentBed[0]);
        setSelectedPoints([currentBed[0]]);
      }, 200);
    }
  }, [isReady, bedId, coordinator]);

  return (
    <>
      {isReady ? (
        <div className='w-100' ref={containerRef}>
          <EmbeddingViewMosaic
            key={`embedding`}
            coordinator={coordinator}
            table='data'
            x='x'
            y='y'
            identifier='id'
            text='name'
            category={colorGrouping}
            categoryColors={tableau20}
            additionalFields={{'Description': 'description', 'Assay': 'assay', 'Cell Line': 'cell_line'}}
            height={height || 500}
            width={containerWidth}
            config={{
              autoLabelEnabled: false,
            }}
            filter={filter}
            viewportState={viewportState}
            onViewportState={setViewportState}
            tooltip={tooltipPoint}
            customTooltip={{
              class: AtlasTooltip,
              props: {
                showLink: true
              }
            }}
            selection={selectedPoints}
            theme={{
              statusBar: false
            }}
          />
        </div>
      ) : (
        <div className='w-100 d-flex align-items-center justify-content-center bg-white' style={{height: height || 500}} ref={containerRef}>
          <span className='text-muted text-sm'>Loading...</span>
        </div>
      )}
    </>
  );
}

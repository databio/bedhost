import { EmbeddingViewMosaic } from 'embedding-atlas/react';
import { useEffect, useState, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import toast from 'react-hot-toast';
import * as vg from '@uwdata/vgplot';

import { tableau20 } from '../../utils';
import { AtlasTooltip } from './atlas-tooltip';
import { useMosaicCoordinator } from '../../contexts/mosaic-coordinator-context';

type Props = {
  bedIds?: string[];
  height?: number;
  preselectPoint?: boolean;
  stickyBaseline?: boolean;
  customCoordinates?: number[] | null;
  customFilename?: string;
};

export interface BEDEmbeddingPlotRef {
  centerOnBedId: (bedId: string, scale?: number) => Promise<void>;
  handleFileRemove: () => Promise<void>;
}

export const EmbeddingPlot = forwardRef<BEDEmbeddingPlotRef, Props>((props, ref) => {
  const { bedIds, height, preselectPoint, stickyBaseline, customCoordinates, customFilename } = props;
  const { coordinator, initializeData, addCustomPoint, deleteCustomPoint, webglStatus } = useMosaicCoordinator();

  const containerRef = useRef<HTMLDivElement>(null);
  const baselinePointsRef = useRef<any[]>([]);

  const [containerWidth, setContainerWidth] = useState(900);
  const [isReady, setIsReady] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [tooltipPoint, setTooltipPoint] = useState<any>(null);
  const [colorGrouping] = useState('cell_line_category');
  const [viewportState, setViewportState] = useState<any>(null);

  const filter = useMemo(() => vg.Selection.intersect(), []);

  const centerOnPoint = (point: any, scale: number = 1) => {
    setTooltipPoint(point);
    setViewportState({
      x: point.x,
      y: point.y,
      scale: scale,
    });
  };

  const centerOnBedId = async (bedId: string, scale: number = 1) => {
    if (!isReady) return;

    const bedData: any = await coordinator.query(
      `SELECT
        x, y,
        ${colorGrouping} as category,
        name as text,
        id as identifier,
        {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
       FROM data
       WHERE id = '${bedId}'`,
      { type: 'json' },
    );

    if (bedData && bedData.length > 0) {
      centerOnPoint(bedData[0], scale);
      setSelectedPoints([bedData[0]]);
    } else {
      toast.error('Error: BED file not present in embeddings.');
    }
  };

  const handleFileRemove = async () => {
    try {
      await deleteCustomPoint();
      coordinator.clear();
    } catch (error) {
      console.error('Error removing file');
    }
  };

  useImperativeHandle(ref, () => ({
    centerOnBedId,
    handleFileRemove,
  }));

  useEffect(() => {
    // initialize data
    initializeData().then(async () => {
      if (!!customCoordinates) {
        await addCustomPoint(customCoordinates[0], customCoordinates[1], customFilename);
        coordinator.clear();
      }
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    // resize width of view
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, [isReady]);

  useEffect(() => {
    // fetch provided bed ids
    if (isReady && bedIds && bedIds.length > 0) {
      setTimeout(async () => {
        const idsToQuery = customCoordinates ? ['custom_point', ...bedIds] : bedIds;
        const currentBed: any = await coordinator.query(
          `SELECT
            x, y,
            ${colorGrouping} as category,
            name as text,
            id as identifier,
            {'Description': description, 'Assay': assay, 'Cell Line': cell_line} as fields
           FROM data
           WHERE id IN ('${idsToQuery.join("','")}')`,
          { type: 'json' },
        );
        if (!currentBed || currentBed.length === 0) return;
        if (preselectPoint) {
          const pointToSelect = customCoordinates
            ? currentBed.find((bed: any) => bed.identifier === 'custom_point') || currentBed[0]
            : currentBed[0];
          if (!!customCoordinates) {
            centerOnPoint(pointToSelect);
          } else {
            setTooltipPoint(pointToSelect);
          }
        }
        baselinePointsRef.current = currentBed;
        setSelectedPoints(currentBed);
      }, 200);
    }
  }, [isReady, bedIds, coordinator, colorGrouping, customCoordinates]);

  return (
    <>
      {webglStatus.error ? (
        <div
          className='w-100 d-flex align-items-center justify-content-center bg-white'
          style={{ height: height || 500 }}
          ref={containerRef}
        >
          <span className='text-muted text-sm'>{webglStatus.error}</span>
        </div>
      ) : (
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
                additionalFields={{ Description: 'description', Assay: 'assay', 'Cell Line': 'cell_line' }}
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
                    showLink: true,
                  },
                }}
                selection={selectedPoints}
                onSelection={(dataPoints) => {
                  if (!dataPoints || (dataPoints.length === 0 && stickyBaseline)) {
                    setTimeout(() => {
                      if (baselinePointsRef.current.length > 0) {
                        setSelectedPoints([...baselinePointsRef.current]);
                      }
                    }, 0);
                    return;
                  }
                  setSelectedPoints(dataPoints);
                }}
                theme={{
                  statusBar: false,
                }}
              />
            </div>
          ) : (
            <div
              className='w-100 d-flex align-items-center justify-content-center bg-white'
              style={{ height: height || 500 }}
              ref={containerRef}
            >
              <span className='text-muted text-sm'>Loading...</span>
            </div>
          )}
        </>
      )}
    </>
  );
});

import { useEffect, useState, useRef, useMemo } from 'react';
import * as vg from '@uwdata/vgplot';
import { useMosaicCoordinator } from '../../contexts/mosaic-coordinator-context';

type Props = {
  selectedPoints: any[];
  colorGrouping: string;
};

export const EmbeddingStats = (props: Props) => {
  const { selectedPoints, colorGrouping } = props;
  const { coordinator } = useMosaicCoordinator();

  const [containerWidth, setContainerWidth] = useState(300);

  const barPlotRef = useRef<HTMLDivElement>(null);

  const selection = useMemo(() => vg.Selection.single(), []);
  const selectionSource = useMemo(() => ({}), []);

  const selectedPointsRef = useRef(selectedPoints);
  selectedPointsRef.current = selectedPoints;

  useEffect(() => {
    vg.coordinator(coordinator);

    const barPlot = vg.plot(
      vg.rectX(
        vg.from('data', { filterBy: selection }),
        {
          y: colorGrouping.replace('_category', ''),
          x: vg.count(),
          fill: 'steelblue',
          r: 2.2,
          inset: 1.2
        }
      ),
      vg.text(
        vg.from('data', { filterBy: selection }),
        {
          y: colorGrouping.replace('_category', ''),
          text: vg.count(),
          frameAnchor: 'right',
          textAnchor: 'end',
          dx: 36,
          fill: '#6c757d',
          fontSize: 11
        }
      ),
      vg.width(containerWidth),
      vg.height(280),
      vg.marginLeft(80),
      vg.marginTop(12),
      vg.marginRight(40),
      vg.yLabelAnchor('top'),
      vg.yLabelArrow('none')
    );

    if (barPlotRef.current) {
      barPlotRef.current.replaceChildren(barPlot);
    }

    // Re-apply current selection after plot connects to coordinator
    requestAnimationFrame(() => {
      const points = selectedPointsRef.current;
      if (points.length > 0) {
        const ids = points.map(p => `'${p.identifier}'`).join(', ');
        selection.update({
          source: selectionSource,
          value: ids,
          predicate: vg.sql`id IN (${ids})`
        });
      }
    });
  }, [coordinator, selection, containerWidth, colorGrouping]);

  useEffect(() => {
    if (selectedPoints.length > 0) {
      const ids = selectedPoints.map(p => `'${p.identifier}'`).join(', ');
      selection.update({
        source: selectionSource,
        value: ids,
        predicate: vg.sql`id IN (${ids})`
      });
    } else {
      selection.update({
        source: selectionSource,
        value: null,
        predicate: null
      });
    }
  }, [selectedPoints, selection, selectionSource, colorGrouping]);

  useEffect(() => {
    const updateDimensions = () => {
      if (barPlotRef.current) {
        setContainerWidth(barPlotRef.current.offsetWidth);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, [coordinator]);

  return (
    <div className='border card bg-white'>
      <div className='card-header border-bottom text-xs fw-semibold bg-white'>
        Selection Count
      </div>
      <div className='card-body'>
        <div ref={barPlotRef} />
      </div>
    </div>
  )
}

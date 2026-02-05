import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout';
import { EmbeddingPlot } from '../components/umap/embedding-plot.tsx';
import type { EmbeddingPlotRef } from '../components/umap/embedding-plot.tsx';
import { EmbeddingLegend } from '../components/umap/embedding-legend.tsx';
import { EmbeddingTable } from '../components/umap/embedding-table.tsx';
import { EmbeddingStats } from '../components/umap/embedding-stats.tsx';
import { EmbeddingSelections } from '../components/umap/embedding-selections.tsx';
import type { SelectionBucket } from '../components/umap/embedding-selections.tsx';
import { useBedCart } from '../contexts/bedcart-context';
import { useBedUmap } from '../queries/useBedUmap.ts';
import { useEffect, useState, useRef, useMemo } from 'react';

export const BEDUmap: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bedId = searchParams.get('searchId');

  const { addMultipleBedsToCart } = useBedCart();
  const { mutateAsync: getUmapCoordinates } = useBedUmap();

  const embeddingPlotRef = useRef<EmbeddingPlotRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [embeddingHeight, setEmbeddingHeight] = useState(500);
  const [legendItems, setLegendItems] = useState<any[]>([]);
  const [filterSelection, setFilterSelection] = useState<any>(null);
  const [colorGrouping, setColorGrouping] = useState('cell_line_category');
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [customCoordinates, setCustomCoordinates] = useState<number[] | null>(null);
  const [buckets, setBuckets] = useState<SelectionBucket[]>([]);

  const bucketPoints = useMemo(() => {
    const enabled = buckets.filter(b => b.enabled);
    if (enabled.length === 0) return [];
    const seen = new Set<string>();
    const points: any[] = [];
    for (const bucket of enabled) {
      for (const p of bucket.points) {
        if (p?.identifier && !seen.has(p.identifier)) {
          seen.add(p.identifier);
          points.push({ ...p, category: p[colorGrouping] ?? p.category });
        }
      }
    }
    return points;
  }, [buckets, colorGrouping]);

  const effectiveSelection = useMemo(() => {
    if (bucketPoints.length === 0) return selectedPoints;
    const seen = new Set(selectedPoints.map((p: any) => p.identifier));
    const merged = [...selectedPoints];
    for (const p of bucketPoints) {
      if (!seen.has(p.identifier)) {
        merged.push(p);
      }
    }
    return merged;
  }, [selectedPoints, bucketPoints]);

  const handleSaveCategory = async (item: any) => {
    const points = await embeddingPlotRef.current?.queryByCategory(item.category);
    if (points && points.length > 0) {
      const newBucket: SelectionBucket = {
        id: crypto.randomUUID(),
        name: item.name,
        points,
        enabled: true,
      };
      setBuckets(prev => [...prev, newBucket]);
      embeddingPlotRef.current?.clearRangeSelection();
      setSelectedPoints([]);
    }
  };

  useEffect(() => {
    if (!file) return;
    (async () => {
      const coordinates = await getUmapCoordinates(file);
      setCustomCoordinates(coordinates);
    })();
  }, [file]);

  const handleFileRemove = () => {
    embeddingPlotRef.current?.handleFileRemove();
    setFile(null);
    setCustomCoordinates(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddToCart = () => {
    const bedItems = effectiveSelection
      .filter((point: any) => point.identifier !== 'custom_point')
      .map((point: any) => ({
        id: point.identifier,
        name: point.text || 'No name',
        genome: point.genome_alias || 'N/A',
        tissue: point.annotation?.tissue || 'N/A',
        cell_line: point.fields?.['Cell Line'] || 'N/A',
        cell_type: point.annotation?.cell_type || 'N/A',
        description: point.fields?.Description || '',
        assay: point.fields?.Assay || 'N/A',
      }));
    addMultipleBedsToCart(bedItems);
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
    }, 500);
  };

  return (
    <Layout title='BEDbase | Embeddings' flexLayout>
      <div className='embedding-page'>
        <div className='embedding-page__layout'>
          <div className='embedding-page__main'>
            <div className='position-relative overflow-hidden bg-white border rounded'>
              {/* Toolbar */}
              <span className='position-absolute p-0 m-0 d-flex gap-1' style={{top: '0.5rem', right: '0.5rem', zIndex: 9999}}>
                {!!file && (
                  <span
                    className='badge rounded-2 text-bg-light border cursor-pointer fw-normal'
                    title='Locate Uploaded File'
                    onClick={() => embeddingPlotRef.current?.centerOnBedId('custom_point', 1, true)}
                  >
                    <i className='bi bi-pin-map'></i>
                  </span>
                )}
                {!!file ? (
                  <span className='d-inline-flex align-items-stretch rounded-2 overflow-hidden' style={{ lineHeight: 1 }}>
                    <span className='badge text-bg-secondary border border-secondary fw-normal rounded-0 cursor-default'>{file.name}</span>
                    <span className='badge text-bg-danger border border-danger rounded-0 cursor-pointer d-inline-flex align-items-center' title='Remove File' onClick={() => handleFileRemove()}>
                      <i className='bi bi-x-lg' />
                    </span>
                  </span>
                ) : (
                  <span
                    className='badge rounded-2 text-bg-secondary border border-secondary fw-normal cursor-pointer'
                    title='Upload BED File'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload BED
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  className='d-none'
                  type='file'
                  accept='.bed,.gz,application/gzip,application/x-gzip'
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      setFile(selectedFile);
                    }
                  }}
                />
                <span
                  className='badge rounded-2 text-bg-primary border border-primary cursor-pointer fw-normal'
                  title='Add Selection to Cart'
                  onClick={handleAddToCart}
                >
                  {addedToCart ? 'Adding...' : `Add ${effectiveSelection.length} to Cart`}
                </span>
              </span>

              <EmbeddingPlot
                ref={embeddingPlotRef}
                bedIds={bedId ? [bedId] : undefined}
                showStatus={true}
                preselectPoint={true}
                stickyInitial={true}
                centerInitial={false}
                tooltipInitial={true}
                customCoordinates={customCoordinates}
                customFilename={file?.name || undefined}
                simpleTooltip={false}
                colorGrouping={colorGrouping}
                onLegendItemsChange={setLegendItems}
                filterSelection={filterSelection}
                onFilterSelectionChange={setFilterSelection}
                selectedPoints={selectedPoints}
                onSelectedPointsChange={setSelectedPoints}
                embeddingHeight={embeddingHeight}
                onEmbeddingHeightChange={setEmbeddingHeight}
                highlightPoints={bucketPoints}
              />
            </div>
            <div className='embedding-page__secondary'>
              <div className='card border overflow-hidden mt-2' style={{ height: `calc(100vh - ${embeddingHeight + 26}px)` }}>
                <EmbeddingTable
                  selectedPoints={effectiveSelection}
                  centerOnBedId={(bedId, scale) => embeddingPlotRef.current?.centerOnBedId(bedId, scale)}
                />
              </div>
            </div>
          </div>
          <div className='embedding-page__sidebar'>
            <EmbeddingLegend
              legendItems={legendItems}
              filterSelection={filterSelection}
              handleLegendClick={(item) => embeddingPlotRef.current?.handleLegendClick(item)}
              colorGrouping={colorGrouping}
              setColorGrouping={setColorGrouping}
              onSaveCategory={handleSaveCategory}
            />
            <EmbeddingSelections
              buckets={buckets}
              onBucketsChange={(newBuckets) => {
                setBuckets(newBuckets);
                if (newBuckets.length > buckets.length) {
                  embeddingPlotRef.current?.clearRangeSelection();
                  setSelectedPoints([]);
                }
              }}
              currentSelection={selectedPoints}
            />
            <EmbeddingStats
              selectedPoints={effectiveSelection}
              colorGrouping={colorGrouping}
              legendItems={legendItems}
              filterSelection={filterSelection}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

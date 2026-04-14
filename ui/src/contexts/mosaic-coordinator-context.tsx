import { createContext, useContext, useMemo, useRef, ReactNode, useState, useEffect } from 'react';
import * as vg from '@uwdata/vgplot';
import { UMAP_PARQUET_URL } from '../const.ts';

interface MosaicCoordinatorContextType {
  getCoordinator: () => vg.Coordinator;
  initializeData: () => Promise<void>;
  addCustomPoint: (x: number, y: number, description?: string) => Promise<void>;
  deleteCustomPoint: () => Promise<void>;
  webglStatus: { checking: boolean; webgl2: boolean; error: string | null };
}

const MosaicCoordinatorContext = createContext<MosaicCoordinatorContextType | null>(null);

export const MosaicCoordinatorProvider = ({ children }: { children: ReactNode }) => {
  const coordinatorRef = useRef<vg.Coordinator | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const [webglStatus, setWebglStatus] = useState<{ checking: boolean; webgl2: boolean; error: string | null }>({
    checking: true,
    webgl2: false,
    error: null,
  });

  const getCoordinator = () => {
    if (!coordinatorRef.current) {
      coordinatorRef.current = new vg.Coordinator(vg.wasmConnector());
    }
    return coordinatorRef.current;
  };

  const doInitialize = async () => {
    const coordinator = getCoordinator();

    // Read parquet directly over HTTP with range requests (no full download needed).
    await coordinator.exec([
      vg.sql`CREATE OR REPLACE TABLE data AS
            SELECT * FROM read_parquet('${UMAP_PARQUET_URL}')`,
      vg.sql`CREATE OR REPLACE TABLE data AS
            WITH assay_counts AS (
              SELECT assay,
                (ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) - 1)::INTEGER as rank
              FROM data GROUP BY assay
            ),
            cell_line_counts AS (
              SELECT cell_line,
                (ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) - 1)::INTEGER as rank
              FROM data GROUP BY cell_line
            )
            SELECT d.*,
              CASE WHEN ac.rank < 20 THEN ac.rank ELSE 20 END AS assay_category,
              CASE WHEN cc.rank < 20 THEN cc.rank ELSE 20 END AS cell_line_category
            FROM data d
            JOIN assay_counts ac ON d.assay = ac.assay
            JOIN cell_line_counts cc ON d.cell_line = cc.cell_line` as any,
    ]);
  };

  const initializeData = async () => {
    if (!initPromiseRef.current) {
      initPromiseRef.current = doInitialize().catch((err) => {
        // Allow a retry on the next call if init failed.
        initPromiseRef.current = null;
        throw err;
      });
    }
    return initPromiseRef.current;
  };

  const deleteCustomPoint = async () => {
    const coordinator = getCoordinator();

    await coordinator.exec([vg.sql`DELETE FROM data WHERE id = 'custom_point'` as any]);
  };

  const addCustomPoint = async (x: number, y: number, description: string = 'User uploaded BED file') => {
    const coordinator = getCoordinator();

    await coordinator.exec([vg.sql`DELETE FROM data WHERE id = 'custom_point'` as any]);

    await coordinator.exec([
      vg.sql`INSERT INTO data VALUES (
        ${x},
        ${y},
        'custom_point',
        'Your uploaded file',
        '${description}',
        'Uploaded BED',
        'Uploaded BED',
        20,
        20
      )` as any,
    ]);
  };

  useEffect(() => {
    const checkGraphicsSupport = async () => {
      let webgpuAvailable = false;
      let webgl2Available = false;

      // Check WebGPU
      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu.requestAdapter();
          webgpuAvailable = !!adapter;
        } catch (error) {
          // console.error('WebGPU check failed:', error);
          webgpuAvailable = false;
        }
      }

      // Check WebGL2
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      webgl2Available = !!gl;

      if (gl) {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }

      // Force WebGL by hiding WebGPU if not available
      if (!webgpuAvailable && webgl2Available) {
        // console.log('WebGPU not available, forcing WebGL2 fallback');
        if ('gpu' in navigator) {
          Object.defineProperty(navigator, 'gpu', {
            get: () => undefined,
            configurable: true,
          });
        }
      }

      if (!webgpuAvailable && !webgl2Available) {
        setWebglStatus({
          checking: false,
          webgl2: false,
          error: 'WebGL2 is unavailable. Please enable it or use a different browser to use the Embedding Atlas.',
        });
      } else {
        setWebglStatus({
          checking: false,
          webgl2: webgl2Available,
          error: null,
        });
      }
    };

    checkGraphicsSupport();
  }, []);

  const value = useMemo(
    () => ({ getCoordinator, initializeData, addCustomPoint, deleteCustomPoint, webglStatus }),
    [webglStatus],
  );
  return <MosaicCoordinatorContext.Provider value={value}>{children}</MosaicCoordinatorContext.Provider>;
};

export const useMosaicCoordinator = () => {
  const context = useContext(MosaicCoordinatorContext);
  if (!context) {
    throw new Error('useMosaicCoordinator must be used within MosaicCoordinatorProvider');
  }
  return {
    coordinator: context.getCoordinator(),
    initializeData: context.initializeData,
    addCustomPoint: context.addCustomPoint,
    deleteCustomPoint: context.deleteCustomPoint,
    webglStatus: context.webglStatus,
  };
};
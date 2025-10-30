import { createContext, useContext, useMemo, useRef, ReactNode } from 'react';
import * as vg from '@uwdata/vgplot';

interface MosaicCoordinatorContextType {
  getCoordinator: () => vg.Coordinator;
  initializeData: () => Promise<void>;
}

const MosaicCoordinatorContext = createContext<MosaicCoordinatorContextType | null>(null);

export const MosaicCoordinatorProvider = ({ children }: { children: ReactNode }) => {
  const coordinatorRef = useRef<vg.Coordinator | null>(null);
  const dataInitializedRef = useRef<boolean>(false);

  const getCoordinator = () => {
    if (!coordinatorRef.current) {
      coordinatorRef.current = new vg.Coordinator(vg.wasmConnector());
    }
    return coordinatorRef.current;
  };

  const initializeData = async () => {
    if (dataInitializedRef.current) {
      return; // Already initialized
    }

    const coordinator = getCoordinator();
    const url = 'https://raw.githubusercontent.com/databio/bedbase-loader/master/umap/hg38_umap.json';

    await coordinator.exec([
      vg.sql`CREATE OR REPLACE TABLE data AS
            SELECT
              unnest(nodes, recursive := true)
            FROM read_json_auto('${url}')`,
      vg.sql`CREATE OR REPLACE TABLE data AS
            SELECT
              *,
              (DENSE_RANK() OVER (ORDER BY assay) - 1)::INTEGER AS assay_category,
              (DENSE_RANK() OVER (ORDER BY cell_line) - 1)::INTEGER AS cell_line_category
            FROM data` as any
    ]);

    dataInitializedRef.current = true;
  };

  const value = useMemo(() => ({ getCoordinator, initializeData }), []);
  return (
    <MosaicCoordinatorContext.Provider value={value}>
      {children}
    </MosaicCoordinatorContext.Provider>
  );
}

export const useMosaicCoordinator = () => {
  const context = useContext(MosaicCoordinatorContext);
  if (!context) {
    throw new Error('useMosaicCoordinator must be used within MosaicCoordinatorProvider');
  }
  return {
    coordinator: context.getCoordinator(),
    initializeData: context.initializeData
  };
};


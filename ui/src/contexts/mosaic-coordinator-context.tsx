import { createContext, useContext, useMemo, useRef, ReactNode } from 'react';
import * as vg from '@uwdata/vgplot';

interface MosaicCoordinatorContextType {
  getCoordinator: () => vg.Coordinator;
  initializeData: () => Promise<void>;
  addCustomPoint: (x: number, y: number) => Promise<void>;
  deleteCustomPoint: () => Promise<void>;
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

  const deleteCustomPoint = async () => {
    const coordinator = getCoordinator();

    await coordinator.exec([
      vg.sql`DELETE FROM data WHERE id = 'custom_point'` as any
    ]);
  }

  const addCustomPoint = async (x: number, y: number) => {
    const coordinator = getCoordinator();

    await coordinator.exec([
      vg.sql`DELETE FROM data WHERE id = 'custom_point'` as any
    ]);

    // Get max category indices for uploaded points (after deletion to ensure clean state)
    const maxCategories = await coordinator.query(
      `SELECT
        MAX(assay_category) as max_assay_category,
        MAX(cell_line_category) as max_cell_line_category
       FROM data`,
      { type: 'json' }
    ) as any[];

    const assayCategory = (maxCategories[0]?.max_assay_category ?? -1) + 1;
    const cellLineCategory = (maxCategories[0]?.max_cell_line_category ?? -1) + 1;

    await coordinator.exec([
      vg.sql`INSERT INTO data VALUES (
        ${x},
        ${y},
        0,
        'custom_point',
        'Your uploaded file',
        'User uploaded BED file',
        'Uploaded BED',
        'Uploaded BED',
        ${assayCategory},
        ${cellLineCategory}
      )` as any,
    ]);
  };

  const value = useMemo(() => ({ getCoordinator, initializeData, addCustomPoint, deleteCustomPoint }), []);
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
    initializeData: context.initializeData,
    addCustomPoint: context.addCustomPoint,
    deleteCustomPoint: context.deleteCustomPoint
  };
};


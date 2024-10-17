import {
  PaginationState,
  SortingState,
  createColumnHelper,
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { useState } from 'react';
import { components } from '../../../../bedbase-types';
import { OverlayTrigger, ProgressBar, Tooltip } from 'react-bootstrap';
import { roundToTwoDecimals } from '../../../utils';
import YAML from 'js-yaml';

type Bed = components['schemas']['QdrantSearchResult'];

type Props = {
  beds: Bed[];
};

const columnHelper = createColumnHelper<Bed>();

export const Bed2BedSearchResultsTable = (props: Props) => {
  const { beds } = props;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = [
    columnHelper.accessor('metadata.name', {
      cell: (info) => <span className="max-cell-width text-truncate d-inline-block">{info.getValue()}</span>,
      footer: (info) => info.column.id,
      header: 'Name',
      id: 'name',
    }),
    columnHelper.accessor('metadata.genome_alias', {
      cell: (info) => <span className="badge bg-primary">{info.getValue()}</span>,
      footer: (info) => info.column.id,
      header: 'Genome',
      id: 'genome',
    }),
    columnHelper.accessor('metadata.annotation.tissue', {
      cell: (info) => <span className="d-inline-block">{info.getValue() || 'N/A'}</span>,
      footer: (info) => info.column.id,
      header: 'Tissue',
      id: 'tissue',
    }),
    columnHelper.accessor('metadata.annotation.cell_line', {
      cell: (info) => <span className="d-inline-block">{info.getValue() || 'N/A'}</span>,
      footer: (info) => info.column.id,
      header: 'Cell line',
      id: 'cell-line',
    }),
    columnHelper.accessor('metadata.annotation.cell_type', {
      cell: (info) => <span className="d-inline-block">{info.getValue() || 'N/A'}</span>,
      footer: (info) => info.column.id,
      header: 'Cell type',
      id: 'cell-type',
    }),
    columnHelper.accessor('metadata.description', {
      cell: (info) => <span className="d-inline-block">{info.getValue()}</span>,
      footer: (info) => info.column.id,
      header: 'Description',
      id: 'description',
    }),
    columnHelper.accessor('metadata', {
      cell: (info) => (
        <OverlayTrigger
          placement="auto"
          overlay={
            <Tooltip id={`tooltip-${info.cell.id}`} className="moreinfo-tooltip">
              <pre className="text-start">
                {YAML.dump(info.getValue(), {
                  indent: 2,
                  noRefs: true,
                }) || 'No description'}
              </pre>
            </Tooltip>
          }
        >
          <span className="bi bi-info-circle"></span>
        </OverlayTrigger>
      ),
      footer: (info) => info.column.id,
      header: 'Info',
      id: 'info',
    }),
    columnHelper.accessor('score', {
      cell: (info) => (
        <span className="min-cell-width text-truncate d-inline-block">
          <ProgressBar
            min={5}
            now={info.getValue() * 100}
            label={`${roundToTwoDecimals(info.getValue() * 100)}`}
            variant="primary"
          />
        </span>
      ),
      footer: (info) => info.column.id,
      header: 'Score',
      id: 'score',
    }),
    columnHelper.accessor('metadata.annotation.cell_type', {
      cell: (info) => <span className="min-cell-width text-truncate d-inline-block">{info.getValue() || 'N/A'}</span>,
      footer: (info) => info.column.id,
      header: 'Actions',
      id: 'actions',
    }),
  ];

  const table = useReactTable({
    data: beds,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="rounded border shadow-sm p-1">
      <div className="d-flex flex-row mt-2">
        <input
          className="form-control"
          placeholder="Search files"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>
      <table className="table mb-2 text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} colSpan={header.colSpan} scope="col">
                  {header.isPlaceholder ? null : (
                    <div
                      className={header.column.getCanSort() ? 'cursor-pointer' : ''}
                      onClick={header.column.getToggleSortingHandler()}
                      title={
                        header.column.getCanSort()
                          ? header.column.getNextSortingOrder() === 'asc'
                            ? 'Sort ascending'
                            : header.column.getNextSortingOrder() === 'desc'
                            ? 'Sort descending'
                            : 'Clear sort'
                          : undefined
                      }
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="h-4" />
      <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
        <div className="d-flex flex-row align-items-center ">
          Showing
          <span className="fw-bold mx-1">
            {table.getState().pagination.pageSize * table.getState().pagination.pageIndex + 1} to{' '}
            {Math.min(
              table.getState().pagination.pageSize * (table.getState().pagination.pageIndex + 1),
              table.getRowCount(),
            )}
          </span>
          of {table.getRowCount().toLocaleString()} files
        </div>
        <div className="d-flex flex-row align-items-center gap-2">
          <div className="d-flex flex-row align-items-center btn-group">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <i className="bi bi-chevron-double-left"></i>
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
            >
              <i className="bi bi-chevron-double-right"></i>
            </button>
          </div>
          <select
            className="form-select"
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[20, 30, 40, 50, 100, 500].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

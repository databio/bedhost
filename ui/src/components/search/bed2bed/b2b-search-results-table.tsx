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
import { useBedCart } from '../../../contexts/bedcart-context';
import toast from 'react-hot-toast';

type Bed = components['schemas']['QdrantSearchResult'];

type Props = {
  beds: Bed[];
};

const columnHelper = createColumnHelper<Bed>();

const scoreTooltip = (
  <OverlayTrigger
    placement="left"
    overlay={
      <Tooltip id={`tooltip-info}`} className="moreinfo-tooltip">
          <pre className="text-start">
            Cosine similarity between files.
            Score is between 0 an 100, where 100 is a perfect match.
          </pre>
      </Tooltip>
    }
  >
      <span>
        Score*
      </span>

  </OverlayTrigger>
);

export const Bed2BedSearchResultsTable = (props: Props) => {
  const { beds } = props;
  const { cart, addBedToCart, removeBedFromCart } = useBedCart();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = [
    columnHelper.accessor('metadata', {
      cell: (info) => {
        const bedId = info.getValue()?.id;
        const bedName = info.getValue()?.name;
        return (
          <a className="m-0 p-0" href={`/bed/${bedId}`} target="_blank" rel="noreferrer">
            <span className="max-cell-width text-truncate d-inline-block">{bedName}</span>
          </a>
        );
      },
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
      cell: (info) => {
        const scoreValue = (info.getValue() ?? 0) * 100;
        const getScoreColor = (score: number) => {
          // if (score >= 80) return 'text-success';
          // if (score >= 60) return 'text-warning';
          // if (score >= 40) return 'text-info';
          // return 'text-danger';
          return 'text-success';
        };

        return (
          <span className={`fw-bold ${getScoreColor(scoreValue)}`}>
        {roundToTwoDecimals(scoreValue)}%
      </span>
        );
      },
      footer: (info) => info.column.id,
      header: () => scoreTooltip,
      id: 'score',
    }),
    columnHelper.accessor('metadata.id', {
      cell: (info) => {
        const bedId = info.getValue();
        const rowData = info.row.original; // Get the full row data

        return (
          <div>
            {cart[bedId || ''] ? (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => {
                  if (bedId === undefined) {
                    toast.error('No bed ID found', { position: 'top-center' });
                    return;
                  }
                  removeBedFromCart(bedId || '');
                }}
              >
                Remove
                <i className="bi bi-cart-dash ms-1"></i>
              </button>
            ) : (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (bedId === undefined) {
                    toast.error('No bed ID found', { position: 'top-center' });
                    return;
                  }

                  const bedItem = {
                    id: bedId,
                    name: rowData.metadata?.name || 'No name',
                    genome: rowData.metadata?.genome_alias || 'N/A',
                    tissue: rowData.metadata?.annotation?.tissue || 'N/A',
                    cell_line: rowData.metadata?.annotation?.cell_line || 'N/A',
                    cell_type: rowData.metadata?.annotation?.cell_type || 'N/A',
                    description: rowData.metadata?.description || '',
                    assay: rowData.metadata?.annotation?.assay || 'N/A',
                  };

                  addBedToCart(bedItem);
                }}
              >
                Add
                <i className="bi bi-cart-plus ms-1"></i>
              </button>
            )}
          </div>
        );
      },
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

  const handleRowClick = (id?: string) => (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('button')) {
      window.location.href = `/bed/${id}`;
    }
  };

  return (
    <div className="rounded border shadow-sm px-0 py-1">
      <div className="d-flex flex-row mt-2">
        <input
          className="form-control mx-3 my-2"
          placeholder="Search files"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>
      <table className="table mb-2 text-sm table-hover">
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
                      asc: <i className="bi bi-caret-up-fill ms-1" />,
                      desc: <i className="bi bi-caret-down-fill ms-1" />,
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
          <tr key={row.id} onClick={handleRowClick(row.original.metadata?.id)} className="cursor-pointer">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
        </tbody>
      </table>
      <div className="h-4" />
      <div className="d-flex justify-content-between align-items-center gap-2 m-3">
        <div className="d-flex flex-row align-items-center">
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

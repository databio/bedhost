import { createColumnHelper, flexRender, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { useState } from 'react';
import { useBedCart } from '../../contexts/bedcart-context';
import { components } from '../../../bedbase-types';

type Bed = components['schemas']['BedMetadataBasic'];

type Props = {
  beds: Bed[];
};

const columnHelper = createColumnHelper<Bed>();

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const RecentBedsTable = (props: Props) => {
  const { beds } = props;

  const [addedToCart, setAddedToCart] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState<string | null>(null);

  const { addBedToCart, removeBedFromCart, cart } = useBedCart();

  const columns = [
    columnHelper.accessor((row) => row.name, {
      cell: (info) => <span className='max-cell-width text-truncate d-inline-block'>{info.getValue() || 'N/A'}</span>,
      header: 'Name',
      id: 'name',
    }),
    columnHelper.accessor((row) => row.genome_alias, {
      cell: (info) => <span className='badge bg-primary'>{info.getValue() || 'N/A'}</span>,
      header: 'Genome',
      id: 'genome',
    }),
    columnHelper.accessor((row) => row.bed_compliance, {
      cell: (info) => <span className='badge bg-primary'>{info.getValue() || 'N/A'}</span>,
      header: 'Type',
      id: 'bed-type',
    }),
    columnHelper.accessor((row) => row.annotation?.organism, {
      cell: (info) => <span className='max-cell-width text-truncate'>{info.getValue() || 'N/A'}</span>,
      header: 'Species',
      id: 'species',
    }),
    columnHelper.accessor((row) => row.annotation?.tissue, {
      cell: (info) => <span className='max-cell-width text-truncate'>{info.getValue() || 'N/A'}</span>,
      header: 'Tissue',
      id: 'tissue',
    }),
    columnHelper.accessor((row) => row.annotation?.cell_type, {
      cell: (info) => <span className='max-cell-width text-truncate'>{info.getValue() || 'N/A'}</span>,
      header: 'Cell Type',
      id: 'cell-type',
    }),
    columnHelper.accessor((row) => row.annotation?.cell_line, {
      cell: (info) => <span className='max-cell-width text-truncate'>{info.getValue() || 'N/A'}</span>,
      header: 'Cell Line',
      id: 'cell-line',
    }),
    columnHelper.accessor((row) => row.annotation?.assay, {
      cell: (info) => <span className='max-cell-width text-truncate'>{info.getValue() || 'N/A'}</span>,
      header: 'Assay',
      id: 'assay',
    }),
    columnHelper.accessor((row) => row.submission_date, {
      cell: (info) => <span className='text-nowrap'>{formatDate(info.getValue())}</span>,
      header: 'Added',
      id: 'submission-date',
    }),
    columnHelper.accessor((row) => row.id, {
      cell: (info) => {
        const bedId = info.getValue();
        const rowData = info.row.original;

        return (
          <div
            className='d-flex flex-row w-100 gap-1 flex-end'
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {!cart[bedId] || (addedToCart && justAddedToCart === bedId) ? (
              <button
                onClick={() => {
                  const bedItem = {
                    id: bedId,
                    name: rowData.name || 'No name',
                    genome: rowData.genome_alias || 'N/A',
                    tissue: rowData.annotation?.tissue || 'N/A',
                    cell_line: rowData.annotation?.cell_line || 'N/A',
                    cell_type: rowData.annotation?.cell_type || 'N/A',
                    description: rowData.description || '',
                    assay: rowData.annotation?.assay || 'N/A',
                  };

                  addBedToCart(bedItem);
                  setAddedToCart(true);
                  setJustAddedToCart(bedId);
                  setTimeout(() => setAddedToCart(false), 500);
                }}
                disabled={addedToCart && justAddedToCart === bedId}
                className='btn btn-sm btn-primary'
              >
                {addedToCart && justAddedToCart === bedId ? 'Adding' : 'Add '}
                <i className='bi-cart-plus me-1'></i>
              </button>
            ) : (
              <button onClick={() => removeBedFromCart(bedId)} className='btn btn-sm btn-outline-danger'>
                <i className='bi bi-cart-x me-1'></i>
                Remove
              </button>
            )}
          </div>
        );
      },
      enableSorting: false,
      header: 'Actions',
      id: 'actions',
    }),
  ];

  const table = useReactTable({
    data: beds,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className='rounded border mb-2 p-0 bg-white'>
      <div className='table-responsive'>
        <table className='table text-sm mb-2 table-hover table'>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    scope='col'
                    className='text-right align-middle'
                    style={{ minWidth: '110px' }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className='cursor-pointer'
                onClick={() => (window.location.href = `/bed/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className='text-right align-middle small-font'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

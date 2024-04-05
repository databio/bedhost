import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useState } from 'react';
import { BedMetadataModal } from '../modals/bed-metadata-modal';
import { useBedCart } from '../../contexts/bedcart-context';

type Bed = {
  id: string;
};

type Props = {
  beds: Bed[];
};

const columnHelper = createColumnHelper<Bed>();

export const BedsTable = (props: Props) => {
  const { beds } = props;

  const [metadataModal, setMetadataModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState<string | null>(null);
  const { addBedToCart, removeBedFromCart, cart } = useBedCart();

  const columns = [
    columnHelper.accessor('id', {
      cell: (info) => <a href={`/bed/${info.getValue()}`}>{info.getValue()}</a>,
      footer: (info) => info.column.id,
      header: 'Record Identifier',
    }),
    columnHelper.accessor('id', {
      cell: (info) => (
        <div className="d-flex flex-row w-100 gap-1 flex-end">
          <button
            onClick={() => {
              setSelectedBed(beds.find((bed) => bed.id === info.getValue()) || null);
              setMetadataModal(true);
            }}
            className="btn btn-sm btn-primary"
          >
            <i className="bi bi-info-circle me-1"></i>
            View
          </button>
          {!cart.includes(info.getValue()) || (addedToCart && justAddedToCart === info.getValue()) ? (
            <button
              onClick={() => {
                addBedToCart(info.getValue());
                setAddedToCart(true);
                setJustAddedToCart(info.getValue());
                setTimeout(() => setAddedToCart(false), 500);
              }}
              disabled={addedToCart && justAddedToCart === info.getValue()}
              className="btn btn-sm btn-primary"
            >
              <i className="bi bi-cart me-1"></i>
              {addedToCart && justAddedToCart === info.getValue() ? 'Added to cart!' : 'Add to cart'}
            </button>
          ) : (
            <button onClick={() => removeBedFromCart(info.getValue())} className="btn btn-sm btn-outline-danger">
              <i className="bi bi-cart-x me-1"></i>
              Remove
            </button>
          )}
        </div>
      ),
      header: 'Actions',
    }),
  ];

  const table = useReactTable({
    data: beds,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded border shadow-sm">
      <table className="table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} scope="col">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
      <div className="h-4" />
      {selectedBed && <BedMetadataModal bed={selectedBed} show={metadataModal} setShow={setMetadataModal} />}
    </div>
  );
};
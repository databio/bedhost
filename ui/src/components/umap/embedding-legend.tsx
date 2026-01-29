import { tableau20 } from "../../utils";

type Props = {
  legendItems: string[];
  filterSelection: any;
  handleLegendClick: (item: any) => void;
  colorGrouping: string;
  setColorGrouping: (colorGrouping: string) => void;
  onSaveCategory?: (item: any) => void;
};

export const EmbeddingLegend = (props: Props) => {
  const { legendItems, filterSelection, handleLegendClick, colorGrouping, setColorGrouping, onSaveCategory } = props;

  return (
    <div className='card mb-2 border overflow-hidden' style={{ maxHeight: `calc(100vh - 93.6px)` }}>
      <div className='card-header text-xs fw-bolder border-bottom d-flex justify-content-between align-items-center'>
        <span>Legend</span>
        <div className='btn-group btn-group-xs' role='group'>
          <input
            type='radio'
            className='btn-check'
            name='color_legend'
            id='color_legend_1'
            value='cell_line_category'
            autoComplete='off'
            checked={colorGrouping === 'cell_line_category'}
            onChange={(e) => setColorGrouping(e.target.value)}
          />
          <label className='btn btn-outline-secondary' htmlFor={'color_legend_1'}>
            Cell Line
          </label>
          <input
            type='radio'
            className='btn-check'
            name='color_legend'
            id='color_legend_2'
            value='assay_category'
            autoComplete='off'
            checked={colorGrouping === 'assay_category'}
            onChange={(e) => setColorGrouping(e.target.value)}
          />
          <label className='btn btn-outline-secondary' htmlFor={'color_legend_2'}>
            Assay
          </label>
        </div>
      </div>

      <div className='card-body table-responsive p-0'>
        <table className='table table-hover text-xs mb-2'>
          <tbody>
            {legendItems?.map((item: any) => (
              <tr
                className={`text-nowrap cursor-pointer ${filterSelection?.category === item.category ? 'table-active' : ''}`}
                onClick={() => handleLegendClick(item)}
                key={item.category}
              >
                <td className='d-flex justify-content-between align-items-center' style={{ height: '30px' }}>
                  <span>
                    <i className='bi bi-square-fill me-3' style={{ color: tableau20[item.category] }} />
                    {item.name}
                  </span>
                  {filterSelection?.category === item.category && (
                    <span className='d-flex gap-1'>
                      <button className='btn btn-secondary btn-xs' onClick={(e) => { e.stopPropagation(); onSaveCategory?.(item); }}>Save Selection</button>
                      <button className='btn btn-danger btn-xs'>Clear</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

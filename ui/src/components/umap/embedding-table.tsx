type Props = {
  selectedPoints: any[];
  centerOnBedId?: (bedId: string, scale?: number) => void;
};

export const EmbeddingTable = (props: Props) => {
  const { selectedPoints, centerOnBedId } = props;

  return (
    <div className='card-body table-responsive p-0'>
      <table className='table table-striped table-hover text-xs'>
        <thead className='sticky-top'>
          <tr className='text-nowrap'>
            <th scope='col'>BED Name</th>
            <th scope='col'>Assay</th>
            <th scope='col'>Cell Line</th>
            <th scope='col'>Description</th>
            <th scope='col'></th>
          </tr>
        </thead>
        <tbody>
          {selectedPoints.filter(point => point != null).map((point: any, index: number) => (
            <tr
              className='text-nowrap cursor-pointer'
              onClick={() => centerOnBedId?.(point.identifier, 1)}
              key={point.identifier + '_' + index}
            >
              <td>{point.text}</td>
              <td>{point.fields?.Assay}</td>
              <td>{point.fields?.['Cell Line']}</td>
              <td>{point.fields?.Description}</td>
              <td className='text-center' onClick={(e) => e.stopPropagation()}>
                {point.identifier !== 'custom_point' && (
                  <a href={`/bed/${point.identifier}`} className='text-primary text-decoration-none' title='View BED page'>
                    <i className='bi bi-box-arrow-up-right' /> View
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

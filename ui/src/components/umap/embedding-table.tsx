type Props = {
  getSortedSelectedPoints: () => any;
  centerOnPoint: (point: any, scale: number) => void;
};

export const EmbeddingTable = (props: Props) => {
  const { getSortedSelectedPoints, centerOnPoint } = props;

  return (
    <div className='card-body table-responsive p-0'>
      <table className='table table-striped table-hover text-xs'>
        <thead>
          <tr className='text-nowrap'>
            <th scope='col'>BED Name</th>
            <th scope='col'>Assay</th>
            <th scope='col'>Cell Line</th>
            <th scope='col'>Description</th>
          </tr>
        </thead>
        <tbody>
          {getSortedSelectedPoints().map((point: any, index: number) => (
            <tr
              className='text-nowrap cursor-pointer'
              onClick={() => centerOnPoint(point, 0.3)}
              key={point.identifier + '_' + index}
            >
              <td>{point.text}</td>
              <td>{point.fields.Assay}</td>
              <td>{point.fields['Cell Line']}</td>
              <td>{point.fields.Description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
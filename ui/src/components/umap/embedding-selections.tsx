export type SelectionBucket = {
  id: string;
  name: string;
  points: any[];
  enabled: boolean;
};

type Props = {
  buckets: SelectionBucket[];
  onBucketsChange: (buckets: SelectionBucket[]) => void;
  currentSelection: any[];
};

export const EmbeddingSelections = (props: Props) => {
  const { buckets, onBucketsChange, currentSelection } = props;

  const handleAdd = () => {
    const newBucket: SelectionBucket = {
      id: crypto.randomUUID(),
      name: `Selection ${buckets.length + 1}`,
      points: [...currentSelection],
      enabled: true,
    };
    onBucketsChange([...buckets, newBucket]);
  };

  const handleToggle = (id: string) => {
    onBucketsChange(
      buckets.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
  };

  const handleDelete = (id: string) => {
    onBucketsChange(buckets.filter((b) => b.id !== id));
  };

  return (
    <div className="card mb-2 border overflow-hidden">
      <div className="card-header text-xs fw-bolder border-bottom d-flex justify-content-between align-items-center">
        <span>Selections</span>
        <button
          className="btn btn-secondary btn-xs"
          disabled={currentSelection.length === 0}
          onClick={handleAdd}
        >
          Save Selection ({currentSelection.length})
        </button>
      </div>

      <div className="card-body table-responsive p-0">
        {buckets.length === 0 ? (
          <p className="text-muted text-center text-xs mb-0 py-2">No saved selections</p>
        ) : (
          <table className="table table-hover text-xs mb-2">
            <tbody>
              {buckets.map((bucket) => (
                <tr key={bucket.id}>
                  <td
                    className="d-flex justify-content-between align-items-center"
                    style={{ height: '30px' }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <input
                        className="form-check-input m-0"
                        type="checkbox"
                        checked={bucket.enabled}
                        onChange={() => handleToggle(bucket.id)}
                      />
                      <span>
                        {bucket.name}{' '}
                        <span className="text-muted">({bucket.points.length})</span>
                      </span>
                    </span>
                    <i
                      className="bi bi-trash3-fill text-danger cursor-pointer"
                      onClick={() => handleDelete(bucket.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

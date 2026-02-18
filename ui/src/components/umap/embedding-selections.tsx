import { useState } from 'react';

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  const handleStartEdit = (bucket: SelectionBucket) => {
    setEditingId(bucket.id);
    setEditValue(bucket.name);
  };

  const handleConfirmEdit = () => {
    if (editingId && editValue.trim()) {
      onBucketsChange(
        buckets.map((b) => (b.id === editingId ? { ...b, name: editValue.trim() } : b))
      );
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="card mb-2 border">
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
                      {editingId === bucket.id ? (
                        <span className="d-flex align-items-center gap-1">
                          <input
                            className="form-control form-control-sm py-0 px-1"
                            style={{ fontSize: 'inherit', lineHeight: 1, minHeight: 0, height: 22, width: 100, outline: 'none', boxShadow: '0 0 0 2.5px #00808088' }}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCancelEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConfirmEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <i
                            className="bi bi-check-lg text-success cursor-pointer"
                            onMouseDown={(e) => { e.preventDefault(); handleConfirmEdit(); }}
                          />
                          <i
                            className="bi bi-x-lg text-danger cursor-pointer"
                            onMouseDown={(e) => { e.preventDefault(); handleCancelEdit(); }}
                          />
                        </span>
                      ) : (
                        <span className="cursor-pointer" onClick={() => handleStartEdit(bucket)}>
                          {bucket.name}{' '}
                          <span className="text-muted">({bucket.points.length})</span>
                        </span>
                      )}
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

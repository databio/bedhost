type Props = {
  total: number;
  offset: number;
  limit: number;
  setOffset: (offset: number) => void;
};

export const PaginationBar = (props: Props) => {
  const { total, limit, offset, setOffset } = props;
  return (
    <div className="d-flex flex-row align-items-center justify-content-center gap-1">
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => {
          setOffset(0);
        }}
        disabled={offset === 0}
      >
        Beginning
      </button>
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => {
          setOffset(offset - limit);
        }}
        disabled={offset === 0}
      >
        <i className="bi bi-arrow-left-circle me-1"></i>
        Previous
      </button>
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => {
          setOffset(offset + limit);
        }}
        disabled={total < limit}
      >
        Next
        <i className="bi bi-arrow-right-circle ms-1"></i>
      </button>
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => {
          setOffset(total - limit);
        }}
        disabled={total < limit}
      >
        End
      </button>
    </div>
  );
};

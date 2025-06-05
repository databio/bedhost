type Props = {
  total: number;
  offset: number;
  limit: number;
  setOffset: (offset: number) => void;
};

export const PaginationBar = (props: Props) => {
  const { total, limit, offset, setOffset } = props;
  return (
    <div className="row">
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
          disabled={total < limit || offset === Math.floor(total / limit) * limit}
        >
          Next
          <i className="bi bi-arrow-right-circle ms-1"></i>
        </button>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => {
            setOffset(Math.floor(total / limit) * limit);
          }}
          disabled={total < limit || offset === Math.floor(total / limit) * limit}
        >
          End
        </button>

      </div>
      <div className="text-center mt-2">
        Viewing results {offset + 1} - {Math.min(offset + limit, total)} of {total} results.
      </div>
    </div>
      );
      };

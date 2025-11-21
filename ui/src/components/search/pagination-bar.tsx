type Props = {
  total: number;
  offset: number;
  limit: number;
  setOffset: (offset: number) => void;
};

export const PaginationBar = (props: Props) => {
  const { total, limit, offset, setOffset } = props;

  const prevPrevPage = Math.floor((offset - limit - limit) / limit);
  const prevPage = Math.floor((offset - limit) / limit);
  const currentPage = Math.floor(offset / limit);
  const nextPage = Math.floor((offset + limit) / limit);
  const nextNextPage = Math.floor((offset + limit + limit) / limit);
  const lastPage = Math.ceil(total / limit);

  return (
    <div className='row'>
      <div className='d-flex flex-row align-items-center justify-content-center gap-1'>
        <button
          className='btn btn-sm btn-outline-primary border-0 text-dark'
          onClick={() => {
            setOffset(offset - limit);
          }}
          disabled={offset === 0}
        >
          <i className='bi bi-arrow-left' />
        </button>
        {(prevPrevPage >= 0) && (
          <button
            className='btn btn-sm btn-outline-primary border-0 text-muted'
            onClick={() => {
              setOffset(offset - limit - limit);
            }}
          >
            {prevPrevPage + 1}
          </button>
        )}
        {(prevPage >= 0) && (
          <button
            className='btn btn-sm btn-outline-primary border-0 text-muted'
            onClick={() => {
              setOffset(offset - limit);
            }}
          >
            {prevPage + 1}
          </button>
        )}
        <button
          className='btn btn-sm btn-outline-primary border-0 text-dark fw-bold'
          // disabled={offset === 0}
        >
          {currentPage + 1}
        </button>
        {(nextPage < lastPage) && (
          <button
            className='btn btn-sm btn-outline-primary border-0 text-muted'
            onClick={() => {
              setOffset(offset + limit);
            }}
          >
            {nextPage + 1}
          </button>
        )}
        {(nextNextPage < lastPage) && (
          <button
            className='btn btn-sm btn-outline-primary border-0 text-muted'
            onClick={() => {
              setOffset(offset + limit + limit);
            }}
          >
            {nextNextPage + 1}
          </button>
        )}
        {/* {(currentPage < lastPage) && (
          <>
            <i className='bi bi-three-dots text-sm' />
            <button
              className='btn btn-sm btn-outline-primary border-0 text-dark'
              onClick={() => {
                setOffset(Math.ceil(total / limit) * limit);
              }}
              disabled={total < limit || offset === Math.floor(total / limit) * limit}
            >
              {lastPage + 1}
            </button>
          </>
        )} */}
        <button
          className='btn btn-sm btn-outline-primary border-0 text-dark'
          onClick={() => {
            setOffset(offset + limit);
          }}
          disabled={total < limit || offset === Math.floor(total / limit) * limit}
        >
          <i className='bi bi-arrow-right' />
        </button>
      </div>
      <div className='text-center mt-1 text-xs text-muted'>
        Viewing results {offset + 1} - {Math.min(offset + limit, total)} of {total} results
      </div>
    </div>
  );
};

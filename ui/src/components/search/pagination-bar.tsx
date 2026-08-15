type Props = {
  offset: number;
  limit: number;
  setOffset: (offset: number) => void;
  // Whether a next page likely exists (i.e. the current page came back full).
  // We paginate forward without a real total, so this drives the "next" controls.
  hasMore: boolean;
};

export const PaginationBar = (props: Props) => {
  const { limit, offset, setOffset, hasMore } = props;

  const currentPage = Math.floor(offset / limit);
  const goToPage = (page: number) => setOffset(Math.max(0, page) * limit);

  return (
    <div className='row'>
      <div className='d-flex flex-row align-items-center justify-content-center gap-1'>
        <button
          className='btn btn-sm btn-outline-primary border-0 text-dark'
          onClick={() => goToPage(currentPage - 1)}
          disabled={offset === 0}
        >
          <i className='bi bi-arrow-left' />
        </button>
        {currentPage - 2 >= 0 && (
          <button
            className='btn btn-sm btn-outline-primary border-0 text-muted'
            onClick={() => goToPage(currentPage - 2)}
          >
            {currentPage - 1}
          </button>
        )}
        {currentPage - 1 >= 0 && (
          <button
            className='btn btn-sm btn-outline-primary border-0 text-muted'
            onClick={() => goToPage(currentPage - 1)}
          >
            {currentPage}
          </button>
        )}
        <button className='btn btn-sm btn-outline-primary border-0 text-dark fw-bold'>{currentPage + 1}</button>
        {hasMore && (
          <button
            className='btn btn-sm btn-outline-primary border-0 text-muted'
            onClick={() => goToPage(currentPage + 1)}
          >
            {currentPage + 2}
          </button>
        )}
        {hasMore && (
          <button
            className='btn btn-sm btn-outline-primary border-0 text-muted'
            onClick={() => goToPage(currentPage + 2)}
          >
            {currentPage + 3}
          </button>
        )}
        <button
          className='btn btn-sm btn-outline-primary border-0 text-dark'
          onClick={() => goToPage(currentPage + 1)}
          disabled={!hasMore}
        >
          <i className='bi bi-arrow-right' />
        </button>
      </div>
    </div>
  );
};

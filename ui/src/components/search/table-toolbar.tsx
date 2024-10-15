type Props = {
  showTotalResults?: boolean;
  total: number;
  limit: number;
  setLimit: (limit: number) => void;
};

export const TableToolbar = (props: Props) => {
  const { total, showTotalResults } = props;
  return (
    <div className="d-flex flex-row align-items-center justify-content-between w-100">
      {showTotalResults === true ? (
        <div className="ms-1">
          <strong>{total}</strong> results
        </div>
      ) : null}
    </div>
  );
};

type Props = {
  total: number;
  limit: number;
  setLimit: (limit: number) => void;
};

export const TableToolbar = (props: Props) => {
  const { limit, setLimit, total } = props;
  return (
    <div className="d-flex flex-row align-items-center justify-content-between w-100">
      <div className="ms-1">
        <strong>{total}</strong> results
      </div>
      <div className="d-flex flex-row align-items-center me-1">
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
          }}
          className="form-select form-select-sm"
        >
          <option>5</option>
          <option>10</option>
          <option>25</option>
          <option>50</option>
          <option>100</option>
        </select>
      </div>
    </div>
  );
};

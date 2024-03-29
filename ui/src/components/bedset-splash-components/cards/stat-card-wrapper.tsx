type Props = {
  title: string;
  children: React.ReactNode;
  learnMoreHref: string;
};

export const StatCard = (props: Props) => {
  const { title, children, learnMoreHref } = props;
  return (
    <div className="border rounded p-2 shadow-sm stat-card-height">
      <div className="d-flex flex-column align-items-center justify-content-between h-100">
        <h4 className="fw-bold text-base">{title}</h4>
        <div className="d-flex w-100 text-center">{children}</div>
        <div className="text-end">
          <a href={learnMoreHref} className="text-center mb-0 text-sm text-primary">
            Learn more
          </a>
        </div>
      </div>
    </div>
  );
};

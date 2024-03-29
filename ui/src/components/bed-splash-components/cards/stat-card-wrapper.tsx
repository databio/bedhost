type Props = {
  title: string;
  stat: string;
  learnMoreHref: string;
};

export const StatCard = (props: Props) => {
  const { title, stat, learnMoreHref } = props;
  return (
    <div className="border rounded p-2 shadow-sm stat-card-height">
      <div className="d-flex flex-column align-items-center justify-content-between h-100">
        <h4 className="fw-bold text-base">{title}</h4>
        <div className="d-flex w-100 text-center">
          <h2 className="text-center text-primary fw-bolder w-100 mb-0 text-3xl">{stat}</h2>
        </div>
        <div className="text-end">
          <a href={learnMoreHref} className="text-center mb-0 text-sm text-primary">
            Learn more
          </a>
        </div>
      </div>
    </div>
  );
};

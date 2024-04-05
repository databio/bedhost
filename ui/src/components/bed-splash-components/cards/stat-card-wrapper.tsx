import { OverlayTrigger, Tooltip } from 'react-bootstrap';

type Props = {
  title: string;
  stat: string;
  tooltip?: string;
};

export const StatCard = (props: Props) => {
  const { title, stat, tooltip } = props;

  const renderTooltip = () => <Tooltip id={`tooltip-${title}`}>{tooltip || 'No tooltip available'}</Tooltip>;

  return (
    <div className="border rounded p-2 shadow-sm stat-card-height">
      <div className="d-flex flex-column align-items-center justify-content-between h-100">
        <h4 className="fw-bold text-base">{title}</h4>
        <div className="d-flex w-100 text-center">
          <h2 className="text-center text-primary fw-bolder w-100 mb-0 text-2xl">{stat}</h2>
        </div>
        <div className="text-end">
          <OverlayTrigger placement="left" overlay={renderTooltip()} delay={{ show: 250, hide: 400 }}>
            <i className="text-sm bi bi-info-circle text-primary"></i>
          </OverlayTrigger>
        </div>
      </div>
    </div>
  );
};

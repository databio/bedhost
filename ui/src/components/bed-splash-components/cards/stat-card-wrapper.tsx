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
    <OverlayTrigger placement='right' overlay={renderTooltip()} delay={{ show: 200, hide: 200 }}>
      <div className='border rounded p-2 bed-splash-stat-card-height bg-white'>
        <div className='d-flex flex-column align-items-start justify-content-center h-100 ms-3'>
          <h6 className='text-sm'>{title}</h6>
          <div className='d-flex w-100'>
            <h4 className='text-primary fw-bolder w-100 mb-0'>{stat}</h4>
          </div>
        </div>
      </div>
    </OverlayTrigger>
  );
};

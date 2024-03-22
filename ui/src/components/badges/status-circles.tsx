type Props = {
  variant?: string;
  size?: string;
  className?: string;
};

export const StatusCircle = (props: Props) => {
  const { variant, size, className } = props;
  let highlight = '';
  switch (variant) {
    case 'primary':
      highlight = 'primary';
      break;
    case 'secondary':
      highlight = 'secondary';
      break;
    case 'success':
      highlight = 'success';
      break;
    case 'danger':
      highlight = 'danger';
      break;
    case 'warning':
      highlight = 'warning';
      break;
    case 'info':
      highlight = 'info';
      break;
    case 'light':
      highlight = 'light';
      break;
    case 'dark':
      highlight = 'dark';
      break;
    default:
      highlight = 'primary';
      break;
  }

  let padding = '';
  switch (size) {
    case 'small':
      padding = 'p-1';
      break;
    case 'medium':
      padding = 'p-2';
      break;
    case 'large':
      padding = 'p-3';
      break;
    default:
      padding = 'p-2';
      break;
  }

  let classNameString = `${padding} bg-${highlight} border border-${highlight} rounded-circle`;

  if (className) {
    classNameString = `${classNameString} ${className}`;
  }

  return <div className={classNameString} />;
};

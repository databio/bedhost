type Props = {
  height: string;
};

export const CardSkeleton = (props: Props) => {
  const { height } = props;
  return <div className="rounded bg-secondary w-100 bg-opacity-25 animate-pulse" style={{ height: height }}></div>;
};

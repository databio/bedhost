type Props = {
  height: string;
};

export const CardSkeleton = (props: Props) => {
  const { height } = props;
  return <div className="rounded bg-light w-100 bg-opacity-100 animate-pulse" style={{ height: height }}></div>;
};

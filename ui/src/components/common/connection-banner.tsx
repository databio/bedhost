import { useServiceInfo } from '../../queries/useServiceInfo';

export const ConnectionBanner = () => {
  const { data, isLoading, isError } = useServiceInfo();

  // Show banner only when there's an error or no data (and not loading)
  const showBanner = !isLoading && (isError || !data);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="alert alert-warning text-center mb-0 rounded-0 py-2" role="alert">
      Sorry, BEDbase is currently experiencing connection issues. Some features may be unavailable.
    </div>
  );
};

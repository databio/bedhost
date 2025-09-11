import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AxiosProvider } from './contexts/api-context.tsx';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BedCartProvider } from './contexts/bedcart-context.tsx';
import toast, { Toaster } from 'react-hot-toast';
import { Home } from './pages/home.tsx';
import { Metrics } from './pages/metrics.tsx';
import { UMAPGraph } from './pages/visualization.tsx';
import { HelmetProvider } from 'react-helmet-async';

// css stuff
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'highlight.js/styles/a11y-light.min.css';
import './custom.scss';

// import the pages
import { BedSplash } from './pages/bed-splash.tsx';
import { BedsetSplash } from './pages/bedset-splash.tsx';
import { BedCart } from './pages/bed-cart.tsx';
import { SearchPage } from './pages/search.tsx';

// create the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (error.response && error.response.status === 413) {
        toast.error(`${error.response.data.detail}`);
      return;}
      if (error.response && error.response.status === 415) {
        toast.error(`${error.response.data.detail}`);
      return;}
      //
      // console.error(error);
      // toast.error(`Something went wrong: ${error.message}`);
    }
  }),
});

// create the router
const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/bed/:id',
    element: <BedSplash />,
  },
  {
    path: '/bedset/:id',
    element: <BedsetSplash />,
  },
  {
    path: '/cart',
    element: <BedCart />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
  {
    path: '/metrics',
    element: <Metrics />,
  },
  {
    path: '*',
    element: <div>Not Found</div>,
  },
  {
    path: '/umap',
    element: <UMAPGraph />,
  },
]);

// entry point
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <AxiosProvider>
        <QueryClientProvider client={queryClient}>
          <BedCartProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" />
          </BedCartProvider>
          <ReactQueryDevtools initialIsOpen={true} />
        </QueryClientProvider>
      </AxiosProvider>
    </HelmetProvider>
  </React.StrictMode>,
);

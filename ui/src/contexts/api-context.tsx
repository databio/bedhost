import React, { createContext, useContext } from 'react';
import axios, { AxiosInstance } from 'axios';

type ProviderProps = {
  children: React.ReactNode;
};

// @ts-expect-error - its fine to start with undefined
const AxiosContext = createContext<{ api: AxiosInstance }>(undefined);

export const AxiosProvider = ({ children }: ProviderProps) => {
  // create global axios instance
  // **all** requests should be made via this instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
  });

  return (
    <AxiosContext.Provider
      value={{
        api,
      }}
    >
      {children}
    </AxiosContext.Provider>
  );
};

export const useBedbaseApi = () => {
  const context = useContext(AxiosContext);
  if (context === undefined) {
    throw new Error('useBedbaseApi must be used within a AxiosProvider');
  }
  return context;
};

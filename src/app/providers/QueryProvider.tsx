'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}
let browserQueryClient: QueryClient | undefined = undefined;
function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  else {
    if (!browserQueryClient)
      browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
export function QueryProvider({ children }: {
  children: ReactNode;
}) {
  const queryClient = getQueryClient();
  return (<QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>);
}
export default QueryProvider;

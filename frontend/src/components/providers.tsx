"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/toast";
import { StoreUiProvider } from "@/components/store/StoreUiContext";
import { GlobalLoading } from "@/components/ui/GlobalLoading";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 10 * 60_000,
            retry: 0,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ErrorBoundary>
        <ToastProvider>
          <StoreUiProvider>
            <Suspense fallback={null}>
              <GlobalLoading />
            </Suspense>
            {children}
          </StoreUiProvider>
        </ToastProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

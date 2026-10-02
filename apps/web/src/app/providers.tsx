"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode, lazy, Suspense } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

// Devtools are dev-only: keep them out of the production chunk graph.
const ReactQueryDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools }))
      );

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
          <Toaster
            position="bottom-center"
            expand
            visibleToasts={5}
            toastOptions={{
              classNames: {
                toast:
                  "liquid-glass-card rounded-2xl text-foreground border border-border/60 shadow-lg animate-slide-up",
                description: "text-muted-foreground",
                actionButton: "bg-primary-solid text-primary-foreground",
                cancelButton: "bg-muted text-foreground",
                closeButton: "text-muted-foreground",
              },
            }}
          />
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        </QueryClientProvider>
    </ThemeProvider>
  );
}
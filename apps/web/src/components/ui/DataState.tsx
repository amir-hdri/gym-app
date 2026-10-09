import { AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Loading / error / empty states. Mandatory on every data surface
 * (DESIGN_SYSTEM §6).
 *
 * `EmptyState` now lives in `components/ui/EmptyState.tsx`; it is re-exported
 * here unchanged so existing imports from this module keep working.
 */
export { EmptyState, type EmptyStateProps } from "@/components/ui/EmptyState";

interface LoadingProps {
  message?: string;
}

export function Loading({ message = "در حال بارگذاری..." }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20" role="status" aria-live="polite">
      <Spinner size="lg" label={null} className="text-primary" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message = "خطا در بارگذاری اطلاعات", onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center" role="alert">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        aria-hidden="true"
      >
        <AlertTriangle className="h-7 w-7" />
      </div>
      <p className="mt-4 font-medium text-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ring-focus mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-solid px-5 py-2 text-sm font-bold text-primary-foreground transition-colors duration-150 hover:bg-primary-solid/90 active:scale-[0.98]"
        >
          تلاش مجدد
        </button>
      )}
    </div>
  );
}

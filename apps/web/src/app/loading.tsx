export default function RootLoading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background gap-4"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">در حال بارگذاری...</span>
      <span
        className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground animate-pulse">در حال بارگذاری...</p>
    </div>
  );
}

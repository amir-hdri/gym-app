export default function RootLoading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">در حال بارگذاری...</span>
      <span
        className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
        aria-hidden="true"
      />
      <p className="animate-pulse text-sm text-muted-foreground">در حال بارگذاری...</p>
    </div>
  );
}

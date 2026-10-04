export default function RootLoading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0c0e12] text-white"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">در حال بارگذاری...</span>
      <span
        className="h-10 w-10 animate-spin rounded-full border-4 border-[#d2c0a5]/20 border-t-[#d2c0a5]"
        aria-hidden="true"
      />
      <p className="animate-pulse text-sm text-[#8e98a8]">در حال بارگذاری...</p>
    </div>
  );
}

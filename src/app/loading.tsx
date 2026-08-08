export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 flex flex-col items-center gap-3 anim-fade-in">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-rose-500 animate-spin" />
        <p className="text-xs text-white/40 animate-pulse">در حال بارگذاری...</p>
      </div>
    </div>
  );
}

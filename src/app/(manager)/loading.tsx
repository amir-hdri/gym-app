export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="glass-card p-6 flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-rose-500 animate-spin" />
        <p className="text-xs text-white/40">در حال بارگذاری پنل مدیریت...</p>
      </div>
    </div>
  );
}

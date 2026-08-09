export default function TrainerLoading() {
  return (
    <div className="space-y-6 anim-fade-in" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-8 w-24 bg-white/5 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
        <div className="h-72 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
      </div>
    </div>
  );
}

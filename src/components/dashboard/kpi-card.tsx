export function KpiCard({
  label,
  value,
  hint,
  delta,
  accent = "bg-rose-500",
}: {
  label: string;
  value: string;
  hint: string;
  delta?: string;
  accent?: string;
}) {
  return (
    <div className="glass-card p-5 relative overflow-hidden anim-fade-up">
      <div className={`absolute top-0 right-0 w-0.5 h-full rounded-r-xl ${accent}`}/>
      <div className="absolute top-0 left-0 right-0 h-px" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)"}}/>
      <div className="pr-2.5 text-right">
        <span className="text-[10px] text-white/40 font-medium">{label}</span>
        <p className="text-2xl font-bold tracking-tight mt-1" style={{background:"linear-gradient(135deg,#fff 60%,rgba(255,255,255,.4))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{value}</p>
        <p className="text-[10px] text-white/25 mt-1">{hint}</p>
      </div>
      {delta && (
        <span className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.07] text-white/60" dir="ltr">{delta}</span>
      )}
    </div>
  );
}

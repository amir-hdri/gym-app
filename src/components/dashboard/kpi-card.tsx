export function KpiCard({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: string;
  hint: string;
  delta?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-sm text-zinc-500">{hint}</p>
        </div>
        {delta && (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

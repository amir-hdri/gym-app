"use client";

import { useMemo, useState } from "react";
import { PageTitle, SoftCard } from "@/components/TwilightShell";

const people = [
  ["Sarah Chen", "Premium · 5 day streak"],
  ["Noah Patel", "Plus · 12 day streak"],
  ["Amelia Ruiz", "Free · new this week"],
  ["Leo Park", "Premium · 24 courses"],
];

export default function Page() {
  const [q, setQ] = useState("");
  const list = useMemo(
    () => people.filter(([n, m]) => `${n} ${m}`.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <div>
      <PageTitle title="Members" sub="1,284 practicing this month" />
      <label className="card-soft h-12 rounded-full flex items-center px-4 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search members…"
          className="bg-transparent outline-none w-full text-sm placeholder:text-[#8a847a]"
        />
      </label>
      <div className="space-y-2.5">
        {list.map(([n, m]) => (
          <SoftCard key={n} className="px-4 py-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#242424] shrink-0" />
            <div>
              <p>{n}</p>
              <p className="text-[12px] text-[#8a847a]">{m}</p>
            </div>
          </SoftCard>
        ))}
        {list.length === 0 && <p className="text-sm text-[#8a847a] text-center py-6">No members match.</p>}
      </div>
    </div>
  );
}

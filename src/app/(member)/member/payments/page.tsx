"use client";

import { useState } from "react";
import { BackLink } from "@/components/SessionRow";

const rows = [
  ["Face ID unlock", true],
  ["Share progress", false],
  ["Personalized recs", true],
] as const;

export default function PrivacyPage() {
  const [on, setOn] = useState<Record<string, boolean>>({
    "Face ID unlock": true,
    "Share progress": false,
    "Personalized recs": true,
  });

  return (
    <div className="space-y-5">
      <BackLink />
      <h1 className="font-serif text-[34px]">Privacy & Security</h1>
      <div className="card-soft rounded-[24px] divide-y divide-white/[0.06]">
        {rows.map(([label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setOn((s) => ({ ...s, [label]: !s[label] }))}
            className="flex items-center justify-between px-4 h-[58px] w-full text-left"
            aria-pressed={on[label]}
          >
            <span>{label}</span>
            <span className={`w-10 h-6 rounded-full relative ${on[label] ? "bg-[#e8dfd2]" : "bg-[#2a2a2a]"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#111] ${on[label] ? "right-0.5" : "left-0.5"}`} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

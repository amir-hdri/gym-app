"use client";

import { useState } from "react";
import { BackLink } from "@/components/SessionRow";

const seed = [
  { title: "Streak reminder", body: "You’re on day 5. A short evening sit keeps the streak alive.", time: "Today" },
  { title: "New course", body: "7 Days of Zen is ready when you are.", time: "Yesterday" },
  { title: "Plan notice", body: "Mindful Plus expires in 12 days.", time: "2d ago" },
];

export default function NotificationsPage() {
  const [read, setRead] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-5">
      <BackLink />
      <h1 className="font-serif text-[34px]">Notifications</h1>
      <div className="card-soft rounded-[24px] divide-y divide-white/[0.06]">
        {seed.map((n) => (
          <button
            key={n.title}
            type="button"
            onClick={() => setRead((r) => ({ ...r, [n.title]: true }))}
            className={`px-4 py-4 w-full text-left block h-auto min-h-0 ${read[n.title] ? "opacity-50" : ""}`}
          >
            <div className="flex justify-between gap-3">
              <p className="text-[15px]">{n.title}</p>
              <span className="text-[11px] text-[#8a847a] shrink-0">{n.time}</span>
            </div>
            <p className="text-[13px] text-[#8a847a] mt-1">{n.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

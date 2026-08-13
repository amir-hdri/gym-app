"use client";

import { useState } from "react";
import { BackLink } from "@/components/SessionRow";

const plans = [
  { id: "free", name: "Free", price: "$0", note: "3 sessions / week" },
  { id: "plus", name: "Mindful Plus", price: "$9.99", note: "Unlimited + courses" },
  { id: "studio", name: "Studio", price: "$19", note: "Live rooms & guides" },
];

export default function MembershipPage() {
  const [plan, setPlan] = useState("plus");
  const [sound, setSound] = useState("Soft rain");

  return (
    <div className="space-y-6">
      <BackLink />
      <h1 className="font-serif text-[34px]">Subscription</h1>
      <p className="text-[14px] text-[#8a847a]">Mindful Plus renews automatically unless you choose otherwise.</p>

      <div className="space-y-2.5">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlan(p.id)}
            className={`w-full card-soft rounded-[22px] p-5 flex justify-between items-center text-left ${
              plan === p.id ? "ring-1 ring-[#e8dfd2]/50" : ""
            }`}
          >
            <div>
              <p className="text-[16px]">{p.name}</p>
              <p className="text-[13px] text-[#8a847a]">{p.note}</p>
            </div>
            <p className="font-serif text-[24px]">{p.price}</p>
          </button>
        ))}
      </div>

      <div className="card-soft rounded-[24px] p-5 space-y-3">
        <p className="text-[15px]">Sound bed</p>
        {["Soft rain", "Night wind", "Temple bells"].map((s) => (
          <label key={s} className="flex items-center justify-between h-11">
            <span>{s}</span>
            <input
              type="radio"
              name="sound"
              checked={sound === s}
              onChange={() => setSound(s)}
              className="accent-[#e8dfd2]"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

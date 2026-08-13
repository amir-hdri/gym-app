"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const dest: Record<string, string> = {
  member: "/member/dashboard",
  guide: "/trainer/dashboard",
  studio: "/manager/dashboard",
};

function Form() {
  const params = useSearchParams();
  const router = useRouter();
  const initial =
    params.get("role") === "trainer" ? "guide" : params.get("role") === "manager" ? "studio" : "member";
  const [role, setRole] = useState(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(dest[role]);
      }}
    >
      <div className="grid grid-cols-3 gap-2">
        {(["member", "guide", "studio"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`h-11 rounded-full text-[13px] capitalize ${
              role === r ? "bg-[#e8dfd2] text-[#1a1a1a]" : "border border-white/10 text-[#b8b1a5]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="text-[12px] text-[#8a847a]">Email</span>
        <input
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full h-12 rounded-full card-soft px-4 bg-transparent outline-none"
          placeholder="you@twilight.app"
          autoComplete="email"
        />
      </label>
      <label className="block">
        <span className="text-[12px] text-[#8a847a]">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full h-12 rounded-full card-soft px-4 bg-transparent outline-none"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </label>
      <button type="submit" className="w-full h-12 rounded-full bg-[#e8dfd2] text-[#1a1a1a] font-medium">
        Enter
      </button>
      <div className="flex justify-between text-[13px] text-[#8a847a]">
        <Link href="/forgot-password">Forgot password</Link>
        <Link href="/sign-up">Create account</Link>
      </div>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0c0c0c] text-[#ece6dc] relative overflow-hidden">
      <img src="/hero-dusk.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-[#0c0c0c]" />
      <div className="relative min-h-[100dvh] flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[400px]">
          <p className="text-[11px] tracking-[0.2em] text-[#cfc6b8]">TWILIGHT MEDITATION</p>
          <h1 className="font-serif text-[40px] mt-2 mb-8">Welcome back</h1>
          <Suspense fallback={<div className="text-[#8a847a]">Loading…</div>}>
            <Form />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not create account");
      return;
    }
    router.push("/member/dashboard");
  }

  return (
    <div className="min-h-[100dvh] bg-[#0c0c0c] text-[#ece6dc] flex items-center justify-center px-5 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-[400px] space-y-5">
        <p className="text-[11px] tracking-[0.2em] text-[#8a847a]">TWILIGHT MEDITATION</p>
        <h1 className="font-serif text-[40px]">Begin gently</h1>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <input name="name" required className="w-full h-12 rounded-full card-soft px-4 bg-transparent outline-none" placeholder="Name" />
        <input name="email" type="email" required className="w-full h-12 rounded-full card-soft px-4 bg-transparent outline-none" placeholder="Email" />
        <input name="password" type="password" required minLength={6} className="w-full h-12 rounded-full card-soft px-4 bg-transparent outline-none" placeholder="Password" />
        <button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-[#e8dfd2] text-[#1a1a1a] font-medium">
          {loading ? "Creating…" : "Create account"}
        </button>
        <Link href="/sign-in" className="block text-center text-[13px] text-[#8a847a]">
          Already practicing? Sign in
        </Link>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not send");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-[100dvh] bg-[#0c0c0c] text-[#ece6dc] flex items-center justify-center px-5 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-[400px] space-y-5">
        <h1 className="font-serif text-[36px]">Reset password</h1>
        <p className="text-[14px] text-[#8a847a]">We’ll send a quiet note to your inbox.</p>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <input name="email" type="email" required className="w-full h-12 rounded-full card-soft px-4 bg-transparent outline-none" placeholder="Email" />
        <button type="submit" className="w-full h-12 rounded-full bg-[#e8dfd2] text-[#1a1a1a] font-medium">
          {sent ? "Sent" : "Send link"}
        </button>
        <Link href="/sign-in" className="block text-center text-[13px] text-[#8a847a]">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}

"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-strong p-8 rounded-2xl text-center max-w-sm w-full anim-scale-in">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 className="text-base font-bold text-white mb-2">خطایی رخ داد</h2>
        <p className="text-xs text-white/40 mb-5">{error.message || "خطای ناشناخته در بارگذاری صفحه"}</p>
        <button onClick={reset} className="btn-primary rounded-xl px-5 py-2.5 text-xs font-bold">
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}

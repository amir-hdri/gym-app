"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Notif {
  title: string;
  body: string;
  time: string;
  type: string;
}

interface Props {
  initialNotifs: Notif[];
  showMarkAll?: boolean;
}

const typeStyle: Record<string,{dot:string;label:string}> = {
  urgent:  { dot:"bg-rose-500 anim-dot-pulse", label:"text-rose-400" },
  success: { dot:"bg-emerald-400", label:"text-emerald-400" },
  warning: { dot:"bg-amber-400", label:"text-amber-400" },
  info:    { dot:"bg-white/20", label:"text-white/40" },
};

export default function NotificationsClient({ initialNotifs, showMarkAll = true }: Props) {
  const router = useRouter();
  const [notifs] = useState(initialNotifs);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleMarkAllRead = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications/read", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطا");
        setMessage("همه اعلان‌ها به عنوان خوانده شده علامت‌گذاری شد");
        router.refresh();
        setTimeout(() => setMessage(""), 2000);
      } catch (err: any) {
        setMessage(err.message || "خطا");
      }
    });
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="glass-card p-3 text-center text-xs text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded-xl">
          {message}
        </div>
      )}
      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/[0.05] stagger">
          {notifs.map((n, idx) => {
            const s = typeStyle[n.type] || typeStyle.info;
            return (
              <div key={idx} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors cursor-default flex-row-reverse anim-fade-up" style={{animationDelay: `${idx*30}ms`}}>
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${s.dot}`}/>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{n.body}</p>
                </div>
                <span className="text-[10px] text-white/25 shrink-0 whitespace-nowrap">{n.time}</span>
              </div>
            );
          })}
        </div>
      </div>
      {showMarkAll && notifs.length > 0 && (
        <button
          onClick={handleMarkAllRead}
          disabled={isPending}
          className="btn-glass w-full rounded-xl py-2.5 text-xs font-bold text-white/60 hover:text-white/90 disabled:opacity-50"
        >
          {isPending ? "در حال انجام..." : "علامت‌گذاری همه به عنوان خوانده شده"}
        </button>
      )}
    </div>
  );
}

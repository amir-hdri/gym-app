"use client";

import { useState, useTransition } from "react";
import { reviewFreezeRequest } from "@/server/actions/freeze";

interface FreezeRequestsClientProps {
  initialRequests: any[];
  managerUserId: string;
}

export default function FreezeRequestsClient({ initialRequests, managerUserId }: FreezeRequestsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [managerNotes, setManagerNotes] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleReview = (id: string, approved: boolean) => {
    const note = managerNotes[id] || "";
    const actionText = approved ? "تایید" : "رد";
    if (!confirm(`آیا از ${actionText} کردن این درخواست تعلیق اطمینان دارید؟`)) return;

    startTransition(async () => {
      try {
        await reviewFreezeRequest(id, approved, managerUserId, note);
        // Refresh page to load updated list
        window.location.reload();
      } catch (err: any) {
        alert(err.message || "خطایی در ثبت بررسی رخ داد");
      }
    });
  };

  const handleNoteChange = (id: string, val: string) => {
    setManagerNotes(prev => ({ ...prev, [id]: val }));
  };

  return (
    <div className="space-y-5 text-right">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">بررسی درخواست‌ها</p>
        <h1 className="text-2xl font-bold gradient-text">مدیریت درخواست‌های تعلیق</h1>
      </div>

      <div className="glass-card overflow-hidden anim-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-row-reverse">
          <h3 className="text-sm font-semibold">درخواست‌های دریافتی</h3>
          <span className="text-xs text-white/40">{requests.length} درخواست ثبت شده</span>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-white/30">درخواست تعلیقی یافت نشد.</div>
        ) : (
          <div className="divide-y divide-white/[0.04] stagger">
            {requests.map((req: any) => {
              const name = req.member?.user?.name || "کاربر باشگاه";
              const initials = name.substring(0, 2);
              const fromStr = new Date(req.requestedFrom).toLocaleDateString("fa-IR");
              const toStr = new Date(req.requestedTo).toLocaleDateString("fa-IR");
              const dateDiff = Math.ceil((new Date(req.requestedTo).getTime() - new Date(req.requestedFrom).getTime()) / (1000 * 60 * 60 * 24));
              const isPendingReq = req.status === "PENDING";
              
              return (
                <div key={req.id} className="p-5 hover:bg-white/[0.015] transition-colors space-y-4">
                  <div className="flex justify-between items-start flex-row-reverse">
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/15">{initials}</div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{name}</p>
                        <p className="text-[10px] text-white/35">کد: {req.member?.membershipCode}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                        req.status === "PENDING" ? "bg-amber-500/15 text-amber-400" : req.status === "APPROVED" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                      }`}>
                        {req.status === "PENDING" ? "در انتظار تایید" : req.status === "APPROVED" ? "تایید شده" : "رد شده"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.04]">
                    <div className="text-right">
                      <p className="text-white/40">بازه زمانی تعلیق</p>
                      <p className="font-semibold mt-0.5 text-white">{fromStr} الی {toStr}</p>
                    </div>
                    <div className="text-left font-mono">
                      <p className="text-white/40">تعداد روزها / طرح فعلی</p>
                      <p className="font-semibold mt-0.5 text-cyan-400">{dateDiff} روز / {req.subscription?.plan?.name}</p>
                    </div>
                  </div>

                  {req.reason && (
                    <div className="text-xs text-white/60 text-right">
                      <span className="text-white/30">علت درخواست:</span> {req.reason}
                    </div>
                  )}

                  {isPendingReq ? (
                    <div className="space-y-3 pt-2">
                      <div className="text-right">
                        <label className="block text-[10px] text-white/40 mb-1">یادداشت مدیر (پاسخ برای کاربر)</label>
                        <input 
                          type="text" 
                          placeholder="مثال: با مرخصی موافقت شد / مدت بیش از سقف مجاز است..."
                          value={managerNotes[req.id] || ""}
                          onChange={(e) => handleNoteChange(req.id, e.target.value)}
                          className="input-glass w-full rounded-xl px-3.5 py-2 text-xs text-right"
                        />
                      </div>
                      <div className="flex gap-2 justify-end flex-row-reverse">
                        <button 
                          onClick={() => handleReview(req.id, true)}
                          disabled={isPending}
                          className="btn-primary rounded-xl px-4 py-2 text-xs font-bold">
                          موافقت و اعمال تعلیق
                        </button>
                        <button 
                          onClick={() => handleReview(req.id, false)}
                          disabled={isPending}
                          className="btn-glass glass-card rounded-xl px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10">
                          مخالفت و رد
                        </button>
                      </div>
                    </div>
                  ) : (
                    req.managerNote && (
                      <div className="text-xs p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-right">
                        <span className="opacity-60">یادداشت مدیر:</span> {req.managerNote}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

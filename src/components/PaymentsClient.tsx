"use client";

import { useState, useTransition } from "react";
import { approvePayment, recordPayment } from "@/server/actions/payments";

interface PaymentsClientProps {
  initialPayments: any[];
  pendingSubs: any[]; // Subscriptions with status PENDING or ACTIVE that we can record payment for
  managerUserId: string;
}

export default function PaymentsClient({ initialPayments, pendingSubs, managerUserId }: PaymentsClientProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states for manual payment
  const [subId, setSubId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Calculate stats
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const paidToday = payments
    .filter(p => p.status === "PAID" && new Date(p.paidAt || p.createdAt) >= today)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingAmount = payments
    .filter(p => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalRevenue = payments
    .filter(p => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Approve a card-to-card transfer
  const handleApprove = (paymentId: string) => {
    if (!confirm("آیا از تایید این پرداخت و فعال‌سازی اشتراک مربوطه اطمینان دارید؟")) return;
    startTransition(async () => {
      try {
        await approvePayment(paymentId, managerUserId);
        window.location.reload();
      } catch (err: any) {
        alert(err.message || "خطایی رخ داد");
      }
    });
  };

  // Record manual payment
  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!subId || !amount) {
      setErrorMsg("انتخاب اشتراک و وارد کردن مبلغ الزامی است");
      return;
    }

    const formData = new FormData();
    formData.append("subscriptionId", subId);
    formData.append("amount", amount);
    formData.append("method", method);
    formData.append("note", note);
    formData.append("recordedByUserId", managerUserId);

    startTransition(async () => {
      try {
        await recordPayment(formData);
        setSuccessMsg("پرداخت دستی با موفقیت ثبت شد!");
        setTimeout(() => {
          setIsRecordModalOpen(false);
          setSubId("");
          setAmount("");
          setNote("");
          setSuccessMsg("");
          window.location.reload();
        }, 2000);
      } catch (err: any) {
        setErrorMsg(err.message || "خطا در ثبت پرداخت");
      }
    });
  };

  const methodTranslate: Record<string, string> = {
    CASH: "نقدی",
    CARD: "کارت بانکی",
    TRANSFER: "کارت به کارت",
    WALLET: "کیف پول",
    ONLINE: "درگاه آنلاین",
    OTHER: "سایر",
  };

  return (
    <div className="space-y-5 text-right">
      <div className="flex items-center justify-between flex-row-reverse anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">امور مالی</p>
          <h1 className="text-2xl font-bold gradient-text">پرداخت‌ها</h1>
        </div>
        <button 
          onClick={() => setIsRecordModalOpen(true)}
          className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg shadow-rose-950/20">
          + ثبت دستی پرداخت
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "وصول‌شده امروز", value: `${paidToday.toLocaleString("fa-IR")} تومان`, color: "text-emerald-400" },
          { label: "در انتظار تایید", value: `${pendingAmount.toLocaleString("fa-IR")} تومان`, color: "text-amber-400" },
          { label: "کل درآمد سیستم", value: `${totalRevenue.toLocaleString("fa-IR")} تومان`, color: "text-cyan-400" },
        ].map((s, i) => (
          <div key={s.label} className="glass-card p-4 anim-fade-up text-right" style={{ animationDelay: `${i * 60}ms` }}>
            <p className="text-[10px] text-white/35 mb-1.5">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Payments Table */}
      <div className="glass-card overflow-hidden hidden sm:block anim-fade-up" style={{ animationDelay: "180ms" }}>
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/[0.06] text-[10px] text-white/35 uppercase tracking-wider text-right">
          <div className="col-span-3">عضو</div>
          <div className="col-span-2">طرح</div>
          <div className="col-span-2">مبلغ و روش</div>
          <div className="col-span-2">کد پیگیری</div>
          <div className="col-span-1.5">وضعیت</div>
          <div className="col-span-1.5 text-left">عملیات</div>
        </div>
        
        <div className="divide-y divide-white/[0.04]">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/30">پرداختی ثبت نشده است.</div>
          ) : (
            payments.map((p: any) => {
              const name = p.subscription?.member?.user?.name || "کاربر ناشناس";
              const initials = name.substring(0, 2);
              const planName = p.subscription?.plan?.name || "---";
              const dateStr = new Date(p.createdAt).toLocaleDateString("fa-IR");
              const methodStr = methodTranslate[p.method] || p.method;
              const isPaid = p.status === "PAID";

              return (
                <div key={p.id} className="grid grid-cols-12 gap-3 px-5 py-3.5 hover:bg-white/[0.025] transition-colors items-center text-right text-xs">
                  <div className="col-span-3 flex items-center gap-3 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-rose-500/10 text-rose-400 border border-rose-500/15">{initials}</div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{name}</p>
                      <p className="text-[10px] text-white/35">{dateStr}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-white/70">{planName}</div>
                  <div className="col-span-2 text-right">
                    <p className="font-bold text-white">{Number(p.amount).toLocaleString("fa-IR")} تومان</p>
                    <p className="text-[10px] text-white/40">{methodStr}</p>
                  </div>
                  <div className="col-span-2 font-mono text-[10px] text-cyan-400/80" dir="ltr">{p.transactionRef || "---"}</div>
                  <div className="col-span-1.5">
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                      isPaid ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    }`}>
                      {isPaid ? "موفق" : "معلق"}
                    </span>
                  </div>
                  <div className="col-span-1.5 text-left">
                    {!isPaid && (
                      <button 
                        onClick={() => handleApprove(p.id)}
                        className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg px-2.5 py-1 font-semibold hover:bg-emerald-500/30 transition-colors">
                        تایید نهایی
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="space-y-3 sm:hidden">
        {payments.map((p: any) => {
          const name = p.subscription?.member?.user?.name || "کاربر ناشناس";
          const initials = name.substring(0, 2);
          const planName = p.subscription?.plan?.name || "---";
          const dateStr = new Date(p.createdAt).toLocaleDateString("fa-IR");
          const methodStr = methodTranslate[p.method] || p.method;
          const isPaid = p.status === "PAID";

          return (
            <div key={p.id} className="glass-card p-4 space-y-3 text-right">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/15">{initials}</div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-[10px] text-white/40">{dateStr} · {methodStr}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                  isPaid ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                }`}>{isPaid ? "موفق" : "معلق"}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs flex-row-reverse pt-2.5 border-t border-white/[0.04]">
                <div className="text-right">
                  <p className="text-white/40">طرح اشتراک</p>
                  <p className="font-semibold">{planName}</p>
                </div>
                <div className="text-left font-mono">
                  <p className="text-white/40">مبلغ پرداخت</p>
                  <p className="font-bold text-emerald-400">{Number(p.amount).toLocaleString("fa-IR")} تومان</p>
                </div>
              </div>

              {!isPaid && (
                <button 
                  onClick={() => handleApprove(p.id)}
                  className="btn-primary w-full rounded-xl py-2 text-xs font-bold mt-1">
                  تایید پرداخت
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
          <div className="w-full max-w-sm glass-strong p-6 rounded-2xl border border-white/20 text-right">
            {successMsg ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-base font-bold text-emerald-400">پرداخت ثبت شد</h3>
                <p className="text-xs text-white/60">{successMsg}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 flex-row-reverse">
                  <h2 className="text-base font-bold text-white">ثبت دستی پرداخت برای اعضا</h2>
                  <button onClick={() => setIsRecordModalOpen(false)} className="text-white/40 hover:text-white">&times;</button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">{errorMsg}</div>
                )}

                <form onSubmit={handleRecordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">انتخاب اشتراک عضو</label>
                    <select 
                      required
                      value={subId}
                      onChange={(e) => setSubId(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-right bg-[#1a0309] text-white">
                      <option value="" className="bg-[#24050e]">یک اشتراک را انتخاب کنید...</option>
                      {pendingSubs.map((s: any) => (
                        <option key={s.id} value={s.id} className="bg-[#24050e]">
                          {s.member.user.name} - طرح {s.plan.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">مبلغ (تومان)</label>
                      <input 
                        type="number" 
                        required
                        placeholder="۳۵۰۰۰۰"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="input-glass w-full rounded-xl px-3 py-2 text-xs text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">روش پرداخت</label>
                      <select 
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right bg-[#1a0309] text-white">
                        <option value="CASH" className="bg-[#24050e]">نقدی</option>
                        <option value="CARD" className="bg-[#24050e]">کارت به کارت</option>
                        <option value="TRANSFER" className="bg-[#24050e]">حواله بانکی</option>
                        <option value="ONLINE" className="bg-[#24050e]">درگاه آنلاین</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">یادداشت</label>
                    <input 
                      type="text" 
                      placeholder="توضیح دستی در مورد تراکنش..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2 flex-row-reverse">
                    <button 
                      type="submit" 
                      disabled={isPending}
                      className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold">
                      {isPending ? "در حال ثبت..." : "ثبت پرداخت"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsRecordModalOpen(false)}
                      className="btn-glass glass-card rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60">
                      انصراف
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

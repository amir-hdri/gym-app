"use client";

import { useState, useTransition } from "react";
import { createPlan, deactivatePlan } from "@/server/actions/plans";

interface PlansClientProps {
  initialPlans: any[];
}

export default function PlansClient({ initialPlans }: PlansClientProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [freezeDaysAllowed, setFreezeDaysAllowed] = useState("0");
  const [highlights, setHighlights] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name || !price || !durationDays) {
      setErrorMsg("نام طرح، قیمت و مدت زمان الزامی هستند");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("durationDays", durationDays);
    formData.append("freezeDaysAllowed", freezeDaysAllowed);
    formData.append("highlights", highlights);

    startTransition(async () => {
      try {
        await createPlan(formData);
        setSuccessMsg(`طرح ${name} با موفقیت ثبت شد!`);
        setTimeout(() => {
          setIsModalOpen(false);
          setName("");
          setPrice("");
          setDurationDays("30");
          setFreezeDaysAllowed("0");
          setHighlights("");
          setSuccessMsg("");
          window.location.reload();
        }, 2000);
      } catch (err: any) {
        setErrorMsg(err.message || "خطایی رخ داد");
      }
    });
  };

  const handleDeactivate = (id: string, planName: string) => {
    if (!confirm(`آیا از غیرفعال کردن طرح "${planName}" اطمینان دارید؟`)) return;
    startTransition(async () => {
      try {
        await deactivatePlan(id);
        window.location.reload();
      } catch (err: any) {
        alert(err.message || "خطا در غیرفعال‌سازی");
      }
    });
  };

  return (
    <div className="space-y-5 text-right">
      <div className="flex items-center justify-between flex-row-reverse anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">قیمت‌گذاری</p>
          <h1 className="text-2xl font-bold gradient-text">طرح‌های اشتراک</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary rounded-xl px-4 py-2 text-xs font-bold shadow-lg shadow-rose-950/20">
          + ایجاد طرح جدید
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.length === 0 ? (
          <div className="col-span-full glass-card p-10 text-center text-xs text-white/30">هیچ طرح فعالی یافت نشد. دکمه ایجاد طرح جدید را بزنید.</div>
        ) : (
          plans.map((plan, i) => (
            <div key={plan.id} className="glass-card p-5 relative overflow-hidden anim-fade-up text-right flex flex-col justify-between" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
              <div>
                <div className="flex items-start justify-between gap-3 mb-4 flex-row-reverse">
                  <div>
                    <h3 className="text-base font-bold text-white">{plan.name}</h3>
                    <p className="text-[10px] text-white/35 mt-1">مدت: {plan.durationDays} روز · تعلیق: {plan.freezeDaysAllowed} روز</p>
                  </div>
                  <p className="text-xl font-bold text-cyan-400">{Number(plan.price).toLocaleString("fa-IR")} تومان</p>
                </div>
                
                {plan.highlights && (
                  <ul className="space-y-2 mb-5 border-t border-white/[0.04] pt-3">
                    {plan.highlights.split(",").map((f: string) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-white/60 flex-row-reverse">
                        <svg className="w-3 h-3 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className="flex-1 text-right">{f.trim()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-2 flex-row-reverse border-t border-white/[0.04] pt-3 mt-4">
                <button 
                  onClick={() => handleDeactivate(plan.id, plan.name)}
                  className="btn-glass flex-1 rounded-xl py-2 text-xs font-semibold text-rose-400 hover:text-rose-300">
                  غیر فعال‌سازی
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
          <div className="w-full max-w-sm glass-strong p-6 rounded-2xl border border-white/20 text-right">
            {successMsg ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-base font-bold text-emerald-400">طرح ایجاد شد</h3>
                <p className="text-xs text-white/60">{successMsg}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 flex-row-reverse">
                  <h2 className="text-base font-bold text-white">ایجاد طرح اشتراک جدید</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">&times;</button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">{errorMsg}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">نام طرح</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: ماهانه الیت"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">قیمت (تومان)</label>
                      <input 
                        type="number" 
                        required
                        placeholder="مثال: ۳۵۰۰۰۰"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="input-glass w-full rounded-xl px-3 py-2 text-xs text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">مدت زمان (روز)</label>
                      <input 
                        type="number" 
                        required
                        placeholder="۳۰"
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                        className="input-glass w-full rounded-xl px-3 py-2 text-xs text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">تعداد روزهای مجاز تعلیق</label>
                    <input 
                      type="number" 
                      placeholder="۰"
                      value={freezeDaysAllowed}
                      onChange={(e) => setFreezeDaysAllowed(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2 text-xs text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">امکانات طرح (با کاما جدا کنید)</label>
                    <input 
                      type="text" 
                      placeholder="ورود با QR, رزرو کلاس, مربی خصوصی"
                      value={highlights}
                      onChange={(e) => setHighlights(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2 flex-row-reverse">
                    <button 
                      type="submit" 
                      disabled={isPending}
                      className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold">
                      {isPending ? "در حال ایجاد..." : "ایجاد طرح"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
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

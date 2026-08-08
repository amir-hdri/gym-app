"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTrainer, deactivateTrainer, activateTrainer } from "@/server/actions/trainers";

interface Trainer {
  id: string;
  name: string;
  title: string;
  members: number;
  classes: number;
  c: string;
  t: string;
  i: string;
  status: string;
  employeeCode: string;
  user?: any;
}

interface TrainersClientProps {
  initialTrainers: Trainer[];
}

export default function TrainersClient({ initialTrainers }: TrainersClientProps) {
  const router = useRouter();
  const [trainers, setTrainers] = useState(initialTrainers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("trainer123");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim() || !phone.trim()) {
      setError("نام و شماره تلفن الزامی است");
      return;
    }

    const fd = new FormData();
    fd.append("name", name);
    fd.append("phone", phone);
    fd.append("email", email);
    fd.append("title", title);
    fd.append("password", password);

    startTransition(async () => {
      try {
        await createTrainer(fd);
        setSuccess("مربی با موفقیت ایجاد شد!");
        setName(""); setPhone(""); setEmail(""); setTitle(""); setPassword("trainer123");
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess("");
          router.refresh();
        }, 1500);
      } catch (err: any) {
        setError(err.message || "خطا در ایجاد مربی");
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const action = currentStatus === "ACTIVE" ? "غیرفعال" : "فعال";
    if (!confirm(`آیا از ${action} کردن این مربی اطمینان دارید؟`)) return;
    
    startTransition(async () => {
      try {
        if (currentStatus === "ACTIVE") {
          await deactivateTrainer(id);
        } else {
          await activateTrainer(id);
        }
        router.refresh();
      } catch (err: any) {
        alert(err.message || "خطا");
      }
    });
  };

  return (
    <div className="space-y-5 text-right">
      <div className="flex items-center justify-between flex-row-reverse anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">پرسنل</p>
          <h1 className="text-2xl font-bold gradient-text">مربیان باشگاه</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary rounded-xl px-4 py-2 text-xs font-bold">
          + افزودن مربی
        </button>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {trainers.map((t,i) => (
          <div key={t.id} className="glass-card p-5 anim-fade-up text-right relative overflow-hidden group" style={{animationDelay:`${i*60}ms`}}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
            <div className="flex items-center gap-4 mb-4 flex-row-reverse">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{background:t.c,color:t.t}}>{t.i}</div>
              <div className="text-right flex-1">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{t.title}</p>
                <p className="text-[9px] text-white/25 mt-0.5 font-mono">{t.employeeCode} · {t.status === "ACTIVE" ? "فعال" : "غیرفعال"}</p>
              </div>
              <button
                onClick={() => handleToggleStatus(t.id, t.status)}
                disabled={isPending}
                className={`text-[9px] px-2.5 py-1 rounded-full border font-bold transition-colors ${t.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"}`}
              >
                {t.status === "ACTIVE" ? "فعال" : "غیرفعال"}
              </button>
            </div>
            <div className="flex gap-4 flex-row-reverse">
              <div className="glass rounded-xl px-3 py-2 text-center flex-1">
                <p className="text-lg font-bold" style={{color:t.t}}>{t.members.toLocaleString("fa-IR")}</p>
                <p className="text-[9px] text-white/35 mt-0.5">شاگردان فعال</p>
              </div>
              <div className="glass rounded-xl px-3 py-2 text-center flex-1">
                <p className="text-lg font-bold" style={{color:t.t}}>{t.classes.toLocaleString("fa-IR")}</p>
                <p className="text-[9px] text-white/35 mt-0.5">کلاس‌ها در هفته</p>
              </div>
            </div>
            {t.user?.phone && (
              <p className="text-[10px] text-white/30 mt-3 text-center font-mono" dir="ltr">{t.user.phone}</p>
            )}
          </div>
        ))}
      </div>

      {trainers.length === 0 && (
        <div className="glass-card p-10 text-center text-xs text-white/30">
          هیچ مربی ثبت نشده است. مربی جدید اضافه کنید.
        </div>
      )}

      {/* Create Trainer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
          <div className="w-full max-w-sm glass-strong p-6 rounded-2xl border border-white/20 text-right">
            <div className="flex justify-between items-center mb-4 flex-row-reverse">
              <h2 className="text-base font-bold text-white">افزودن مربی جدید</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">×</button>
            </div>

            {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">{error}</div>}
            {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl text-center mb-4">{success}</div>}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[10px] text-white/40 mb-1">نام مربی *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مربی علی" className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right" required />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 mb-1">شماره تلفن *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-left" required />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 mb-1">ایمیل (اختیاری)</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trainer@gym.com" dir="ltr" className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-left" />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 mb-1">تخصص</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="یوگا و انعطاف‌پذیری" className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right" />
              </div>
              <div>
                <label className="block text-[10px] text-white/40 mb-1">رمز عبور اولیه</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-left font-mono" dir="ltr" />
              </div>
              <div className="flex gap-2 justify-end pt-2 flex-row-reverse">
                <button type="submit" disabled={isPending} className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-60">
                  {isPending ? "در حال ایجاد..." : "ایجاد مربی"}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-glass glass-card rounded-xl px-4 py-2.5 text-xs text-white/60">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Branch {
  id?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  email?: string;
}

interface SettingsClientProps {
  initialBranch: Branch;
}

export default function SettingsClient({ initialBranch }: SettingsClientProps) {
  const router = useRouter();
  const [branch, setBranch] = useState<Branch>(initialBranch);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [reminderDays, setReminderDays] = useState("7");
  const [alertEmail, setAlertEmail] = useState(initialBranch.email || "manager@gym.com");

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        // Call server action to update branch (we'll implement via API for simplicity)
        const res = await fetch("/api/settings/branch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(branch),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطا");
        setMessage("تنظیمات باشگاه با موفقیت ذخیره شد");
        router.refresh();
        setTimeout(() => setMessage(""), 3000);
      } catch (err: any) {
        setMessage(err.message || "خطا در ذخیره");
      }
    });
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("تنظیمات یادآوری ذخیره شد (شبیه‌سازی)");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="space-y-5 text-right">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">پیکربندی</p>
        <h1 className="text-2xl font-bold gradient-text">تنظیمات سامانه</h1>
      </div>

      {message && (
        <div className="glass-card p-3 text-center text-xs text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded-xl anim-fade-in">
          {message}
        </div>
      )}

      <form onSubmit={handleSaveBranch} className="glass-card p-5 space-y-4 anim-fade-up text-right" style={{animationDelay: "80ms"}}>
        <h3 className="text-sm font-semibold text-white/80">مشخصات باشگاه ورزشی</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5 text-right">نام باشگاه</label>
            <input 
              value={branch.name || ""} 
              onChange={(e) => setBranch({...branch, name: e.target.value})}
              placeholder="باشگاه ورزشی من" 
              className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right"
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5 text-right">شماره تلفن</label>
            <input 
              value={branch.phone || ""} 
              onChange={(e) => setBranch({...branch, phone: e.target.value})}
              placeholder="۰۲۱۱۲۳۴۵۶۷۸" 
              className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right"
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5 text-right">آدرس باشگاه</label>
            <input 
              value={branch.address || ""} 
              onChange={(e) => setBranch({...branch, address: e.target.value})}
              placeholder="خیابان آزادی، پلاک ۴" 
              className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right"
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5 text-right">شهر</label>
            <input 
              value={branch.city || ""} 
              onChange={(e) => setBranch({...branch, city: e.target.value})}
              placeholder="تهران" 
              className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right"
            />
          </div>
        </div>
        <button disabled={isPending} className="btn-primary rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-60">
          {isPending ? "در حال ذخیره..." : "ذخیره تغییرات باشگاه"}
        </button>
      </form>

      <form onSubmit={handleSaveNotifications} className="glass-card p-5 space-y-4 anim-fade-up text-right" style={{animationDelay: "160ms"}}>
        <h3 className="text-sm font-semibold text-white/80">یادآوری‌ها و اعلانات</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5 text-right">ارسال یادآور تمدید (چند روز قبل)</label>
            <input 
              type="number"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              placeholder="۷" 
              className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right"
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5 text-right">ایمیل دریافت هشدارها</label>
            <input 
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="manager@gym.com" 
              className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right"
              dir="ltr"
            />
          </div>
        </div>
        <button className="btn-primary rounded-xl px-5 py-2.5 text-xs font-bold">ذخیره تنظیمات اعلان‌ها</button>
      </form>

      <div className="glass-card p-5 space-y-3 anim-fade-up" style={{animationDelay: "240ms"}}>
        <h3 className="text-sm font-semibold text-white/80 text-right">اطلاعات سیستم</h3>
        <div className="text-xs text-white/40 space-y-1.5 text-right">
          <p>نسخه اپلیکیشن: ۰.۱.۰</p>
          <p>پایگاه داده: SQLite (قابل ارتقا به PostgreSQL)</p>
          <p>احراز هویت: NextAuth v5 + bcryptjs</p>
          <p>واحد پول: تومان (IRT)</p>
          <p>زبان: فارسی (RTL)</p>
        </div>
      </div>
    </div>
  );
}

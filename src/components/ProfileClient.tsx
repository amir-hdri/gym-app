"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { updateProfile } from "@/server/actions/profile";

interface ProfileClientProps {
  user: any;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const profile = user?.memberProfile || {};

  // Form states
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [emergencyName, setEmergencyName] = useState(profile.emergencyName || "");
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyPhone || "");
  const [medicalNotes, setMedicalNotes] = useState(profile.medicalNotes || "");

  // Date of Birth format to YYYY-MM-DD
  const formatDob = (dateStr: any) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };
  const [dateOfBirth, setDateOfBirth] = useState(formatDob(profile.dateOfBirth));

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name || !phone) {
      setErrorMsg("نام و شماره تلفن الزامی هستند");
      return;
    }

    startTransition(async () => {
      try {
        await updateProfile({
          name,
          email,
          phone,
          emergencyName,
          emergencyPhone,
          dateOfBirth,
          medicalNotes,
        });
        setSuccessMsg("تغییرات با موفقیت ذخیره شد");
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err: any) {
        setErrorMsg(err.message || "خطایی رخ داد");
      }
    });
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/sign-in" });
  };

  return (
    <div className="space-y-4 text-right">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">حساب کاربری</p>
        <h1 className="text-2xl font-bold gradient-text">پروفایل کاربری</h1>
      </div>

      {/* Avatar details */}
      <div className="glass-card p-5 flex items-center gap-4 anim-fade-up flex-row-reverse" style={{ animationDelay: "60ms" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ background: "linear-gradient(135deg,rgba(201,24,74,.3),rgba(255,77,109,.2))", color: "#ff758f", border: "1px solid rgba(255,77,109,.2)" }}>
          {name ? name.substring(0, 2) : "کاربر"}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{name}</p>
          <p className="text-[10px] text-white/35 mt-0.5">عضو باشگاه · {profile.membershipCode || "---"}</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4 anim-fade-up text-right" style={{ animationDelay: "120ms" }}>
        <p className="text-xs font-semibold text-white/60">اطلاعات شناسایی</p>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl text-center">{successMsg}</div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className="block text-[10px] text-white/40 mb-1.5">نام و نام خانوادگی</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right"
            />
          </div>

          <div>
            <label className="block text-[10px] text-white/40 mb-1.5">شماره تلفن</label>
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-[10px] text-white/40 mb-1.5">ایمیل</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-left"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/40 mb-1.5">شماره تماس اضطراری</label>
              <input 
                type="tel" 
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-left"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 mb-1.5">نام تماس اضطراری</label>
              <input 
                type="text" 
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-white/40 mb-1.5">تاریخ تولد</label>
            <input 
              type="date" 
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-[10px] text-white/40 mb-1.5">ملاحظات پزشکی (در صورت وجود)</label>
            <textarea 
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="مانند مشکلات قلبی، مفصلی، آلرژی و غیره..."
              className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right h-20 resize-none"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="btn-primary w-full rounded-2xl py-3.5 text-sm font-bold mt-2">
          {isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </form>

      {/* Logout Box */}
      <div className="glass-card p-5 anim-fade-up" style={{ animationDelay: "200ms" }}>
        <p className="text-xs font-semibold text-rose-400/70 mb-3 text-right">عملیات اکانت</p>
        <button 
          onClick={handleLogout}
          className="btn-glass w-full rounded-xl py-2.5 text-xs text-rose-400/70 hover:text-rose-400 font-bold">
          خروج از حساب کاربری
        </button>
      </div>
    </div>
  );
}

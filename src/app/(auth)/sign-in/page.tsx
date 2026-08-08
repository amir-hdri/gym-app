"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setInfo("حساب شما با موفقیت ایجاد شد! اکنون وارد شوید.");
    }
    if (searchParams.get("reset") === "1") {
      setInfo("درخواست بازیابی ارسال شد. با پشتیبانی تماس بگیرید.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      phone: phone.trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("شماره تلفن یا رمز عبور اشتباه است");
      setLoading(false);
    } else if (result?.ok) {
      window.location.href = "/";
    } else {
      setError("خطای ناشناخته در ورود");
      setLoading(false);
    }
  };

  return (
    <>
      {info && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl text-center anim-fade-in font-bold mb-4">
          {info}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs px-3.5 py-2.5 rounded-xl text-center anim-fade-in font-bold mb-4">
          {error}
        </div>
      )}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="anim-fade-up d-200">
          <label className="block text-[10px] font-semibold mb-1.5 text-right" style={{color:"rgba(255,255,255,.38)"}}>شماره تلفن</label>
          <input name="phone" type="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" required
            value={phone} onChange={(e) => setPhone(e.target.value)}
            className="input-glass w-full rounded-xl px-3.5 py-3 text-sm text-right focus:text-left"/>
        </div>
        <div className="anim-fade-up d-300">
          <div className="flex justify-between items-center mb-1.5">
            <Link href="/forgot-password" className="text-[10px] text-white/30 hover:text-white/60 transition-colors">فراموشی رمز عبور؟</Link>
            <label className="block text-[10px] font-semibold text-right" style={{color:"rgba(255,255,255,.38)"}}>رمز عبور</label>
          </div>
          <input name="password" type="password" placeholder="••••••••" dir="ltr" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="input-glass w-full rounded-xl px-3.5 py-3 text-sm text-left"/>
        </div>
        <div className="anim-fade-up d-400">
          <button type="submit" disabled={loading}
            className="btn-primary w-full rounded-xl py-3 text-sm font-bold mt-2 disabled:opacity-60">
            {loading ? "در حال ورود..." : "ورود به حساب"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 d-50 anim-scale-in"
            style={{
              background:"linear-gradient(135deg,#c9184a,#ff758f)",
              boxShadow:"0 6px 20px rgba(201,24,74,.3),inset 0 1px 0 rgba(255,255,255,.22)"
            }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text anim-fade-up d-100">جیم‌اپ</h1>
          <p className="text-xs mt-1.5 anim-fade-in d-200" style={{color:"rgba(255,255,255,.38)"}}>باشگاه ورزشی شما، مدیریت‌شده به صورت حرفه‌ای</p>
        </div>

        <div className="glass-strong p-7 anim-scale-in d-50">
          <h2 className="text-base font-bold mb-1 anim-fade-up d-150">ورود به حساب</h2>
          <p className="text-xs mb-5 anim-fade-in d-200" style={{color:"rgba(255,255,255,.38)"}}>شماره تلفن و رمز عبور خود را وارد کنید</p>

          <Suspense fallback={<div className="text-xs text-white/30 text-center py-4">در حال بارگذاری...</div>}>
            <SignInForm />
          </Suspense>

          <div className="text-center mt-4 text-xs flex flex-col gap-2 anim-fade-in d-500">
            <Link href="/sign-up" className="text-white/40 hover:text-white transition-colors">
              حساب کاربری ندارید؟ ثبت نام کنید →
            </Link>
          </div>
        </div>

        <div className="text-center text-[10px] mt-5 anim-fade-in d-500 space-y-1" style={{color:"rgba(255,255,255,.2)"}}>
          <p>مدیر پیش‌فرض: <span style={{color:"rgba(255,255,255,.38)"}} dir="ltr">+1-555-0001 / admin123</span></p>
          <p>کاربر تست: <span style={{color:"rgba(255,255,255,.38)"}} dir="ltr">+1-555-1001 / member123</span></p>
        </div>
      </div>
    </div>
  );
}

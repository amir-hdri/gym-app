"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      phone,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("شماره تلفن یا رمز عبور اشتباه است");
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
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

        {/* Card */}
        <div className="glass-strong p-7 anim-scale-in d-50">
          <h2 className="text-base font-bold mb-1 anim-fade-up d-150">ورود به حساب</h2>
          <p className="text-xs mb-5 anim-fade-in d-200" style={{color:"rgba(255,255,255,.38)"}}>شماره تلفن و رمز عبور خود را وارد کنید</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs px-3.5 py-2.5 rounded-xl text-center anim-fade-in font-bold">
                {error}
              </div>
            )}
            <div className="anim-fade-up d-200">
              <label className="block text-[10px] font-semibold mb-1.5 text-right" style={{color:"rgba(255,255,255,.38)"}}>شماره تلفن</label>
              <input name="phone" type="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" required
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="input-glass w-full rounded-xl px-3.5 py-3 text-sm text-right focus:text-left"/>
            </div>
            <div className="anim-fade-up d-300">
              <label className="block text-[10px] font-semibold mb-1.5 text-right" style={{color:"rgba(255,255,255,.38)"}}>رمز عبور</label>
              <input name="password" type="password" placeholder="••••••••" dir="ltr" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-glass w-full rounded-xl px-3.5 py-3 text-sm text-left"/>
            </div>
            <div className="anim-fade-up d-400">
              <button type="submit" disabled={loading}
                className="btn-primary w-full rounded-xl py-3 text-sm font-bold mt-2">
                {loading ? "در حال ورود..." : "ورود به حساب"}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 my-4 anim-fade-in d-400">
            <div className="flex-1 h-px" style={{background:"rgba(255,255,255,.07)"}}/>
            <span className="text-[10px]" style={{color:"rgba(255,255,255,.22)"}}>یا</span>
            <div className="flex-1 h-px" style={{background:"rgba(255,255,255,.07)"}}/>
          </div>

          <button className="btn-glass w-full rounded-xl py-2.5 text-xs flex items-center justify-center gap-2 anim-fade-up d-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            ورود با حساب گوگل
          </button>
        </div>

        <div className="text-center text-[10px] mt-5 anim-fade-in d-500 space-y-1" style={{color:"rgba(255,255,255,.2)"}}>
          <p>مدیر پیش‌فرض: <span style={{color:"rgba(255,255,255,.38)"}} dir="ltr">+1-555-0001 / admin123</span></p>
          <p>کاربر تست: <span style={{color:"rgba(255,255,255,.38)"}} dir="ltr">+1-555-1001 / member123</span></p>
        </div>
      </div>
    </div>
  );
}

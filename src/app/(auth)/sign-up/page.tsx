"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name || !form.phone || !form.password) {
      setError("نام، شماره تلفن و رمز عبور الزامی هستند");
      return;
    }
    if (form.password.length < 6) {
      setError("رمز عبور حداقل باید ۶ کاراکتر باشد");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ثبت نام");
      }
      setSuccess("حساب شما با موفقیت ایجاد شد! در حال انتقال به صفحه ورود...");
      setTimeout(() => router.push("/sign-in?registered=1"), 1500);
    } catch (err: any) {
      setError(err.message || "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 anim-scale-in"
            style={{background:"linear-gradient(135deg,#c9184a,#ff758f)",boxShadow:"0 6px 20px rgba(201,24,74,.3),inset 0 1px 0 rgba(255,255,255,.22)"}}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text anim-fade-up d-100">جیم‌اپ</h1>
          <p className="text-xs mt-1.5 anim-fade-in d-200" style={{color:"rgba(255,255,255,.38)"}}>ایجاد حساب کاربری جدید</p>
        </div>

        <div className="glass-strong p-7 anim-scale-in d-50">
          <h2 className="text-base font-bold mb-1 anim-fade-up d-150">ثبت نام</h2>
          <p className="text-xs mb-5 anim-fade-in d-200" style={{color:"rgba(255,255,255,.38)"}}>مشخصات خود را برای شروع وارد کنید</p>

          {error && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs px-3.5 py-2.5 rounded-xl text-center anim-fade-in font-bold mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl text-center anim-fade-in font-bold mb-4">
              {success}
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {[
              {name:"name", type:"text", label:"نام و نام خانوادگی", placeholder:"سارا محمدی", dir:"rtl" as const},
              {name:"phone", type:"tel", label:"شماره تلفن", placeholder:"۰۹۱۲۳۴۵۶۷۸۹", dir:"ltr" as const},
              {name:"email", type:"email", label:"ایمیل (اختیاری)", placeholder:"sara@example.com", dir:"ltr" as const},
              {name:"password", type:"password", label:"رمز عبور", placeholder:"حداقل ۸ کاراکتر", dir:"ltr" as const},
            ].map((f,i) => (
              <div key={f.name} className="anim-fade-up" style={{animationDelay:`${150+i*60}ms`}}>
                <label className="block text-[10px] font-semibold mb-1.5 text-right" style={{color:"rgba(255,255,255,.38)"}}>{f.label}</label>
                <input name={f.name} type={f.type} placeholder={f.placeholder} dir={f.dir as any}
                  value={(form as any)[f.name]}
                  onChange={handleChange}
                  required={f.name !== "email"}
                  className={`input-glass w-full rounded-xl px-3.5 py-3 text-sm ${f.dir === "rtl" ? "text-right" : "text-left"}`}/>
              </div>
            ))}
            <div className="anim-fade-up d-400">
              <button type="submit" disabled={loading} className="btn-primary w-full rounded-xl py-3 text-sm font-bold mt-2">
                {loading ? "در حال ایجاد..." : "ایجاد حساب کاربری"}
              </button>
            </div>
          </form>
          <div className="text-center mt-4 text-xs anim-fade-in d-500">
            <Link href="/sign-in" className="text-white/40 hover:text-white transition-colors">
              قبلاً ثبت نام کرده‌اید؟ ورود ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

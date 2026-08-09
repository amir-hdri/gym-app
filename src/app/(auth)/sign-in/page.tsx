"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type RoleKey = "member" | "trainer" | "manager";

interface RoleConfig {
  key: RoleKey;
  label: string;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  icon: string;
  loginPlaceholder: string;
  loginLabel: string;
  buttonLabel: string;
  destinationPath: string;
  accentGradient: string;
  activeBorder: string;
  glowColor: string;
  demoUser: {
    name: string;
    phone: string;
    pass: string;
    roleDesc: string;
  };
}

const ROLES: Record<RoleKey, RoleConfig> = {
  member: {
    key: "member",
    label: "ورزشکار",
    title: "ورود ورزشکاران و اعضا",
    badge: "پنل ورزشکار",
    subtitle: "دسترسی به برنامه‌های تمرینی، کارت QR و پیگیری پیشرفت",
    description: "ورود اختصاصی ورزشکاران جهت مشاهده تمرینات روزانه، ثبت وزن و رکوردها، زمانبندی و تمدید اشتراک",
    icon: "🏃‍♂️",
    loginLabel: "شماره تلفن یا کد عضویت",
    loginPlaceholder: "+1-555-1001 یا ۰۹۱۲۳۴۵۶۷۸۹",
    buttonLabel: "ورود به پنل ورزشکار",
    destinationPath: "/member/dashboard",
    accentGradient: "linear-gradient(135deg, #c9184a, #ff758f)",
    activeBorder: "border-rose-500/50",
    glowColor: "rgba(201, 24, 74, 0.35)",
    demoUser: {
      name: "سارا محمدی",
      phone: "+1-555-1001",
      pass: "member123",
      roleDesc: "ورزشکار فعال (طرح پرمیوم)",
    },
  },
  trainer: {
    key: "trainer",
    label: "مربی",
    title: "ورود مربیان و کادر فنی",
    badge: "پنل مربی",
    subtitle: "مدیریت شاگردان، طراحی تمرینات و ثبت رکوردهای بدنی",
    description: "ورود ویژه مربیان باشگاه جهت طراحی برنامه‌های تمرینی، نظارت بر پیشرفت ورزشکاران و کلاس‌ها",
    icon: "🏋️‍♂️",
    loginLabel: "شماره تلفن یا کد پرسنلی مربی",
    loginPlaceholder: "+1-555-2001 یا TRN-001",
    buttonLabel: "ورود به پنل مربی",
    destinationPath: "/trainer/dashboard",
    accentGradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    activeBorder: "border-amber-500/50",
    glowColor: "rgba(245, 158, 11, 0.35)",
    demoUser: {
      name: "علی مرادی",
      phone: "+1-555-2001",
      pass: "trainer123",
      roleDesc: "سرمربی بدنسازی و فیتنس",
    },
  },
  manager: {
    key: "manager",
    label: "مدیر باشگاه",
    title: "ورود مدیریت و پرسنل ارشد",
    badge: "پنل مدیریت",
    subtitle: "داشبورد جامع مالی، مانیتورینگ تردد، اعضا و مربیان",
    description: "ورود مدیران ارشد و کادر پذیرش جهت کنترل کامل سیستم باشگاه، طرح‌ها، درآمد و گزارشات",
    icon: "👑",
    loginLabel: "شماره تلفن یا ایمیل مدیریت",
    loginPlaceholder: "+1-555-0001 یا admin@gym.com",
    buttonLabel: "ورود به پنل مدیریت",
    destinationPath: "/manager/dashboard",
    accentGradient: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    activeBorder: "border-purple-500/50",
    glowColor: "rgba(139, 92, 246, 0.35)",
    demoUser: {
      name: "مدیر ارشد باشگاه",
      phone: "+1-555-0001",
      pass: "admin123",
      roleDesc: "مدیر کل مجموعه",
    },
  },
};

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeRole, setActiveRole] = useState<RoleKey>("member");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync role from searchParams if provided (e.g. ?role=trainer or ?role=manager)
  useEffect(() => {
    const roleParam = searchParams.get("role")?.toLowerCase();
    if (roleParam === "trainer" || roleParam === "coach") {
      setActiveRole("trainer");
    } else if (roleParam === "manager" || roleParam === "admin" || roleParam === "owner") {
      setActiveRole("manager");
    } else if (roleParam === "member" || roleParam === "athlete") {
      setActiveRole("member");
    }

    if (searchParams.get("registered") === "1") {
      setInfo("حساب ورزشکار با موفقیت ایجاد شد! اکنون وارد شوید.");
    }
    if (searchParams.get("reset") === "1") {
      setInfo("درخواست بازیابی ارسال شد. با پشتیبانی تماس بگیرید.");
    }
  }, [searchParams]);

  const currentRole = ROLES[activeRole];

  const handleRoleSelect = (roleKey: RoleKey) => {
    setActiveRole(roleKey);
    setError("");
    // Update URL without full reload
    const params = new URLSearchParams(window.location.search);
    params.set("role", roleKey);
    router.replace(`/sign-in?${params.toString()}`);
  };

  const handleFillDemo = () => {
    setPhone(currentRole.demoUser.phone);
    setPassword(currentRole.demoUser.pass);
    setError("");
  };

  const executeLogin = async (phoneVal: string, passwordVal: string, targetPath: string) => {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        phone: phoneVal.trim(),
        password: passwordVal,
        redirect: false,
      });

      if (result?.error) {
        setError("شماره تلفن یا رمز عبور وارد شده اشتباه است");
        setLoading(false);
      } else if (result?.ok) {
        // Redirection based on callbackUrl or targetPath
        const callbackUrl = searchParams.get("callbackUrl");
        if (callbackUrl && !callbackUrl.includes("/sign-in")) {
          window.location.href = callbackUrl;
        } else {
          window.location.href = targetPath;
        }
      } else {
        setError("خطای ناشناخته در برقراری ارتباط با سرور");
        setLoading(false);
      }
    } catch {
      setError("خطا در ارسال اطلاعات به سرور");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(phone, password, currentRole.destinationPath);
  };

  const handleOneClickDemo = async () => {
    setPhone(currentRole.demoUser.phone);
    setPassword(currentRole.demoUser.pass);
    await executeLogin(currentRole.demoUser.phone, currentRole.demoUser.pass, currentRole.destinationPath);
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* 3 Separate Role Selector Tabs */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-white/50 text-right">
          نقش کاربری خود را برای ورود انتخاب کنید:
        </p>
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          {(Object.keys(ROLES) as RoleKey[]).map((key) => {
            const r = ROLES[key];
            const isSelected = activeRole === key;
            return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRoleSelect(key)}
                  aria-label={`انتخاب نقش ${r.label}`}
                  aria-pressed={isSelected}
                  aria-selected={isSelected}
                  role="tab"
                  className={`flex flex-col items-center justify-center py-3 px-1.5 rounded-xl text-xs font-bold transition-all relative group ${
                    isSelected
                      ? "text-white shadow-lg scale-[1.02]"
                      : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]"
                  }`}
                style={{
                  background: isSelected ? r.accentGradient : "transparent",
                  boxShadow: isSelected ? `0 6px 20px ${r.glowColor}` : "none",
                }}
              >
                <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{r.icon}</span>
                <span className="leading-tight text-[11px] sm:text-xs">{r.label}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-1 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Context Card */}
      <div
        className={`p-4 rounded-2xl border transition-all duration-300 ${currentRole.activeBorder} bg-white/[0.02] space-y-1.5 text-right`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentRole.icon}</span>
            <h3 className="text-xs sm:text-sm font-bold text-white">{currentRole.title}</h3>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
            style={{ background: currentRole.accentGradient }}
          >
            {currentRole.badge}
          </span>
        </div>
        <p className="text-[11px] text-white/60 leading-relaxed">
          {currentRole.subtitle}
        </p>
      </div>

      {/* Info & Error Alerts */}
      {info && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl text-center font-bold">
          {info}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs px-3.5 py-2.5 rounded-xl text-center font-bold">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="text-right">
          <label className="block text-[11px] font-semibold mb-1.5 text-white/60">
            {currentRole.loginLabel}
          </label>
          <div className="relative">
            <input
              name="phone"
              type="text"
              placeholder={currentRole.loginPlaceholder}
              dir="ltr"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label={currentRole.loginLabel}
              aria-required="true"
              className="input-glass w-full rounded-xl px-3.5 py-3 text-sm text-left font-mono"
            />
          </div>
        </div>

        <div className="text-right">
          <div className="flex justify-between items-center mb-1.5">
            <Link
              href="/forgot-password"
              className="text-[10px] text-white/40 hover:text-white/80 transition-colors"
            >
              فراموشی رمز عبور؟
            </Link>
            <label className="block text-[11px] font-semibold text-white/60">
              رمز عبور
            </label>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              dir="ltr"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glass w-full rounded-xl px-3.5 py-3 text-sm text-left pl-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors text-xs"
              title={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3.5 text-xs sm:text-sm font-bold text-white transition-all shadow-lg hover:brightness-110 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          style={{
            background: currentRole.accentGradient,
            boxShadow: `0 8px 24px ${currentRole.glowColor}`,
          }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              در حال اعتبارسنجی و ورود...
            </span>
          ) : (
            <>
              <span>{currentRole.buttonLabel}</span>
              <span>←</span>
            </>
          )}
        </button>

        {/* 1-Click Fast Demo Login for the active role */}
        <div className="pt-2 border-t border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/40">حساب آزمایشی {currentRole.label}:</span>
            <span className="text-white/80 font-bold">{currentRole.demoUser.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFillDemo}
              className="btn-glass rounded-xl py-2 px-2 text-[10px] font-semibold text-white/70 hover:text-white text-center transition-all"
            >
              تکمیل خودکار فیلدها
            </button>
            <button
              type="button"
              onClick={handleOneClickDemo}
              disabled={loading}
              className="rounded-xl py-2 px-2 text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 text-center transition-all flex items-center justify-center gap-1"
            >
              <span>⚡ ورود فوری تستی</span>
            </button>
          </div>
        </div>
      </form>

      {/* Role specific footer links */}
      <div className="text-center pt-2 text-xs flex flex-col gap-2">
        {activeRole === "member" && (
          <Link
            href="/sign-up"
            className="text-white/50 hover:text-white transition-colors"
          >
            ورزشکار جدید هستید؟ <span className="text-bubblegum_pink font-bold">ثبت نام در باشگاه ←</span>
          </Link>
        )}

        {activeRole === "trainer" && (
          <p className="text-[11px] text-white/40">
            برای ثبت نام یا دریافت حساب مربی، با مدیریت باشگاه تماس حاصل فرمایید.
          </p>
        )}

        {activeRole === "manager" && (
          <p className="text-[11px] text-white/40">
            پورتال مدیریت ارشد، نیازمند مجوز دسترسی سطح ادمین است.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden" dir="rtl">
      {/* Dynamic background glow */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-xl shadow-rose-950/40 anim-scale-in"
            style={{
              background: "linear-gradient(135deg,#c9184a,#ff758f)",
              boxShadow: "0 8px 24px rgba(201,24,74,.4), inset 0 1px 0 rgba(255,255,255,.3)",
            }}
          >
            <svg width="26" height="26" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text">سامانه هوشمند جیم‌اپ</h1>
          <p className="text-xs mt-1 text-white/50">ورود یکپارچه اعضا، مربیان و مدیریت باشگاه ورزشی</p>
        </div>

        {/* Card Container */}
        <div className="glass-strong p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl backdrop-blur-2xl anim-scale-in">
          <Suspense
            fallback={
              <div className="text-xs text-white/40 text-center py-10 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                در حال بارگذاری صفحه ورود...
              </div>
            }
          >
            <SignInForm />
          </Suspense>
        </div>

        {/* Demo Credentials Summary Bar */}
        <div
          className="mt-5 p-3.5 rounded-2xl glass border border-white/5 text-[10px] text-white/40 space-y-1.5 text-right"
        >
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <span className="font-bold text-white/60">اطلاعات کاربری نمونه جهت تست:</span>
            <span className="text-emerald-400 font-bold">آماده ورود</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-0.5">
            <div className="bg-white/[0.02] p-1.5 rounded-lg">
              <p className="text-white/70 font-semibold">🏃‍♂️ ورزشکار</p>
              <p className="font-mono text-white/40" dir="ltr">+1-555-1001</p>
              <p className="font-mono text-white/30" dir="ltr">member123</p>
            </div>
            <div className="bg-white/[0.02] p-1.5 rounded-lg">
              <p className="text-amber-300 font-semibold">🏋️‍♂️ مربی</p>
              <p className="font-mono text-white/40" dir="ltr">+1-555-2001</p>
              <p className="font-mono text-white/30" dir="ltr">trainer123</p>
            </div>
            <div className="bg-white/[0.02] p-1.5 rounded-lg">
              <p className="text-purple-300 font-semibold">👑 مدیر</p>
              <p className="font-mono text-white/40" dir="ltr">+1-555-0001</p>
              <p className="font-mono text-white/30" dir="ltr">admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

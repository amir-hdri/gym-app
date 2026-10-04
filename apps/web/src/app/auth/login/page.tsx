"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ArrowLeft, Dumbbell, MessagesSquare, TrendingUp, Sparkles, Mail, Lock, ShieldCheck, Loader2, Quote } from "lucide-react";
import { CtaButton } from "@/components/twilight/controls";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";
import { LumiWordmark } from "@/components/auth/AuthLayout";
import { useAuth } from "@/components/auth/AuthProvider";

const inputClassName =
  "h-12 w-full rounded-xl border border-[#232934] bg-[#161a22] pe-11 ps-4 text-sm text-white placeholder:text-[#5b6472] transition-all duration-200 focus:border-[#d2c0a5]/60 focus:outline-none focus:ring-2 focus:ring-[#d2c0a5]/15 disabled:opacity-60";

function SignInContent() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    setSubmitError(null);
    try {
      await login(data.email, data.password, data.rememberMe);
      router.push("/athlete");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "ورود ناموفق بود");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
        <label htmlFor="email" className="mb-2 block text-xs font-medium text-[#8e98a8]">
          ایمیل
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            dir="ltr"
            placeholder="your@email.com"
            disabled={isSubmitting}
            className={`${inputClassName} text-left`}
            {...register("email", {
              required: "ایمیل ضروری است",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "فرمت ایمیل نامعتبر است",
              },
            })}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5b6472]">
            <Mail className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>
        {errors.email?.message && <p className="mt-1.5 text-xs text-[#f87171]">{errors.email.message}</p>}
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
        <label htmlFor="password" className="mb-2 block text-xs font-medium text-[#8e98a8]">
          رمز عبور
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isSubmitting}
            className={`${inputClassName} pl-11`}
            {...register("password", {
              required: "رمز عبور ضروری است",
              minLength: { value: 6, message: "رمز باید حداقل ۶ کاراکتر باشد" },
            })}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5b6472]">
            <Lock className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8e98a8] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d2c0a5]/40"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
            aria-pressed={showPassword}
            tabIndex={0}
          >
            {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        </div>
        {errors.password?.message && <p className="mt-1.5 text-xs text-[#f87171]">{errors.password.message}</p>}
      </motion.div>

      {submitError && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#f87171]/20 bg-[#f87171]/10 px-4 py-3 text-center text-sm text-[#f87171]"
        >
          {submitError}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap items-center justify-between gap-2"
      >
        <label className="group flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#232934] bg-[#161a22] text-[#d2c0a5] accent-[#d2c0a5]"
            {...register("rememberMe")}
          />
          <span className="text-sm text-[#8e98a8] transition-colors group-hover:text-white">
            مرا به خاطر بسپار
          </span>
        </label>
        <Link href="/auth/forgot-password" className="rounded-md text-sm font-medium text-[#d2c0a5] transition-colors hover:text-[#ded1bc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d2c0a5]/40">
          فراموشی رمز؟
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <CtaButton type="submit" disabled={isSubmitting} className="w-full text-sm font-bold">
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              در حال ورود…
            </span>
          ) : (
            "ورود به حساب"
          )}
        </CtaButton>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex items-center justify-center gap-1.5 text-[11px] text-[#6b7280]"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-[#d2c0a5]/70" strokeWidth={1.75} />
        اطلاعات شما با رمزنگاری محافظت می‌شود
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-[#8e98a8]"
      >
        عضو نیستی؟{" "}
        <Link href="/auth/register" className="inline-flex items-center gap-1 font-semibold text-[#d2c0a5] transition-colors hover:text-[#ded1bc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d2c0a5]/40 rounded-md">
          ثبت‌نام کن
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </motion.p>
    </form>
  );
}

const FEATURES = [
  { icon: Dumbbell, title: "برنامه تمرینی شخصی", desc: "طراحی‌شده برای بدن و هدف تو" },
  { icon: MessagesSquare, title: "مربی اختصاصی", desc: "ارتباط مستقیم و پیگیری مداوم" },
  { icon: TrendingUp, title: "پیشرفت قابل دیدن", desc: "آمار و نمودار رشد هر هفته" },
];

const STATS = [
  { value: "۲٬۴۰۰+", label: "ورزشکار فعال" },
  { value: "۱۵۰+", label: "برنامه تمرینی" },
  { value: "۹۸٪", label: "رضایت اعضا" },
];

/** Showcase panel — desktop scenic side with headline, features and stats. */
function ShowcasePanel() {
  return (
    <div className="relative hidden h-full w-full overflow-hidden lg:block">
      <GymBackdrop className="absolute inset-0" />
      {/* Warm golden glow + readability scrims */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 45% at 50% 100%, rgba(210,192,165,0.14) 0%, transparent 65%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#07090c]/70 via-transparent to-transparent" />

      {/* Floating mini progress card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-10 top-24 z-10 w-44 rounded-2xl border border-white/10 bg-[#10141a]/85 p-4 shadow-2xl shadow-black/50 backdrop-blur-md"
      >
        <p className="text-[10px] font-medium tracking-wide text-[#8e98a8]">فعالیت روزانه</p>
        <p className="mt-1 font-serif text-3xl text-white" dir="ltr">78%</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1b2029]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "78%" }}
            transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-[#d2c0a5]"
          />
        </div>
        <p className="mt-2 text-[10px] text-[#8e98a8]">تکمیل‌شده امروز</p>
      </motion.div>

      <div className="relative z-10 flex h-full flex-col justify-end p-12 text-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d2c0a5]/30 bg-[#d2c0a5]/10 px-4 py-1.5 text-xs font-medium text-[#d2c0a5]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
            باشگاه دیجیتال بانوان
          </p>
          <h2 className="font-serif text-5xl font-medium leading-[1.4]">
            قوی‌تر از
            <br />
            <span className="text-[#d2c0a5]">دیروزت</span> باش.
          </h2>
        </motion.div>

        <div className="mt-8 flex flex-col gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.45 }}
              className="flex items-center gap-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d2c0a5]/25 bg-[#d2c0a5]/10 text-[#d2c0a5]">
                <f.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">{f.title}</span>
                <span className="block text-xs text-[#8e98a8]">{f.desc}</span>
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex items-center gap-8 border-t border-white/10 pt-6"
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-serif text-2xl text-[#d2c0a5]">{s.value}</p>
              <p className="mt-0.5 text-[11px] text-[#8e98a8]">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Testimonial */}
        <motion.figure
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
        >
          <Quote className="h-4 w-4 text-[#d2c0a5]/60" strokeWidth={1.75} />
          <blockquote className="mt-2 text-[13px] leading-6 text-[#c9cfd9]">
            «با لومی بالاخره تونستم برنامه‌م رو منظم نگه دارم؛ مربی‌م هر هفته پیگیرمه.»
          </blockquote>
          <figcaption className="mt-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#202634] font-serif text-xs text-[#d2c0a5]">س</span>
            <span className="text-[11px] text-[#8e98a8]">سارا م. — عضو از ۱۴۰۲</span>
          </figcaption>
        </motion.figure>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[#07090c] text-white lg:flex-row">
      {/* ── Mobile scenic hero ─────────────────────────────── */}
      <div className="relative h-[34svh] min-h-[260px] w-full shrink-0 overflow-hidden lg:hidden">
        <GymBackdrop className="absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 55% at 50% 100%, rgba(210,192,165,0.16) 0%, transparent 65%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07090c]/40 via-transparent to-[#07090c]" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top)] text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <LumiWordmark />
            <h1 className="mt-4 font-serif text-4xl font-normal leading-snug">
              خوش برگشتی
            </h1>
            <p className="mt-1.5 text-sm text-[#c9cfd9]">
              ادامه‌ی مسیرت از همین‌جا شروع می‌شه
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Desktop showcase ───────────────────────────────── */}
      <div className="relative hidden w-[54%] shrink-0 lg:block">
        <ShowcasePanel />
      </div>

      {/* ── Form column / mobile bottom sheet ──────────────── */}
      <div className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[32px] border-t border-white/10 bg-[#0c0e12] px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-7 lg:mt-0 lg:items-center lg:justify-center lg:rounded-none lg:border-0 lg:bg-[#0c0e12] lg:px-10 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="mx-auto w-full max-w-[420px]"
        >
          {/* Desktop heading */}
          <div className="mb-7 hidden text-right lg:block">
            <LumiWordmark />
            <h1 className="mt-5 font-serif text-4xl font-normal text-white">
              خوش برگشتی
            </h1>
            <p className="mt-2 text-sm text-[#8e98a8]">
              وارد حساب کاربری‌ات شو و ادامه بده
            </p>
          </div>

          {/* Form card */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#10141a] p-6 shadow-2xl shadow-black/50 sm:p-7">
            {/* Premium top highlight */}
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#d2c0a5]/50 to-transparent" />
            <SignInContent />
          </div>

          {/* Mobile feature strip */}
          <div className="mt-6 grid grid-cols-3 gap-2 lg:hidden">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.1 }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/5 bg-[#10141a] px-2 py-3 text-center"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d2c0a5]/10 text-[#d2c0a5]">
                  <f.icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-[10px] font-semibold leading-4 text-white">{f.title}</span>
              </motion.div>
            ))}
          </div>

          <p className="mt-6 text-center text-[11px] leading-5 text-[#6b7280]">
            با ورود،{" "}
            <Link
              href="/terms"
              className="text-[#8e98a8] underline underline-offset-4 transition-colors hover:text-white"
            >
              شرایط استفاده
            </Link>{" "}
            را می‌پذیری
          </p>
        </motion.div>
      </div>
    </div>
  );
}

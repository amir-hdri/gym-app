"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { CtaButton } from "@/components/twilight/controls";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";
import { LumiWordmark } from "@/components/auth/AuthLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { homeForRole, panelLabelForRole } from "@/components/auth/auth-helpers";
import { USE_MOCK } from "@/hooks/api-source";

const inputClassName =
  "h-12 w-full rounded-xl border border-[#232934] bg-[#161a22] pe-11 ps-4 text-sm text-white placeholder:text-[#5b6472] transition-all duration-200 focus:border-[#d2c0a5]/60 focus:outline-none focus:ring-2 focus:ring-[#d2c0a5]/15 disabled:opacity-60";

interface DemoAccount {
  email: string;
  password: string;
  label: string;
}

/**
 * Mock mode signs in against the offline fixtures (every seeded mock user
 * shares one password); the real backend signs in against its seed rows.
 */
const MOCK_DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "mohammadi@gymapp.ir", password: "Lumi1234", label: "ورزشکار" },
  { email: "mohseni@gymapp.ir", password: "Lumi1234", label: "مربی" },
  { email: "reception@gymapp.ir", password: "Lumi1234", label: "پذیرش" },
  { email: "admin@gymapp.ir", password: "Lumi1234", label: "مدیر" },
];

const SEED_DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "athlete1@gymapp.ir", password: "athlete123", label: "ورزشکار" },
  { email: "coach1@gymapp.ir", password: "coach123", label: "مربی" },
  { email: "reception@gymapp.ir", password: "reception123", label: "پذیرش" },
  { email: "admin@gymapp.ir", password: "admin123", label: "مدیر" },
];

const DEMO_ACCOUNTS = USE_MOCK ? MOCK_DEMO_ACCOUNTS : SEED_DEMO_ACCOUNTS;
const SHOW_DEMO_ACCOUNTS = process.env.NODE_ENV !== "production";

function SignInContent() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  // A restored session makes this page a dead end; send it where it belongs.
  useEffect(() => {
    if (isAuthenticated && user) router.replace(homeForRole(user.role));
  }, [isAuthenticated, user, router]);

  const onSubmit = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    setSubmitError(null);
    try {
      const signedIn = await login(data.email, data.password, data.rememberMe);
      toast.success(`خوش آمدی — ${panelLabelForRole(signedIn.role)}`);
      router.replace(homeForRole(signedIn.role));
    } catch (err) {
      const message = err instanceof Error ? err.message : "ورود ناموفق بود";
      setSubmitError(message);
      toast.error(message);
    }
  };

  const fillDemoAccount = (account: DemoAccount) => {
    setSubmitError(null);
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
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

      {SHOW_DEMO_ACCOUNTS && (
        <div className="rounded-2xl border border-dashed border-[#232934] bg-[#161a22]/60 p-4">
          <p className="text-xs font-semibold text-white">حساب‌های نمایشی (فقط محیط توسعه)</p>
          <p className="mt-1 text-[11px] leading-5 text-[#8e98a8]">
            یکی را انتخاب کن تا فرم پر شود؛ بعد «ورود به حساب» را بزن.
          </p>
          <div className="mt-3 flex flex-wrap gap-2" aria-live="polite">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemoAccount(account)}
                className="inline-flex min-h-11 items-center rounded-xl border border-[#232934] bg-[#10141a] px-3 text-xs font-medium text-white transition-colors hover:border-[#d2c0a5]/60 hover:text-[#d2c0a5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d2c0a5]/40"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#07090c] px-4 py-8 text-white">
      {/* Subtle atmospheric scenic background */}
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <GymBackdrop />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(210,192,165,0.08) 0%, rgba(7,9,12,0.85) 60%, #07090c 100%)",
        }}
      />

      {/* Centered form card container */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] flex flex-col items-center"
      >
        {/* Centered Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <LumiWordmark />
          <h1 className="mt-4 font-serif text-3xl font-normal text-white sm:text-4xl">
            خوش برگشتی
          </h1>
          <p className="mt-1.5 text-xs text-[#8e98a8]">
            وارد حساب کاربری‌ات شو و تمرینت رو ادامه بده
          </p>
        </div>

        {/* Form Card */}
        <div className="relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#10141a]/95 p-6 shadow-2xl shadow-black/70 backdrop-blur-xl sm:p-8">
          {/* Top subtle highlight */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#d2c0a5]/50 to-transparent" />
          <SignInContent />
        </div>

        {/* Footer Terms Note */}
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
  );
}

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
import { LumiLogo } from "@/components/ui/LumiLogo";
import { fadeIn, scaleIn } from "@/lib/motion";
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger";
import { useAuth } from "@/components/auth/AuthProvider";
import { homeForRole, panelLabelForRole } from "@/components/auth/auth-helpers";
import { USE_MOCK } from "@/hooks/api-source";

const inputClassName =
  "h-12 w-full rounded-xl border border-border bg-card pe-11 ps-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-60";

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
      {/* Fields paint statically: entrance animation on interactive controls
          reads as latency, not polish. Motion answers actions here (error,
          press, demo pick) instead. */}
      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-medium text-muted-foreground">
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
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${inputClassName} text-left`}
            {...register("email", {
              required: "ایمیل ضروری است",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "فرمت ایمیل نامعتبر است",
              },
            })}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Mail className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>
        {errors.email?.message && <p id="email-error" role="alert" className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-xs font-medium text-muted-foreground">
          رمز عبور
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isSubmitting}
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`${inputClassName} pl-11`}
            {...register("password", {
              required: "رمز عبور ضروری است",
              minLength: { value: 6, message: "رمز باید حداقل ۶ کاراکتر باشد" },
            })}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Lock className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <button
            type="button"
            className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
            aria-pressed={showPassword}
            tabIndex={0}
          >
            {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        </div>
        {errors.password?.message && <p id="password-error" role="alert" className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {submitError && (
        <motion.p
          role="alert"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="animate-shake rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
        >
          {submitError}
        </motion.p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="group flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border bg-card text-primary accent-primary"
            {...register("rememberMe")}
          />
          <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
            مرا به خاطر بسپار
          </span>
        </label>
        <Link href="/auth/forgot-password" className="rounded-md text-sm font-medium text-primary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          فراموشی رمز؟
        </Link>
      </div>

      <div>
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
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary/70" strokeWidth={1.75} aria-hidden />
        اطلاعات شما با رمزنگاری محافظت می‌شود
      </div>

      <p className="text-center text-sm text-muted-foreground">
        عضو نیستی؟{" "}
        <Link href="/auth/register" className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md">
          ثبت‌نام کن
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        </Link>
      </p>

      {SHOW_DEMO_ACCOUNTS && (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-4">
          <p className="text-xs font-semibold text-foreground">حساب‌های نمایشی (فقط محیط توسعه)</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            یکی را انتخاب کن تا فرم پر شود؛ بعد «ورود به حساب» را بزن.
          </p>
          {/* The single orchestrated micro-moment on this form: chips cascade once. */}
          <StaggerContainer className="mt-3 flex flex-wrap gap-2" aria-live="polite">
            {DEMO_ACCOUNTS.map((account) => (
              <StaggerItem key={account.email}>
                <button
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  className="inline-flex min-h-11 items-center rounded-xl border border-cream-foreground/25 bg-cream/20 px-3 text-xs font-medium text-foreground transition-all duration-150 hover:-translate-y-px hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:translate-y-0"
                >
                  {account.label}
                </button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <main id="main" className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground">
      {/* Subtle atmospheric scenic background */}
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <GymBackdrop />
      </div>
      {/* Theme-aware vignette over the scenic backdrop: the legacy dark
          scrim stays exact in dark mode; light gets a warm paper glow so the
          foreground-ink header stays legible. */}
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(210,192,165,0.08) 0%, rgba(7,9,12,0.85) 60%, #07090c 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, color-mix(in srgb, var(--color-background) 80%, transparent) 60%, var(--color-background) 100%)",
        }}
      />

      {/* Centered form card container — the ONE entrance on this screen */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[420px] flex flex-col items-center"
      >
        {/* Centered Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <LumiLogo size="md" variant="auto" glow ariaLabel="Lumi Wellness" />
          <h1 className="mt-4 font-serif text-3xl font-normal text-foreground sm:text-4xl">
            خوش برگشتی
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            وارد حساب کاربری‌ات شو و تمرینت رو ادامه بده
          </p>
        </div>

        {/* Form Card */}
        <div className="relative w-full">
          {/* Pastel aura behind the card — blush glow, calm in dark, warm in light */}
          <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[36px] bg-blush/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-border bg-popover/95 p-6 shadow-2xl shadow-scrim/70 backdrop-blur-xl sm:p-8">
            {/* Top pastel accent — thin blush-to-cream gradient hairline */}
            <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-blush-solid to-cream" />
            <SignInContent />
          </div>
        </div>

        {/* Footer Terms Note */}
        <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">
          با ورود،{" "}
          <Link
            href="/terms"
            className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            شرایط استفاده
          </Link>{" "}
          را می‌پذیری
        </p>
      </motion.div>
    </main>
  );
}

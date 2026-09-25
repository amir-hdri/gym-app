"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Mail, Lock, Heart, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LumiLogo } from "@/components/ui/LumiLogo";
import { useAuth } from "@/components/auth/AuthProvider";

function FloatingBlur() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-[8%] top-[-12%] h-[520px] w-[520px] rounded-full bg-activity-move/[0.07] blur-[100px]" />
      <div className="absolute right-[6%] top-[18%] h-[420px] w-[420px] rounded-full bg-activity-exercise/[0.06] blur-[90px]" />
      <div className="absolute bottom-[-12%] right-[12%] h-[460px] w-[460px] rounded-full bg-activity-stand/[0.07] blur-[110px]" />
      <div className="absolute bottom-[10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-foreground/[0.02] blur-[80px]" />
    </div>
  );
}

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
        <Input
          id="email"
          label="ایمیل"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          dir="ltr"
          placeholder="your@email.com"
          startAdornment={<Mail className="h-4.5 w-4.5" />}
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register("email", {
            required: "ایمیل ضروری است",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "فرمت ایمیل نامعتبر است",
            },
          })}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
        <Input
          id="password"
          label="رمز عبور"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          startAdornment={<Lock className="h-4.5 w-4.5" />}
          endAdornment={
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
              aria-pressed={showPassword}
              tabIndex={0}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register("password", {
            required: "رمز عبور ضروری است",
            minLength: { value: 6, message: "رمز باید حداقل ۶ کاراکتر باشد" },
          })}
        />
      </motion.div>

      {submitError && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive text-center bg-destructive/10 rounded-xl px-4 py-3 border border-destructive/20"
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
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-primary focus:ring-ring/40 focus:ring-2"
            {...register("rememberMe")}
          />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            مرا به خاطر بسپار
          </span>
        </label>
        <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md">
          فراموشی رمز؟
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20"
        >
          <Heart className="h-4 w-4 ml-2" strokeWidth={2} />
          ورود
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-center text-sm text-muted-foreground"
      >
        عضو نیستی؟{" "}
        <Link href="/auth/register" className="font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md">
          ثبت‌نام کن
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </motion.p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 lg:p-10">
      <FloatingBlur />
      <div className="relative z-10 w-full max-w-[440px]">

        <div className="liquid-glass-card rounded-2xl text-card-foreground transition-all duration-300 overflow-visible border-border/60 shadow-[0_28px_80px_-35px_rgba(80,20,70,.45)] dark:border-white/10">
          <div className="relative p-8">
            <div className="mb-8 flex flex-col items-center gap-2 text-foreground">
              <LumiLogo size="lg" variant="auto" showSubtitle showDivider />
              <p className="text-[11px] text-muted-foreground leading-tight">پلتفرم مدیریت هوشمند باشگاه</p>
            </div>

            <SignInContent />
          </div>
        </div>
      </div>
    </div>
  );
}

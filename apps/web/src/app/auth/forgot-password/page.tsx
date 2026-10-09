"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CtaButton } from "@/components/twilight/controls";
import { apiErrorMessage } from "@/components/auth/auth-helpers";
import { useForgotPassword } from "@/hooks/use-api";
import { formatPersianNumber } from "@/lib/utils";
import { ArrowRight, CheckCircle2, KeyRound } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [isSent, setIsSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  /**
   * Present only outside production and only when the address exists. The
   * project has no mail transport, so this token is the working path to the
   * reset form in dev.
   */
  const [devToken, setDevToken] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const isSubmitting = forgotPassword.isPending;

  async function requestLink(email: string) {
    setSubmitError(null);
    try {
      const response = await forgotPassword.mutateAsync({ email });
      if (!response.success) throw new Error(response.error);
      // Anti-enumeration: the reply is identical whether or not the address
      // exists, so the copy below must not claim an account was found.
      setSentEmail(email);
      setDevToken(response.data?.devToken ?? null);
      setIsSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("درخواست بازیابی ثبت شد");
    } catch (error) {
      const message = apiErrorMessage(error, "ارسال درخواست انجام نشد. کمی بعد دوباره تلاش کن.");
      setSubmitError(message);
      toast.error(message);
    }
  }

  const onSubmit = async (data: ForgotFormData) => {
    await requestLink(data.email);
  };

  const onResend = async () => {
    const email = getValues("email") || sentEmail;
    if (!email || cooldown > 0) return;
    await requestLink(email);
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-[32px] border border-border bg-popover p-8 text-foreground shadow-2xl shadow-black/50"
      >
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">بازیابی رمز عبور</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود
          </p>
        </div>

        {isSent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-success/30 bg-success/10">
              <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={1.75} />
            </div>
            <p className="text-sm leading-7 text-muted-foreground" aria-live="polite">
              اگر <span dir="ltr" className="font-medium text-foreground">{sentEmail}</span> در سامانه ثبت شده
              باشد، لینک بازیابی یک‌بارمصرف برایش ساخته شده است. برای حفظ حریم خصوصی، این پیام برای
              ایمیل ثبت‌شده و ثبت‌نشده یکسان است.
            </p>
            {devToken && process.env.NODE_ENV !== "production" && (
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-right">
                <p className="text-xs leading-6 text-muted-foreground">
                  محیط توسعه — سرویس ایمیل راه‌اندازی نشده، پس توکن همین‌جا نمایش داده می‌شود تا مسیر
                  بازیابی را تا انتها طی کنی.
                </p>
                <Link
                  href={`/auth/reset-password?token=${encodeURIComponent(devToken)}`}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/50 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <KeyRound className="h-4 w-4" strokeWidth={1.75} />
                  رفتن به فرم رمز جدید
                </Link>
              </div>
            )}
            <div className="space-y-2">
              <CtaButton
                type="button"
                onClick={onResend}
                disabled={isSubmitting || cooldown > 0}
                className="w-full text-sm"
              >
                {cooldown > 0
                  ? `ارسال دوباره (${formatPersianNumber(cooldown)} ثانیه)`
                  : isSubmitting
                    ? "در حال ارسال…"
                    : "ارسال دوباره"}
              </CtaButton>
              <p className="text-[11px] text-muted-foreground" aria-live="polite">
                {cooldown > 0 ? `برای ارسال دوباره ${formatPersianNumber(cooldown)} ثانیه صبر کن.` : ""}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSent(false);
                  setSubmitError(null);
                }}
                className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                ارسال با ایمیل دیگر
              </button>
            </div>
            <Link
              href="/auth/login"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary"
            >
              بازگشت به ورود
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <label htmlFor="email" className="mb-2 block text-xs text-muted-foreground">
                ایمیل
              </label>
              <input
                id="email"
                type="email"
                dir="ltr"
                placeholder="your@email.com"
                autoComplete="email"
                inputMode="email"
                className={inputClassName}
                {...register("email")}
              />
              {errors.email?.message && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </motion.div>

            {submitError && (
              <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                {submitError}
              </p>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <CtaButton type="submit" disabled={isSubmitting} className="w-full text-sm">
                {isSubmitting ? "در حال ارسال…" : "ارسال لینک بازیابی"}
              </CtaButton>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center">
              <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                بازگشت به صفحه ورود
              </Link>
            </motion.div>
          </form>
        )}
      </motion.div>
    </AuthLayout>
  );
}

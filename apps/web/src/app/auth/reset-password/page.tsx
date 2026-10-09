"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CtaButton } from "@/components/twilight/controls";
import { CheckCircle2 } from "lucide-react";
import { useResetPassword } from "@/hooks/use-api";
import { apiErrorMessage } from "@/components/auth/auth-helpers";

const resetSchema = z
  .object({
    // Mirrors the server policy (8+ chars, ≥1 letter and ≥1 digit) so a
    // rejection is caught here, not as a 422 round trip.
    password: z
      .string()
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
      .regex(/[A-Za-z]/, "رمز عبور باید حداقل یک حرف داشته باشد")
      .regex(/\d/, "رمز عبور باید حداقل یک رقم داشته باشد"),
    confirmPassword: z.string().min(1, "تکرار رمز عبور را وارد کنید"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isDone, setIsDone] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const reset = useResetPassword();

  useEffect(() => {
    if (!token) router.replace("/auth/forgot-password");
  }, [token, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetFormData) => {
    setTokenError(null);
    try {
      await reset.mutateAsync({ token, password: data.password });
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setIsDone(true);
    } catch (error) {
      // Unknown, used, or expired grant — the only recovery is a fresh link.
      setTokenError(apiErrorMessage(error, "این لینک معتبر نیست یا منقضی شده است"));
    }
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
          <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">رمز عبور جدید</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            رمز عبور جدید خود را وارد کنید
          </p>
        </div>

        {isDone ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-success/30 bg-success/10">
              <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-muted-foreground">رمز عبور با موفقیت تغییر کرد.</p>
            <CtaButton onClick={() => router.push("/auth/login")} className="mt-4 text-sm">
              ورود به Lumi Wellness
            </CtaButton>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {tokenError && (
              <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs leading-6 text-destructive">
                {tokenError}{" "}
                <Link href="/auth/forgot-password" className="font-semibold underline underline-offset-4">
                  دریافت لینک تازه
                </Link>
              </p>
            )}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <label htmlFor="password" className="mb-2 block text-xs text-muted-foreground">
                رمز عبور جدید
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className={inputClassName}
                {...register("password")}
              />
              {errors.password?.message && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <label htmlFor="confirmPassword" className="mb-2 block text-xs text-muted-foreground">
                تکرار رمز عبور
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className={inputClassName}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword?.message && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <CtaButton type="submit" disabled={reset.isPending} className="w-full text-sm">
                {reset.isPending ? "در حال تغییر…" : "تغییر رمز عبور"}
              </CtaButton>
            </motion.div>
          </form>
        )}
      </motion.div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

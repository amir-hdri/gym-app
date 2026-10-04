"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CtaButton } from "@/components/twilight/controls";
import { CheckCircle2 } from "lucide-react";

const resetSchema = z
  .object({
    password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
    confirmPassword: z.string().min(1, "تکرار رمز عبور را وارد کنید"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

const inputClassName =
  "h-11 w-full rounded-xl border border-[#232934] bg-[#161a22] px-4 text-sm text-white placeholder:text-[#6b7280] focus:border-[#d2c0a5]/50 focus:outline-none";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

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

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setIsDone(true);
    } catch {
      toast.error("خطا در تغییر رمز");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-[32px] border border-white/10 bg-[#10141a] p-8 text-white shadow-2xl shadow-black/50"
      >
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl font-medium tracking-tight text-white">رمز عبور جدید</h1>
          <p className="mt-2 text-sm text-[#8e98a8]">
            رمز عبور جدید خود را وارد کنید
          </p>
        </div>

        {isDone ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#4ade80]/30 bg-[#4ade80]/10">
              <CheckCircle2 className="h-7 w-7 text-[#4ade80]" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-[#8e98a8]">رمز عبور با موفقیت تغییر کرد.</p>
            <CtaButton onClick={() => router.push("/auth/login")} className="mt-4 text-sm">
              ورود به Lumi Wellness
            </CtaButton>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <label htmlFor="password" className="mb-2 block text-xs text-[#8e98a8]">
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
              {errors.password?.message && <p className="mt-1 text-xs text-[#f87171]">{errors.password.message}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <label htmlFor="confirmPassword" className="mb-2 block text-xs text-[#8e98a8]">
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
              {errors.confirmPassword?.message && <p className="mt-1 text-xs text-[#f87171]">{errors.confirmPassword.message}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <CtaButton type="submit" disabled={isSubmitting} className="w-full text-sm">
                {isSubmitting ? "در حال تغییر…" : "تغییر رمز عبور"}
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d2c0a5] border-t-transparent" />
        </div>
      </AuthLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

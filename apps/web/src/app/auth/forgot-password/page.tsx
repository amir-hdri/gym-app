"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CtaButton } from "@/components/twilight/controls";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

const inputClassName =
  "h-11 w-full rounded-xl border border-[#232934] bg-[#161a22] px-4 text-sm text-white placeholder:text-[#6b7280] focus:border-[#d2c0a5]/50 focus:outline-none";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("لینک بازیابی ارسال شد");
      setIsSent(true);
    } catch {
      toast.error("خطا در ارسال");
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
          <h1 className="font-serif text-2xl font-medium tracking-tight text-white">بازیابی رمز عبور</h1>
          <p className="mt-2 text-sm text-[#8e98a8]">
            ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود
          </p>
        </div>

        {isSent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#4ade80]/30 bg-[#4ade80]/10">
              <CheckCircle2 className="h-7 w-7 text-[#4ade80]" strokeWidth={1.75} />
            </div>
            <p className="text-sm leading-relaxed text-[#8e98a8]">
              لینک بازیابی به ایمیل شما ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.
            </p>
            <Link
              href="/auth/login"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#d2c0a5] transition-colors hover:text-[#ded1bc]"
            >
              بازگشت به ورود
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <label htmlFor="email" className="mb-2 block text-xs text-[#8e98a8]">
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
              {errors.email?.message && <p className="mt-1 text-xs text-[#f87171]">{errors.email.message}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <CtaButton type="submit" disabled={isSubmitting} className="w-full text-sm">
                {isSubmitting ? "در حال ارسال…" : "ارسال لینک بازیابی"}
              </CtaButton>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center">
              <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-[#8e98a8] transition-colors hover:text-[#d2c0a5]">
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

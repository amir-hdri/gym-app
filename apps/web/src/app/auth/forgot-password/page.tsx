"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

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

  const onSubmit = async (data: ForgotFormData) => {
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
      >
        <Card className="border-border/60 shadow-lg shadow-black/5 dark:shadow-black/20">
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight">بازیابی رمز عبور</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود
              </p>
            </div>

            {isSent ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  لینک بازیابی به ایمیل شما ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.
                </p>
                <Link
                  href="/auth/login"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  بازگشت به ورود
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  <div className="relative">
                    <Mail className="absolute right-3.5 top-[2.7rem] h-4.5 w-4.5 text-muted-foreground/40 pointer-events-none z-10" />
                    <Input
                      label="ایمیل"
                      type="email"
                      placeholder="your@email.com"
                      error={errors.email?.message}
                      className="pr-10"
                      {...register("email")}
                    />
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Button type="submit" loading={isSubmitting} className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20">
                    ارسال لینک بازیابی
                  </Button>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center">
                  <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowRight className="h-3.5 w-3.5" />
                    بازگشت به صفحه ورود
                  </Link>
                </motion.div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AuthLayout>
  );
}

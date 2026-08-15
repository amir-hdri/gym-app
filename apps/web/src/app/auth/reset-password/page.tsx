"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Lock, CheckCircle2 } from "lucide-react";

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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-border/60 shadow-lg shadow-black/5 dark:shadow-black/20">
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight">رمز عبور جدید</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                رمز عبور جدید خود را وارد کنید
              </p>
            </div>

            {isDone ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm text-muted-foreground">رمز عبور با موفقیت تغییر کرد.</p>
                <Button onClick={() => router.push("/auth/login")} className="mt-4">
                  ورود به جیم‌آپ
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-[2.7rem] h-4.5 w-4.5 text-muted-foreground/40 pointer-events-none z-10" />
                    <Input label="رمز عبور جدید" type="password" placeholder="••••••••" error={errors.password?.message} className="pr-10" {...register("password")} />
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <Input label="تکرار رمز عبور" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Button type="submit" loading={isSubmitting} className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20">
                    تغییر رمز عبور
                  </Button>
                </motion.div>
              </form>
            )}
          </CardContent>
        </Card>
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

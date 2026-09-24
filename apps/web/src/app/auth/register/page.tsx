"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowRight } from "lucide-react";
import { validateIranianPhone } from "@/lib/utils";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "نام را وارد کنید").max(50),
    lastName: z.string().min(1, "نام خانوادگی را وارد کنید").max(50),
    email: z.string().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
    phone: z.string().min(1, "شماره موبایل را وارد کنید").refine((val) => validateIranianPhone(val), "شماره موبایل نامعتبر است"),
    password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
    confirmPassword: z.string().min(1, "تکرار رمز عبور را وارد کنید"),
    acceptTerms: z.boolean().refine((accepted) => accepted, "پذیرش قوانین الزامی است"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const registeredUser = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      toast.success("ثبت‌نام با موفقیت انجام شد");
      if (registeredUser) {
        router.replace("/athlete");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "ثبت‌نام ناموفق بود";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="border-border/60 shadow-lg shadow-black/5 dark:shadow-black/20">
          <CardContent className="p-5 sm:p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight">ثبت‌نام</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                حساب کاربری ورزشکار بساز — مربیان توسط مدیریت دعوت می‌شوند
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="نام" placeholder="سارا" error={errors.firstName?.message} autoComplete="given-name" {...register("firstName")} />
                  <Input label="نام خانوادگی" placeholder="محمدی" error={errors.lastName?.message} autoComplete="family-name" {...register("lastName")} />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <Input label="ایمیل" type="email" placeholder="your@email.com" error={errors.email?.message} autoComplete="email" inputMode="email" {...register("email")} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Input label="شماره موبایل" type="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" error={errors.phone?.message} autoComplete="tel" inputMode="tel" {...register("phone")} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <Input label="رمز عبور" type="password" placeholder="••••••••" error={errors.password?.message} autoComplete="new-password" {...register("password")} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                <Input label="تکرار رمز عبور" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} autoComplete="new-password" {...register("confirmPassword")} />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input type="checkbox" className="h-4 w-4 rounded border-border/80 text-primary focus:ring-primary/30 mt-0.5 shrink-0" {...register("acceptTerms")} />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                    <Link href="/terms" className="text-primary hover:underline">قوانین و مقررات</Link> را می‌پذیرم
                  </span>
                </label>
                {errors.acceptTerms && <p className="text-xs text-destructive mt-1">{errors.acceptTerms.message}</p>}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <Button type="submit" loading={isSubmitting} className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20">
                  ثبت‌نام
                </Button>
              </motion.div>
            </form>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-6 text-center text-sm text-muted-foreground">
              قبلاً ثبت‌نام کرده‌اید؟{" "}
              <Link href="/auth/login" className="font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors">
                وارد شوید
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.p>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              مربی هستید؟ از مدیریت بخواهید حساب شما را بسازد.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </AuthLayout>
  );
}

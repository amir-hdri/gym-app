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
import { Label } from "@/components/ui/Label";
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
    role: z.enum(["athlete", "coach"], { message: "نقش را انتخاب کنید" }),
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
    watch,
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
      role: "athlete",
      acceptTerms: false,
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const registeredUser = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
      });
      toast.success("ثبت‌نام با موفقیت انجام شد");
      if (registeredUser) {
        router.replace(registeredUser.role === "coach" ? "/coach" : "/athlete");
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
                حساب کاربری جدید بساز
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="نام" placeholder="سارا" error={errors.firstName?.message} {...register("firstName")} />
                  <Input label="نام خانوادگی" placeholder="محمدی" error={errors.lastName?.message} {...register("lastName")} />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <Input label="ایمیل" type="email" placeholder="your@email.com" error={errors.email?.message} {...register("email")} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Input label="شماره موبایل" type="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" error={errors.phone?.message} {...register("phone")} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">نقش</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 ${selectedRole === "athlete" ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"}`}>
                      <input type="radio" value="athlete" className="sr-only" {...register("role")} />
                      <span className={`text-sm font-medium ${selectedRole === "athlete" ? "text-primary" : "text-muted-foreground"}`}>ورزشکار</span>
                    </label>
                    <label className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 ${selectedRole === "coach" ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"}`}>
                      <input type="radio" value="coach" className="sr-only" {...register("role")} />
                      <span className={`text-sm font-medium ${selectedRole === "coach" ? "text-primary" : "text-muted-foreground"}`}>مربی</span>
                    </label>
                  </div>
                  {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <Input label="رمز عبور" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                <Input label="تکرار رمز عبور" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
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
          </CardContent>
        </Card>
      </motion.div>
    </AuthLayout>
  );
}

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
import { CtaButton } from "@/components/twilight/controls";
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

const inputClassName =
  "h-11 rounded-xl border border-[#232934] bg-[#161a22] px-4 text-sm text-white placeholder:text-[#6b7280] focus:border-[#d2c0a5]/50 focus:outline-none";
const labelClassName = "mb-2 block text-xs text-[#8e98a8]";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[#f87171]">{error}</p>}
    </div>
  );
}

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
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      // Register never signs the user in (backend mints no tokens on this
      // path): route to login explicitly.
      toast.success("ثبت‌نام انجام شد. لطفاً وارد شوید.");
      router.replace("/auth/login");
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
        className="rounded-[32px] border border-white/10 bg-[#10141a] p-5 text-white shadow-2xl shadow-black/50 sm:p-8"
      >
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl font-medium tracking-tight text-white">ثبت‌نام</h1>
          <p className="mt-2 text-sm text-[#8e98a8]">
            حساب کاربری ورزشکار بساز — مربیان توسط مدیریت دعوت می‌شوند
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-2 gap-3">
              <Field id="firstName" label="نام" error={errors.firstName?.message}>
                <input id="firstName" placeholder="سارا" autoComplete="given-name" className={inputClassName} {...register("firstName")} />
              </Field>
              <Field id="lastName" label="نام خانوادگی" error={errors.lastName?.message}>
                <input id="lastName" placeholder="محمدی" autoComplete="family-name" className={inputClassName} {...register("lastName")} />
              </Field>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <Field id="email" label="ایمیل" error={errors.email?.message}>
              <input id="email" type="email" dir="ltr" placeholder="your@email.com" autoComplete="email" inputMode="email" className={inputClassName} {...register("email")} />
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Field id="phone" label="شماره موبایل" error={errors.phone?.message}>
              <input id="phone" type="tel" dir="ltr" placeholder="09123456789" autoComplete="tel" inputMode="tel" className={inputClassName} {...register("phone")} />
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Field id="password" label="رمز عبور" error={errors.password?.message}>
              <input id="password" type="password" placeholder="••••••••" autoComplete="new-password" className={inputClassName} {...register("password")} />
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <Field id="confirmPassword" label="تکرار رمز عبور" error={errors.confirmPassword?.message}>
              <input id="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" className={inputClassName} {...register("confirmPassword")} />
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <label className="group flex cursor-pointer items-start gap-2">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#232934] bg-[#161a22] accent-[#d2c0a5]" {...register("acceptTerms")} />
              <span className="text-sm leading-relaxed text-[#8e98a8] transition-colors group-hover:text-white">
                <Link href="/terms" className="text-[#d2c0a5] hover:underline">قوانین و مقررات</Link> را می‌پذیرم
              </span>
            </label>
            {errors.acceptTerms && <p className="mt-1 text-xs text-[#f87171]">{errors.acceptTerms.message}</p>}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <CtaButton type="submit" disabled={isSubmitting} className="w-full text-sm">
              {isSubmitting ? "در حال ثبت‌نام…" : "ثبت‌نام"}
            </CtaButton>
          </motion.div>
        </form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-6 text-center text-sm text-[#8e98a8]">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/auth/login" className="inline-flex items-center gap-1 font-semibold text-[#d2c0a5] transition-colors hover:text-[#ded1bc]">
            وارد شوید
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </motion.p>
        <p className="mt-3 text-center text-xs text-[#8e98a8]">
          مربی هستید؟ از مدیریت بخواهید حساب شما را بسازد.
        </p>
      </motion.div>
    </AuthLayout>
  );
}

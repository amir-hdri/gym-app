"use client";

import { cloneElement, isValidElement, useState } from "react";
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
import { apiErrorMessage, homeForRole } from "@/components/auth/auth-helpers";
import { useBranches } from "@/hooks/use-api";
import { validateIranianPhone } from "@/lib/utils";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "نام را وارد کنید").max(50),
    lastName: z.string().min(1, "نام خانوادگی را وارد کنید").max(50),
    email: z.string().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
    phone: z.string().min(1, "شماره موبایل را وارد کنید").refine((val) => validateIranianPhone(val), "شماره موبایل نامعتبر است"),
    password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
    confirmPassword: z.string().min(1, "تکرار رمز عبور را وارد کنید"),
    branchId: z.string().optional(),
    acceptTerms: z.boolean().refine((accepted) => accepted, "پذیرش قوانین الزامی است"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const inputClassName =
  "h-11 rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none";
const labelClassName = "mb-2 block text-xs text-muted-foreground";

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
  const errorId = `${id}-error`;
  // WCAG 3.3.1: expose the error state + message on the control itself.
  const control = isValidElement<{ "aria-invalid"?: string; "aria-describedby"?: string }>(children)
    ? cloneElement(children, {
        "aria-invalid": error ? "true" : "false",
        ...(error ? { "aria-describedby": errorId } : null),
      })
    : children;
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      {control}
      {error && <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const branches = useBranches();
  const branchList = branches.data?.data ?? [];
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
      branchId: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      // OUR contract: register mints tokens and signs the user in, so there
      // is no separate login step — go straight to the caller's panel.
      const created = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        ...(data.branchId ? { branchId: data.branchId } : {}),
      });
      toast.success("حسابت ساخته شد؛ خوش آمدی");
      router.replace(homeForRole(created.role));
    } catch (error) {
      const message = apiErrorMessage(error, "ثبت‌نام ناموفق بود");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[32px] border border-border bg-popover p-5 text-foreground shadow-2xl shadow-scrim/50 sm:p-8"
      >
        {/* Top pastel accent — thin blush-to-cream gradient hairline */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-blush-solid to-cream" />
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">ثبت‌نام</h1>
          <p className="mt-2 text-sm text-muted-foreground">
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

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <Field id="branchId" label="شعبه (اختیاری)" error={errors.branchId?.message}>
              <select
                id="branchId"
                aria-describedby="branchId-hint"
                disabled={isSubmitting || branches.isLoading}
                className={`${inputClassName} min-h-11 w-full`}
                {...register("branchId")}
              >
                <option value="">بدون انتخاب</option>
                {branchList.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <p id="branchId-hint" className="mt-1 text-[11px] leading-5 text-muted-foreground" aria-live="polite">
                {branches.isLoading
                  ? "در حال بارگذاری شعبه‌ها…"
                  : branches.isError
                    ? "شعبه‌ها بارگذاری نشد؛ می‌توانی بدون انتخاب ادامه دهی."
                    : "شعبه محل تمرینت را انتخاب کن."}
              </p>
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
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-border bg-card accent-primary" aria-invalid={errors.acceptTerms ? "true" : "false"} aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined} {...register("acceptTerms")} />
              <span className="text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground">
                <Link href="/terms" className="text-primary hover:underline">قوانین و مقررات</Link> را می‌پذیرم
              </span>
            </label>
            {errors.acceptTerms && <p id="acceptTerms-error" role="alert" className="mt-1 text-xs text-destructive">{errors.acceptTerms.message}</p>}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <CtaButton type="submit" disabled={isSubmitting} className="w-full text-sm">
              {isSubmitting ? "در حال ثبت‌نام…" : "ثبت‌نام"}
            </CtaButton>
          </motion.div>
        </form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-6 text-center text-sm text-muted-foreground">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/auth/login" className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-primary">
            وارد شوید
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </motion.p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          مربی هستید؟ از مدیریت بخواهید حساب شما را بسازد.
        </p>
      </motion.div>
    </AuthLayout>
  );
}

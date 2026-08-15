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
import { Eye, EyeOff, Zap, Lock, Mail, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
  password: z.string().min(1, "رمز عبور را وارد کنید").min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(data.email, data.password, data.rememberMe);
      toast.success("با موفقیت وارد شدید");
      if (loggedInUser) {
        switch (loggedInUser.role) {
          case "admin":
            router.replace("/admin");
            break;
          case "coach":
            router.replace("/coach");
            break;
          case "athlete":
            router.replace("/athlete");
            break;
          default:
            router.replace("/");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "ورود ناموفق بود";
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
        <Card glass className="overflow-visible border-white/70 shadow-[0_28px_80px_-35px_rgba(80,20,70,.45)] dark:border-white/10">
          <CardContent className="p-8">
            {/* Title */}
            <div className="mb-8 text-center">
              <p className="latin-kicker mb-2">WELCOME BACK</p>
              <h1 className="text-3xl font-black tracking-tight">برگشتی که بدرخشی</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                خوش اومدی! برای ادامه وارد شو
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
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

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative">
                  <Lock className="absolute right-3.5 top-[2.7rem] h-4.5 w-4.5 text-muted-foreground/40 pointer-events-none z-10" />
                  <Input
                    label="رمز عبور"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    error={errors.password?.message}
                    className="pr-10 pl-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-[2.65rem] text-muted-foreground/40 hover:text-muted-foreground transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border/80 text-primary focus:ring-primary/30"
                    {...register("rememberMe")}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    مرا به خاطر بسپار
                  </span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  فراموشی رمز؟
                </Link>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20"
                  size="default"
                >
                  <Zap className="h-4 w-4 ml-2" />
                  ورود
                </Button>
              </motion.div>
            </form>

            {/* Register Link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-center text-sm text-muted-foreground"
            >
              عضو نیستی؟{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors"
              >
                ثبت‌نام کن
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </AuthLayout>
  );
}

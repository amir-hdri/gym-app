"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Skeleton } from "@/components/animations/Skeleton";
import { apiErrorMessage, PASSWORD_HINT } from "@/components/auth/auth-helpers";
import { useBranches, useCreateUser, useSetUserPassword } from "@/hooks/use-api";
import type { UserRole } from "@/lib/types";
import { Field } from "./Field";
import { Panel } from "./Panel";
import { newUserSchema, type NewUserFormData } from "./user-admin";

const NO_BRANCH = "none";

export interface NewUserFormProps {
  role: Extract<UserRole, "athlete" | "coach">;
  /** List the new account belongs to, e.g. `/admin/members`. */
  listHref: string;
  submitLabel: string;
  /** Noun for the toasts, e.g. "عضو". */
  noun: string;
}

/**
 * Creates an account, then sets its first password.
 *
 * Two calls rather than one because `POST /users` takes no password — the
 * credential is written by `POST /users/{id}/password`. If the second call
 * fails the account still exists, so the failure is reported as exactly that
 * and the admin is sent to the profile to retry rather than left wondering
 * whether anything was saved.
 */
export function NewUserForm({ role, listHref, submitLabel, noun }: NewUserFormProps) {
  const router = useRouter();
  const createUser = useCreateUser();
  const setPassword = useSetUserPassword();
  const branches = useBranches();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      branchId: NO_BRANCH,
    },
  });

  const branchId = watch("branchId");

  const onSubmit = async (data: NewUserFormData) => {
    let createdId: string | undefined;
    try {
      const created = await createUser.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role,
        branchId: data.branchId === NO_BRANCH ? undefined : data.branchId,
      });
      createdId = created.data?.id;
    } catch (error) {
      toast.error(apiErrorMessage(error, `ثبت ${noun} ناموفق بود`));
      return;
    }

    if (!createdId) {
      toast.error("حساب ساخته شد اما شناسه‌ای برنگشت؛ فهرست را بررسی کنید");
      router.push(listHref);
      return;
    }

    try {
      await setPassword.mutateAsync({ id: createdId, newPassword: data.password });
      toast.success(`${noun} تازه ثبت شد`);
    } catch (error) {
      toast.error(
        apiErrorMessage(error, "حساب ساخته شد اما رمز عبور ثبت نشد؛ از صفحهٔ پروفایل رمز را تعیین کنید")
      );
    }
    router.push(`${listHref}/${createdId}`);
  };

  const branchOptions = branches.data?.data ?? [];

  return (
    <Panel title="اطلاعات حساب" description="این اطلاعات برای ورود و تماس استفاده می‌شود">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-4 @sm:grid-cols-2">
          <Input
            id="new-first-name"
            label="نام"
            autoComplete="given-name"
            required
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            id="new-last-name"
            label="نام خانوادگی"
            autoComplete="family-name"
            required
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>
        <div className="grid gap-4 @sm:grid-cols-2">
          <Input
            id="new-email"
            label="ایمیل"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            dir="ltr"
            placeholder="name@example.com"
            required
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            id="new-phone"
            label="شماره موبایل"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="09121112233"
            required
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>
        <Input
          id="new-password"
          label="رمز عبور"
          type="password"
          autoComplete="new-password"
          required
          hint={PASSWORD_HINT}
          error={errors.password?.message}
          {...register("password")}
        />
        {branches.isLoading ? (
          <Skeleton className="h-20 w-full rounded-2xl" />
        ) : (
          <Field
            label="شعبه"
            error={errors.branchId?.message}
            hint={
              branches.isError
                ? "فهرست شعبه‌ها بارگذاری نشد؛ می‌توانید بدون شعبه ثبت کنید و بعداً آن را تعیین کنید."
                : "اختیاری است و بعداً هم قابل تغییر است."
            }
          >
            {(control) => (
              <Select value={branchId ?? NO_BRANCH} onValueChange={(value) => setValue("branchId", value)}>
                <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
                  <SelectValue placeholder="انتخاب شعبه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_BRANCH} className="min-h-11">
                    بدون شعبه
                  </SelectItem>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="min-h-11">
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        )}
        <p className="rounded-xl bg-muted p-3 text-xs leading-6 text-muted-foreground">
          حساب تازه با وضعیت «فعال» ساخته می‌شود. برای تعلیق یا غیرفعال‌سازی، از صفحهٔ پروفایل همان حساب
          استفاده کنید.
        </p>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => router.push(listHref)} disabled={isSubmitting}>
            انصراف
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <UserPlus aria-hidden className="h-4 w-4" />
            {submitLabel}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

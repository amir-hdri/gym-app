"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { apiErrorMessage, PASSWORD_HINT } from "@/components/auth/auth-helpers";
import { useBranches, useSetUserPassword, useUpdateUser } from "@/hooks/use-api";
import type { User } from "@/lib/types";
import { Field } from "./Field";
import {
  identitySchema,
  resetPasswordSchema,
  STATUS_OPTIONS,
  type IdentityFormData,
  type ResetPasswordFormData,
} from "./user-admin";

const NO_BRANCH = "none";

export interface UserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

/**
 * Edits one account's identity fields.
 *
 * Mounted only while the sheet is open (Radix unmounts closed content), so the
 * form picks up the stored values as defaults on every open without an effect
 * that resets state behind the user's back.
 */
export function UserEditSheet({ open, onOpenChange, user }: UserSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="ویرایش اطلاعات حساب"
      description="نام، راه‌های تماس، شعبه و وضعیت حساب"
    >
      <UserEditForm user={user} onDone={() => onOpenChange(false)} />
    </Sheet>
  );
}

function UserEditForm({ user, onDone }: { user: User; onDone: () => void }) {
  const updateUser = useUpdateUser();
  const branches = useBranches();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IdentityFormData>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      branchId: user.branchId ?? NO_BRANCH,
    },
  });

  const status = watch("status");
  const branchId = watch("branchId");

  const onSubmit = async (data: IdentityFormData) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          status: data.status,
          branchId: data.branchId === NO_BRANCH ? undefined : data.branchId,
        },
      });
      toast.success("اطلاعات حساب به‌روزرسانی شد");
      onDone();
    } catch (error) {
      toast.error(apiErrorMessage(error, "به‌روزرسانی اطلاعات ناموفق بود"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-2" noValidate>
      <div className="grid gap-4 @sm:grid-cols-2">
        <Input id="edit-first-name" label="نام" error={errors.firstName?.message} {...register("firstName")} />
        <Input id="edit-last-name" label="نام خانوادگی" error={errors.lastName?.message} {...register("lastName")} />
      </div>
      <Input
        id="edit-email"
        label="ایمیل"
        type="email"
        dir="ltr"
        autoComplete="email"
        spellCheck={false}
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        id="edit-phone"
        label="شماره موبایل"
        type="tel"
        dir="ltr"
        inputMode="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Field label="وضعیت حساب" error={errors.status?.message}>
        {(control) => (
          <Select value={status} onValueChange={(value) => setValue("status", value as IdentityFormData["status"])}>
            <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="min-h-11">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
      <Field label="شعبه" error={errors.branchId?.message} hint="برای حذف شعبه گزینهٔ «بدون شعبه» را انتخاب کنید.">
        {(control) => (
          <Select value={branchId ?? NO_BRANCH} onValueChange={(value) => setValue("branchId", value)}>
            <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
              <SelectValue placeholder="انتخاب شعبه" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_BRANCH} className="min-h-11">
                بدون شعبه
              </SelectItem>
              {(branches.data?.data ?? []).map((branch) => (
                <SelectItem key={branch.id} value={branch.id} className="min-h-11">
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          انصراف
        </Button>
        <Button type="submit" loading={isSubmitting}>
          <Save aria-hidden className="h-4 w-4" />
          ذخیره تغییرات
        </Button>
      </div>
    </form>
  );
}

/**
 * Sets someone else's password. `useSetUserPassword` omits `currentPassword`
 * for this case — an admin resetting an account does not know it.
 */
export function UserPasswordSheet({ open, onOpenChange, user }: UserSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="تعیین رمز عبور"
      description={`رمز تازه برای ${user.firstName} ${user.lastName}`}
    >
      <UserPasswordForm user={user} onDone={() => onOpenChange(false)} />
    </Sheet>
  );
}

function UserPasswordForm({ user, onDone }: { user: User; onDone: () => void }) {
  const setPassword = useSetUserPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await setPassword.mutateAsync({ id: user.id, newPassword: data.newPassword });
      toast.success("رمز عبور تازه ثبت شد");
      onDone();
    } catch (error) {
      toast.error(apiErrorMessage(error, "ثبت رمز عبور ناموفق بود"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-2" noValidate>
      <Input
        id="reset-new-password"
        label="رمز عبور تازه"
        type="password"
        autoComplete="new-password"
        hint={PASSWORD_HINT}
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <Input
        id="reset-confirm-password"
        label="تکرار رمز عبور"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          انصراف
        </Button>
        <Button type="submit" loading={isSubmitting}>
          <KeyRound aria-hidden className="h-4 w-4" />
          ثبت رمز عبور
        </Button>
      </div>
    </form>
  );
}

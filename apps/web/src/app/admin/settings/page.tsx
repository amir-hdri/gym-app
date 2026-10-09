"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Sheet } from "@/components/ui/Sheet";
import { toast } from "sonner";
import { Save, Building2, Phone, MapPin, Mail, Tag, Sparkles, Plus, Pencil, Trash2 } from "lucide-react";
import { PageShell, PageHeader, SectionTitle } from "@/components/twilight/Page";
import { CtaButton, EmptyState } from "@/components/twilight/controls";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiErrorMessage, httpStatusOf } from "@/components/auth/auth-helpers";
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { validateIranianPhone } from "@/lib/utils";
import type { Branch } from "@/lib/types";

/** Twilight input override (ui/Input base carries old theme tokens + a dark: variant). */
const inputClassName =
  "h-10 rounded-xl border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-primary/50";

function SettingsRow({
  id,
  icon,
  label,
  value,
  onChange,
  type,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-secondary">
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <Label htmlFor={id} className="text-xs font-medium text-foreground">
          {label}
        </Label>
      </div>
      <div className="w-44 shrink-0 sm:w-60">
        <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputClassName} />
      </div>
    </div>
  );
}

const branchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "نام شعبه را وارد کنید")
    .max(100, "نام شعبه بیش از حد طولانی است"),
  address: z
    .string()
    .trim()
    .min(1, "نشانی را وارد کنید")
    .max(100, "نشانی بیش از حد طولانی است"),
  phone: z
    .string()
    .trim()
    .max(20, "شماره تلفن بیش از حد طولانی است")
    .refine(
      (value) => value === "" || validateIranianPhone(value),
      "شماره تلفن معتبر نیست (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)"
    ),
  email: z
    .string()
    .trim()
    .max(120, "ایمیل بیش از حد طولانی است")
    .refine(
      (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "ایمیل نامعتبر است"
    ),
});

type BranchFormData = z.infer<typeof branchSchema>;

function BranchForm({ branch, close }: { branch: Branch | null; close: () => void }) {
  const update = useUpdateBranch();
  const create = useCreateBranch();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: branch?.name ?? "",
      address: branch?.address ?? "",
      phone: branch?.phone ?? "",
      email: branch?.email ?? "",
    },
  });

  async function onSubmit(values: BranchFormData) {
    const data = {
      name: values.name.trim(),
      address: values.address.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
    };
    try {
      if (branch) await update.mutateAsync({ id: branch.id, data });
      else await create.mutateAsync(data);
      toast.success("اطلاعات شعبه ذخیره شد");
      close();
    } catch (error) {
      toast.error(apiErrorMessage(error, "ذخیره شعبه ناموفق بود"));
    }
  }

  return (
    <form className="space-y-4 pb-2" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        id="branch-name"
        label="نام شعبه"
        required
        maxLength={100}
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        id="branch-address"
        label="نشانی"
        required
        maxLength={100}
        error={errors.address?.message}
        {...register("address")}
      />
      <Input
        id="branch-phone"
        label="تلفن"
        type="tel"
        dir="ltr"
        maxLength={20}
        hint="اختیاری — مثلاً ۰۹۱۲۳۴۵۶۷۸۹."
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Input
        id="branch-email"
        label="ایمیل"
        type="email"
        dir="ltr"
        maxLength={120}
        hint="اختیاری."
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" className="w-full" loading={isSubmitting}>
        ذخیره شعبه
      </Button>
    </form>
  );
}

const STAFF_HINT_ID = "branch-actions-hint";
const NON_ADMIN_HINT = "ویرایش، فعال‌سازی و حذف شعبه فقط برای مدیران فعال است.";

export default function SettingsPage() {
  const [form, setForm] = useState({
    branchName: "باشگاه Lumi Wellness",
    address: "تهران، خیابان ولیعصر، نبش کوچه نور",
    phone: "۰۲۱-۱۲۳۴۵۶۷۸",
    email: "info@gymapp.ir",
    sessionPrice: "۱۵۰,۰۰۰",
    personalSessionPrice: "۳۵۰,۰۰۰",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const { user } = useAuth();
  const branches = useBranches();
  const updateBranch = useUpdateBranch();
  const removeBranch = useDeleteBranch();
  const [editing, setEditing] = useState<Branch | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Branch | null>(null);
  const [toggling, setToggling] = useState<Branch | null>(null);
  const [actionError, setActionError] = useState("");
  const [conflictBranch, setConflictBranch] = useState<Branch | null>(null);

  const canEdit = user?.role === "admin";
  const branchList = branches.data?.data ?? [];
  const disabledExplanation = canEdit ? undefined : NON_ADMIN_HINT;

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    removeBranch.mutate(target.id, {
      onSuccess: () => {
        toast.success(`شعبه «${target.name}» حذف شد`);
        setDeleting(null);
        setConflictBranch(null);
        setActionError("");
      },
      onError: (error) => {
        if (httpStatusOf(error) === 409) {
          // The dialog stays open: the branch cannot be deleted while it has
          // members, but it can be deactivated instead from the message below.
          const message =
            "این شعبه عضو یا اشتراک فعال دارد و قابل حذف نیست؛ ابتدا اعضا را جابه‌جا کنید یا شعبه را غیرفعال کنید.";
          setConflictBranch(target);
          setActionError(message);
          toast.error(message);
          return;
        }
        const message = apiErrorMessage(error, "حذف شعبه ناموفق بود");
        setConflictBranch(null);
        setActionError(message);
        toast.error(message);
      },
    });
  };

  const deactivateInstead = () => {
    if (!conflictBranch) return;
    const target = conflictBranch;
    updateBranch.mutate(
      { id: target.id, data: { isActive: false } },
      {
        onSuccess: () => {
          toast.success(`شعبه «${target.name}» غیرفعال شد`);
          setDeleting(null);
          setConflictBranch(null);
          setActionError("");
        },
        onError: (error) =>
          toast.error(apiErrorMessage(error, "غیرفعال کردن شعبه ناموفق بود")),
      }
    );
  };

  const confirmToggle = () => {
    if (!toggling) return;
    const target = toggling;
    updateBranch.mutate(
      { id: target.id, data: { isActive: !target.isActive } },
      {
        onSuccess: () => {
          toast.success(target.isActive ? "شعبه غیرفعال شد" : "شعبه فعال شد");
          setToggling(null);
          setActionError("");
        },
        onError: (error) =>
          toast.error(apiErrorMessage(error, "تغییر وضعیت شعبه ناموفق بود")),
      }
    );
  };

  return (
    <PageShell>
      <PageHeader title="تنظیمات" subtitle="مدیریت تنظیمات باشگاه" />

      <section>
        <SectionTitle>بخش باشگاه</SectionTitle>
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          <SettingsRow
            id="branchName"
            icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}
            label="نام باشگاه"
            value={form.branchName}
            onChange={(v) => updateField("branchName", v)}
          />
          <SettingsRow
            id="phone"
            icon={<Phone className="h-4 w-4" strokeWidth={1.75} />}
            label="تلفن"
            value={form.phone}
            onChange={(v) => updateField("phone", v)}
          />
          <SettingsRow
            id="address"
            icon={<MapPin className="h-4 w-4" strokeWidth={1.75} />}
            label="آدرس"
            value={form.address}
            onChange={(v) => updateField("address", v)}
          />
          <SettingsRow
            id="email"
            icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
            label="ایمیل"
            type="email"
            value={form.email}
            onChange={(v) => updateField("email", v)}
          />
        </div>
      </section>

      <section>
        <SectionTitle>بخش قیمت‌گذاری</SectionTitle>
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          <SettingsRow
            id="sessionPrice"
            icon={<Tag className="h-4 w-4" strokeWidth={1.75} />}
            label="قیمت هر جلسه عادی (تومان)"
            value={form.sessionPrice}
            onChange={(v) => updateField("sessionPrice", v)}
          />
          <SettingsRow
            id="personalSessionPrice"
            icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
            label="قیمت هر جلسه شخصی (تومان)"
            value={form.personalSessionPrice}
            onChange={(v) => updateField("personalSessionPrice", v)}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <CtaButton onClick={() => toast.success("تنظیمات با موفقیت ذخیره شد")} className="w-auto px-6">
          <Save className="h-4 w-4" strokeWidth={1.75} />
          ذخیره تنظیمات
        </CtaButton>
      </div>

      <section>
        <SectionTitle
          action={
            canEdit ? (
              <Button size="sm" onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                افزودن شعبه
              </Button>
            ) : undefined
          }
        >
          شعبه‌ها
        </SectionTitle>
        <p id={STAFF_HINT_ID} className="mt-1 text-xs text-muted-foreground">
          {canEdit
            ? "ویرایش، فعال‌سازی و حذف هر شعبه از دکمه‌های همان ردیف انجام می‌شود."
            : `شما با دسترسی غیرمدیر وارد شده‌اید؛ ${NON_ADMIN_HINT}`}
        </p>

        {actionError && (
          <div role="alert" className="mt-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs leading-6 text-destructive">{actionError}</p>
            {conflictBranch && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                loading={updateBranch.isPending}
                onClick={deactivateInstead}
              >
                غیرفعال کردن «{conflictBranch.name}» به‌جای حذف
              </Button>
            )}
          </div>
        )}

        <div className="mt-3">
          {branches.isLoading ? (
            <Loading message="در حال بارگذاری شعبه‌ها..." />
          ) : branches.isError ? (
            <ErrorDisplay message="شعبه‌ها بارگذاری نشد" onRetry={() => void branches.refetch()} />
          ) : branchList.length === 0 ? (
            <EmptyState
              title="شعبه‌ای ثبت نشده"
              description="نخستین شعبه باشگاه را اضافه کنید تا اعضا به آن وصل شوند"
              action={
                canEdit ? (
                  <CtaButton onClick={() => setEditing(null)} className="w-auto px-6">
                    <Plus className="h-4 w-4" strokeWidth={1.75} />
                    افزودن شعبه
                  </CtaButton>
                ) : undefined
              }
            />
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {branchList.map((branch) => (
                <div key={branch.id} className="space-y-3 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-primary">
                      <Building2 className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {branch.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {branch.address} · {branch.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11 flex-1"
                      disabled={!canEdit}
                      title={disabledExplanation ?? `ویرایش ${branch.name}`}
                      aria-label={`ویرایش ${branch.name}`}
                      aria-describedby={canEdit ? undefined : STAFF_HINT_ID}
                      onClick={() => setEditing(branch)}
                    >
                      <Pencil aria-hidden className="h-3.5 w-3.5" />
                      ویرایش
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      disabled={!canEdit}
                      title={disabledExplanation ?? "تغییر وضعیت شعبه"}
                      aria-label={`${branch.isActive ? "غیرفعال کردن" : "فعال کردن"} ${branch.name}`}
                      aria-describedby={canEdit ? undefined : STAFF_HINT_ID}
                      loading={updateBranch.isPending && updateBranch.variables?.id === branch.id}
                      onClick={() => {
                        setActionError("");
                        setConflictBranch(null);
                        setToggling(branch);
                      }}
                    >
                      {branch.isActive ? "غیرفعال کردن" : "فعال کردن"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive"
                      disabled={!canEdit}
                      title={disabledExplanation ?? `حذف ${branch.name}`}
                      aria-label={`حذف ${branch.name}`}
                      aria-describedby={canEdit ? undefined : STAFF_HINT_ID}
                      loading={removeBranch.isPending && removeBranch.variables === branch.id}
                      onClick={() => {
                        setActionError("");
                        setConflictBranch(null);
                        setDeleting(branch);
                      }}
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Sheet
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        title={editing ? "ویرایش شعبه" : "افزودن شعبه"}
        description="نام، نشانی و اطلاعات تماس شعبه"
      >
        {editing !== undefined && (
          <BranchForm key={editing?.id ?? "new"} branch={editing} close={() => setEditing(undefined)} />
        )}
      </Sheet>

      <ConfirmDialog
        open={toggling !== null}
        onOpenChange={(open) => {
          if (!open) setToggling(null);
        }}
        title={toggling?.isActive ? "غیرفعال کردن شعبه" : "فعال کردن شعبه"}
        description={
          toggling
            ? `شعبه «${toggling.name}» ${toggling.isActive ? "غیرفعال می‌شود؛ ثبت‌نام و پذیرش تازه در آن متوقف می‌شود ولی سوابق اعضا حفظ می‌ماند" : "دوباره فعال می‌شود"}.`
            : "وضعیت این شعبه تغییر می‌کند."
        }
        confirmLabel={toggling?.isActive ? "غیرفعال کن" : "فعال کن"}
        variant="warning"
        loading={updateBranch.isPending}
        onConfirm={confirmToggle}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
            setConflictBranch(null);
            setActionError("");
          }
        }}
        title="حذف شعبه"
        description={
          deleting
            ? `شعبه «${deleting.name}» برای همیشه حذف می‌شود. اگر عضو یا اشتراک فعالی داشته باشد، حذف رد می‌شود و باید ابتدا غیرفعالش کنید.`
            : "این شعبه حذف می‌شود."
        }
        confirmLabel="حذف شعبه"
        loading={removeBranch.isPending}
        onConfirm={confirmDelete}
      />
    </PageShell>
  );
}

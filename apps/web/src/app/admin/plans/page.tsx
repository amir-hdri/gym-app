"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Textarea";
import { formatCurrency, formatPersianNumber, cn } from "@/lib/utils";
import { apiErrorMessage } from "@/components/auth/auth-helpers";
import { Plus, Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { EmptyState, CtaButton, TwilightCard } from "@/components/twilight/controls";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import {
  useMembershipPlans,
  useCreateMembershipPlan,
  useUpdateMembershipPlan,
  useDeleteMembershipPlan,
} from "@/hooks/use-api";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { Field } from "../_components/Field";
import type { MembershipPlan } from "@/lib/types";

const durationLabel = (days: number) => {
  if (days >= 365) return "یک سال";
  if (days >= 180) return "شش ماه";
  if (days >= 90) return "سه ماه";
  if (days >= 30) return "یک ماه";
  return `${days} روز`;
};

/** Digits in either script, grouped or not. */
function toLatinDigits(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persian.indexOf(digit);
    return String(persianIndex > -1 ? persianIndex : arabic.indexOf(digit));
  });
}

function toAmount(value: string): number {
  return Number(toLatinDigits(value).replace(/[,\s]/g, ""));
}

const planSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "نام پلن را وارد کنید")
    .max(100, "نام پلن بیش از حد طولانی است"),
  description: z.string().trim().max(500, "توضیحات بیش از حد طولانی است"),
  durationDays: z
    .string()
    .trim()
    .min(1, "مدت اعتبار را وارد کنید")
    .refine(
      (value) => /^\d+$/.test(toLatinDigits(value)) && Number(toLatinDigits(value)) >= 1,
      "مدت اعتبار باید حداقل ۱ روز باشد"
    ),
  sessionsCount: z
    .string()
    .trim()
    .min(1, "تعداد جلسات را وارد کنید")
    .refine(
      (value) => /^\d+$/.test(toLatinDigits(value)),
      "تعداد جلسات را درست وارد کنید (۰ یعنی نامحدود)"
    ),
  price: z
    .string()
    .trim()
    .min(1, "قیمت را وارد کنید")
    .refine((value) => {
      const parsed = toAmount(value);
      return Number.isFinite(parsed) && parsed > 0;
    }, "قیمت باید عددی بزرگ‌تر از صفر باشد"),
  featuresText: z.string().max(2000, "فهرست امکانات بیش از حد طولانی است"),
});

type PlanFormData = z.infer<typeof planSchema>;

function PlanForm({ plan, onDone }: { plan: MembershipPlan | null; onDone: () => void }) {
  const create = useCreateMembershipPlan();
  const update = useUpdateMembershipPlan();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      durationDays: String(plan?.durationDays ?? 30),
      sessionsCount: String(plan?.sessionsCount ?? 12),
      price: plan ? String(plan.price) : "",
      featuresText: plan?.features?.join("\n") ?? "",
    },
  });

  async function onSubmit(values: PlanFormData) {
    const data = {
      name: values.name.trim(),
      description: values.description.trim(),
      durationDays: Number(toLatinDigits(values.durationDays)),
      sessionsCount: Number(toLatinDigits(values.sessionsCount)),
      price: toAmount(values.price),
      features: values.featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    };
    try {
      if (plan) await update.mutateAsync({ id: plan.id, data });
      else await create.mutateAsync(data);
      toast.success("پلن ذخیره شد");
      onDone();
    } catch (error) {
      toast.error(apiErrorMessage(error, "ذخیره پلن ناموفق بود؛ دوباره امتحان کنید."));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-2" noValidate>
      <Input
        id="plan-name"
        label="نام پلن"
        required
        maxLength={100}
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        id="plan-description"
        label="توضیحات"
        maxLength={500}
        hint="اختیاری — در کارت پلن نمایش داده می‌شود."
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="plan-duration"
          label="مدت اعتبار (روز)"
          inputMode="numeric"
          dir="ltr"
          required
          error={errors.durationDays?.message}
          {...register("durationDays")}
        />
        <Input
          id="plan-sessions"
          label="تعداد جلسات"
          inputMode="numeric"
          dir="ltr"
          required
          hint="۰ یعنی جلسات نامحدود."
          error={errors.sessionsCount?.message}
          {...register("sessionsCount")}
        />
      </div>
      <Input
        id="plan-price"
        label="قیمت (ریال)"
        inputMode="numeric"
        dir="ltr"
        required
        error={errors.price?.message}
        {...register("price")}
      />
      <Field
        label="امکانات — هر مورد در یک خط"
        error={errors.featuresText?.message}
        hint="اختیاری — هر خط یک مورد در کارت پلن می‌شود."
      >
        {(control) => <Textarea rows={4} {...control} {...register("featuresText")} />}
      </Field>
      <Button type="submit" loading={isSubmitting} className="w-full">
        ذخیره پلن
      </Button>
    </form>
  );
}

export default function PlansPage() {
  const { data, isLoading, isError, refetch } = useMembershipPlans();
  const update = useUpdateMembershipPlan();
  const remove = useDeleteMembershipPlan();
  const [editing, setEditing] = useState<MembershipPlan | null | undefined>(undefined);
  const [toggling, setToggling] = useState<MembershipPlan | null>(null);
  const [deleting, setDeleting] = useState<MembershipPlan | null>(null);
  const plans = data?.data ?? [];

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay onRetry={refetch} />;

  const confirmToggle = () => {
    if (!toggling) return;
    const target = toggling;
    update.mutate(
      { id: target.id, data: { isActive: !target.isActive } },
      {
        onSuccess: () => {
          toast.success(target.isActive ? "پلن غیرفعال شد" : "پلن فعال شد");
          setToggling(null);
        },
        onError: (error) => toast.error(apiErrorMessage(error, "ذخیره وضعیت ناموفق بود")),
      }
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    remove.mutate(target.id, {
      onSuccess: (response) => {
        if (response.data && response.data.isActive === false) {
          toast.success(`«${target.name}» عضو دارد؛ به‌جای حذف، غیرفعال شد`);
        } else {
          toast.success(`پلن «${target.name}» حذف شد`);
        }
        setDeleting(null);
      },
      onError: (error) => toast.error(apiErrorMessage(error, "حذف پلن ناموفق بود")),
    });
  };

  return (
    <PageShell>
      <PageHeader
        title="پلن‌های اشتراک"
        subtitle="مدیریت طرح‌های اشتراک باشگاه"
        action={
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            افزودن پلن جدید
          </Button>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-5 w-5" strokeWidth={1.75} />}
          title="هیچ پلنی یافت نشد"
          description="هنوز هیچ پلن اشتراکی تعریف نشده است"
          action={
            <CtaButton onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              افزودن پلن جدید
            </CtaButton>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <TwilightCard key={plan.id} className={cn(!plan.isActive && "opacity-60")}>
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-normal text-white">{plan.name}</h3>
                <Badge variant={plan.isActive ? "success" : "secondary"}>
                  {plan.isActive ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="font-sans text-3xl font-normal tabular-nums text-white">{formatCurrency(plan.price)}</p>
                <p className="mt-1 text-xs text-[#8e98a8]">{durationLabel(plan.durationDays)}</p>
              </div>
              <p className="mt-3 text-sm text-[#8e98a8]">
                <span className="font-medium tabular-nums text-white">{formatPersianNumber(plan.sessionsCount)}</span> جلسه
              </p>
              <ul className="mt-3 space-y-2 border-t border-[#1e2430] pt-3">
                {(plan.features ?? []).map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-white">
                    <Check className="h-4 w-4 shrink-0 text-[#d2c0a5]" strokeWidth={1.75} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <CtaButton
                variant={plan.isActive ? "outline" : "cream"}
                onClick={() => setToggling(plan)}
                className="mt-4"
              >
                {plan.isActive ? "غیرفعال کردن" : "فعال کردن"}
              </CtaButton>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11 flex-1"
                  onClick={() => setEditing(plan)}
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.75} />
                  ویرایش
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`حذف پلن ${plan.name}`}
                  title={`حذف پلن ${plan.name}`}
                  loading={remove.isPending && remove.variables === plan.id}
                  onClick={() => setDeleting(plan)}
                  className="text-destructive"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            </TwilightCard>
          ))}
        </div>
      )}

      <Sheet
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        title={editing ? "ویرایش پلن" : "افزودن پلن جدید"}
        description="قیمت، اعتبار و امکانات عضویت"
      >
        {editing !== undefined && (
          <PlanForm key={editing?.id ?? "new"} plan={editing} onDone={() => setEditing(undefined)} />
        )}
      </Sheet>

      <ConfirmDialog
        open={toggling !== null}
        onOpenChange={(open) => {
          if (!open) setToggling(null);
        }}
        title={toggling?.isActive ? "غیرفعال کردن پلن" : "فعال کردن پلن"}
        description={
          toggling
            ? `پلن «${toggling.name}» ${toggling.isActive ? "غیرفعال می‌شود و دیگر برای ثبت‌نام تازه نمایش داده نمی‌شود" : "دوباره فعال می‌شود و برای ثبت‌نام تازه نمایش داده می‌شود"}.`
            : "وضعیت این پلن تغییر می‌کند."
        }
        confirmLabel={toggling?.isActive ? "غیرفعال کن" : "فعال کن"}
        variant="warning"
        loading={update.isPending}
        onConfirm={confirmToggle}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="حذف پلن"
        description={
          deleting
            ? `پلن «${deleting.name}» حذف می‌شود. اگر عضوی با این پلن اشتراک داشته باشد، پلن به‌جای حذف غیرفعال می‌شود.`
            : "این پلن حذف می‌شود."
        }
        confirmLabel="حذف پلن"
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </PageShell>
  );
}

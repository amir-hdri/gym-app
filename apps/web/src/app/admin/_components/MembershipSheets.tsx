"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { CalendarPlus, PencilLine, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/animations/Skeleton";
import { apiErrorMessage } from "@/components/auth/auth-helpers";
import {
  useBranches,
  useCreateMembership,
  useFreezeMembership,
  useMembershipPlans,
  useUnfreezeMembership,
  useUpdateMembership,
} from "@/hooks/use-api";
import { formatCurrency, formatPersianNumber } from "@/lib/utils";
import type { Membership } from "@/lib/types";
import { Field } from "./Field";
import { addDaysToDateInput, jalaliHint, parseDateInput, todayDateInput } from "./user-admin";

/* -------------------------------------------------------------------------- */
/* Schemas                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Digits are accepted in either script: the inputs are `dir="ltr"
 * inputMode="numeric"`, but Persian digits pasted from elsewhere must not be
 * silently dropped by `Number()`.
 */
function toLatinDigits(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persian.indexOf(digit);
    if (persianIndex > -1) return String(persianIndex);
    return String(arabic.indexOf(digit));
  });
}

const wholeNumber = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => /^\d+$/.test(toLatinDigits(value)), message);

const positiveAmount = (message: string) =>
  z
    .string()
    .trim()
    .min(1, "مبلغ را وارد کنید")
    .refine((value) => {
      const parsed = Number(toLatinDigits(value).replace(/,/g, ""));
      return Number.isFinite(parsed) && parsed > 0;
    }, message);

/**
 * `POST /memberships` requires `price` and `finalPrice` both `> 0` — the server
 * answers 422 for zero rather than reading it as "free" — plus both dates, so
 * the schema mirrors that instead of letting the API be the first to object.
 */
export const membershipSchema = z
  .object({
    planId: z.string().min(1, "پلن را انتخاب کنید"),
    branchId: z.string().min(1, "شعبه را انتخاب کنید"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ شروع را انتخاب کنید"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ پایان را انتخاب کنید"),
    sessionsTotal: wholeNumber("تعداد جلسات را وارد کنید"),
    sessionsUsed: wholeNumber("جلسات استفاده‌شده را وارد کنید"),
    price: positiveAmount("مبلغ باید بزرگ‌تر از صفر باشد"),
    discountAmount: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d+$/.test(toLatinDigits(value)), "تخفیف را درست وارد کنید"),
  })
  .refine((values) => Number(toLatinDigits(values.sessionsUsed)) <= Number(toLatinDigits(values.sessionsTotal)), {
    message: "جلسات استفاده‌شده نمی‌تواند از کل جلسات بیشتر باشد",
    path: ["sessionsUsed"],
  })
  .refine(
    (values) => {
      const start = parseDateInput(values.startDate);
      const end = parseDateInput(values.endDate);
      return Boolean(start && end && end >= start);
    },
    { message: "تاریخ پایان باید بعد از تاریخ شروع باشد", path: ["endDate"] }
  )
  .refine(
    (values) => {
      const price = Number(toLatinDigits(values.price).replace(/,/g, ""));
      const discount = values.discountAmount === "" ? 0 : Number(toLatinDigits(values.discountAmount));
      return discount < price;
    },
    { message: "تخفیف باید کمتر از مبلغ کل باشد", path: ["discountAmount"] }
  );

export type MembershipFormData = z.infer<typeof membershipSchema>;

export const freezeSchema = z.object({
  reason: z.string().trim().min(1, "دلیل توقف را بنویسید").max(200, "بیش از حد طولانی است"),
  endDate: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "تاریخ را درست وارد کنید"),
});

export type FreezeFormData = z.infer<typeof freezeSchema>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function toNumber(value: string): number {
  return Number(toLatinDigits(value).replace(/,/g, ""));
}

/** `YYYY-MM-DD` off the front of a stored timestamp — no timezone shift. */
function dateInputOf(value: string): string {
  return value.slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/* Assign / edit                                                               */
/* -------------------------------------------------------------------------- */

export interface MembershipFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  /** Present when editing an existing membership; absent when assigning a new one. */
  membership?: Membership;
}

/**
 * Assigns a plan to a member, or edits the membership already on file.
 *
 * Both routes need the same nine fields, and `useUpdateMembership` takes the
 * same shape as `useCreateMembership` (a partial `MembershipInput`), so one form
 * serves both rather than two near-identical sheets.
 */
export function MembershipFormSheet({ open, onOpenChange, userId, membership }: MembershipFormSheetProps) {
  const editing = Boolean(membership);
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "ویرایش اشتراک" : "تخصیص پلن اشتراک"}
      description={
        editing
          ? "تاریخ‌ها، جلسات و مبلغ این اشتراک را تغییر دهید"
          : "شروع اشتراک تازه برای این عضو؛ تاریخ پایان از مدت پلن محاسبه می‌شود"
      }
    >
      <MembershipForm
        userId={userId}
        membership={membership}
        onDone={() => onOpenChange(false)}
      />
    </Sheet>
  );
}

function MembershipForm({
  userId,
  membership,
  onDone,
}: {
  userId: string;
  membership?: Membership;
  onDone: () => void;
}) {
  const plans = useMembershipPlans();
  const branches = useBranches();
  const createMembership = useCreateMembership();
  const updateMembership = useUpdateMembership();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      planId: membership?.planId ?? "",
      branchId: membership?.branchId ?? "",
      startDate: membership ? dateInputOf(membership.startDate) : todayDateInput(),
      endDate: membership ? dateInputOf(membership.endDate) : "",
      sessionsTotal: String(membership?.sessionsTotal ?? 0),
      sessionsUsed: String(membership?.sessionsUsed ?? 0),
      price: String(membership?.price ?? 0),
      discountAmount: membership?.discountAmount ? String(membership.discountAmount) : "",
    },
  });

  const planId = watch("planId");
  const branchId = watch("branchId");
  const startDate = watch("startDate");
  const price = watch("price");
  const discountAmount = watch("discountAmount");
  const sessionsTotal = watch("sessionsTotal");

  const planOptions = useMemo(() => plans.data?.data ?? [], [plans.data]);
  const selectedPlan = planOptions.find((plan) => plan.id === planId);

  /**
   * Picking a plan fills in what the plan already knows: how long it runs, how
   * many sessions it carries and what it costs. The admin can still overwrite
   * every one of those, which is why this only runs on the *change* of `planId`
   * and never clobbers an edit the user already made.
   */
  useEffect(() => {
    if (!selectedPlan || membership) return;
    setValue("sessionsTotal", String(selectedPlan.sessionsCount));
    setValue("price", String(selectedPlan.price));
    setValue(
      "endDate",
      selectedPlan.durationDays > 0 ? addDaysToDateInput(startDate, selectedPlan.durationDays) : ""
    );
  }, [selectedPlan, membership, setValue, startDate]);

  // A plan's list price already carries its discount; surface that rather than
  // asking the admin to recompute it by hand.
  const suggestedDiscount = useMemo(() => {
    if (!selectedPlan || selectedPlan.discountPercent <= 0) return 0;
    return Math.round((selectedPlan.price * selectedPlan.discountPercent) / 100);
  }, [selectedPlan]);

  const priceValue = price ? toNumber(price) : 0;
  const discountValue = discountAmount ? toNumber(discountAmount) : 0;
  const finalPrice = Math.max(priceValue - discountValue, 1);

  const onSubmit = async (data: MembershipFormData) => {
    const body = {
      userId,
      planId: data.planId,
      branchId: data.branchId,
      startDate: data.startDate,
      endDate: data.endDate,
      sessionsTotal: toNumber(data.sessionsTotal),
      sessionsUsed: toNumber(data.sessionsUsed),
      price: priceValue,
      discountAmount: discountValue,
      finalPrice,
    };

    try {
      if (membership) {
        await updateMembership.mutateAsync({ id: membership.id, ...body });
        toast.success("اشتراک به‌روزرسانی شد");
      } else {
        await createMembership.mutateAsync(body);
        toast.success("پلن اشتراک تخصیص داده شد");
      }
      onDone();
    } catch (error) {
      toast.error(apiErrorMessage(error, membership ? "ویرایش اشتراک ناموفق بود" : "تخصیص پلن ناموفق بود"));
    }
  };

  const loadingOptions = plans.isLoading || branches.isLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-2" noValidate>
      {loadingOptions ? (
        <>
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </>
      ) : (
        <>
          <Field
            label="پلن اشتراک"
            error={errors.planId?.message}
            hint={
              plans.isError
                ? "فهرست پلن‌ها بارگذاری نشد."
                : selectedPlan
                  ? `${formatPersianNumber(selectedPlan.durationDays)} روز · ${formatPersianNumber(selectedPlan.sessionsCount)} جلسه`
                  : "انتخاب پلن، مدت و مبلغ پیشنهادی را پر می‌کند."
            }
            required
          >
            {(control) => (
              <Select value={planId} onValueChange={(value) => setValue("planId", value, { shouldValidate: true })}>
                <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
                  <SelectValue placeholder="انتخاب پلن" />
                </SelectTrigger>
                <SelectContent>
                  {planOptions.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id} className="min-h-11">
                      {plan.name}
                      {!plan.isActive && " (غیرفعال)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          <Field label="شعبه" error={errors.branchId?.message} required>
            {(control) => (
              <Select value={branchId} onValueChange={(value) => setValue("branchId", value, { shouldValidate: true })}>
                <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
                  <SelectValue placeholder="انتخاب شعبه" />
                </SelectTrigger>
                <SelectContent>
                  {(branches.data?.data ?? []).map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="min-h-11">
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        </>
      )}

      <div className="grid gap-4 @sm:grid-cols-2">
        <Input
          id="membership-start"
          label="تاریخ شروع"
          type="date"
          dir="ltr"
          required
          error={errors.startDate?.message}
          hint={jalaliHint(startDate)}
          {...register("startDate")}
        />
        <Input
          id="membership-end"
          label="تاریخ پایان"
          type="date"
          dir="ltr"
          required
          error={errors.endDate?.message}
          hint={jalaliHint(watch("endDate") ?? "")}
          {...register("endDate")}
        />
      </div>

      <div className="grid gap-4 @sm:grid-cols-2">
        <Input
          id="membership-sessions-total"
          label="کل جلسات"
          inputMode="numeric"
          dir="ltr"
          required
          error={errors.sessionsTotal?.message}
          {...register("sessionsTotal")}
        />
        <Input
          id="membership-sessions-used"
          label="جلسات استفاده‌شده"
          inputMode="numeric"
          dir="ltr"
          required
          error={errors.sessionsUsed?.message}
          {...register("sessionsUsed")}
        />
      </div>

      <div className="grid gap-4 @sm:grid-cols-2">
        <Input
          id="membership-price"
          label="مبلغ کل (ریال)"
          inputMode="numeric"
          dir="ltr"
          required
          error={errors.price?.message}
          {...register("price")}
        />
        <Input
          id="membership-discount"
          label="تخفیف (ریال)"
          inputMode="numeric"
          dir="ltr"
          error={errors.discountAmount?.message}
          hint={suggestedDiscount > 0 ? `تخفیف پلن: ${formatCurrency(suggestedDiscount)}` : "اختیاری"}
          {...register("discountAmount")}
        />
      </div>

      {suggestedDiscount > 0 && discountValue !== suggestedDiscount && (
        <Button type="button" variant="subtle" className="w-full" onClick={() => setValue("discountAmount", String(suggestedDiscount))}>
          اعمال تخفیف پلن ({formatCurrency(suggestedDiscount)})
        </Button>
      )}

      <p className="rounded-xl bg-muted p-3 text-xs leading-6 text-muted-foreground">
        مبلغ نهایی قابل پرداخت:{" "}
        <span className="font-semibold text-foreground">{formatCurrency(finalPrice)}</span>
        {" · "}
        سهمیهٔ جلسات: {formatPersianNumber(Math.max(toNumber(sessionsTotal || "0") - toNumber(watch("sessionsUsed") || "0"), 0))}{" "}
        جلسه
      </p>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          انصراف
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {membership ? <PencilLine aria-hidden className="h-4 w-4" /> : <CalendarPlus aria-hidden className="h-4 w-4" />}
          {membership ? "ذخیره تغییرات" : "تخصیص پلن"}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Freeze / unfreeze                                                           */
/* -------------------------------------------------------------------------- */

export interface FreezeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membership: Membership;
}

/**
 * Freezes a membership.
 *
 * Deliberately not optimistic anywhere in the chain: `useFreezeMembership` is
 * non-optimistic by design because the server answers 400 unless the membership
 * is currently `active`. So a freeze attempted against anything else — an
 * already-frozen or expired row, a stale list — is reported as a real failure
 * message rather than a silent snap-back to the previous badge.
 */
export function FreezeSheet({ open, onOpenChange, membership }: FreezeSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="توقف اشتراک"
      description="در مدت توقف، روزهای اشتراک مصرف نمی‌شود"
    >
      <FreezeForm membership={membership} onDone={() => onOpenChange(false)} />
    </Sheet>
  );
}

function FreezeForm({ membership, onDone }: { membership: Membership; onDone: () => void }) {
  const freeze = useFreezeMembership();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FreezeFormData>({
    resolver: zodResolver(freezeSchema),
    defaultValues: { reason: "", endDate: "" },
  });

  const endDate = watch("endDate");

  const onSubmit = async (data: FreezeFormData) => {
    try {
      await freeze.mutateAsync({
        id: membership.id,
        reason: data.reason,
        endDate: data.endDate || undefined,
      });
      toast.success("اشتراک متوقف شد");
      onDone();
    } catch (error) {
      toast.error(apiErrorMessage(error, "توقف اشتراک ناموفق بود"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-2" noValidate>
      <Input
        id="freeze-reason"
        label="دلیل توقف"
        placeholder="مثلاً: آسیب‌دیدگی، سفر"
        required
        error={errors.reason?.message}
        {...register("reason")}
      />
      <Input
        id="freeze-end"
        label="تاریخ پایان توقف"
        type="date"
        dir="ltr"
        error={errors.endDate?.message}
        hint={jalaliHint(endDate) ?? "اختیاری — اگر خالی بماند، توقف باز می‌ماند."}
        {...register("endDate")}
      />
      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          انصراف
        </Button>
        <Button type="submit" loading={isSubmitting}>
          <Snowflake aria-hidden className="h-4 w-4" />
          توقف اشتراک
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Unfreeze                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Re-activates a frozen membership.
 *
 * `useUnfreezeMembership` takes only an id and the server refuses anything that
 * is not `frozen`, so there is nothing to collect from the admin — the call site
 * confirms with `ConfirmDialog` and reports the 400 as a real message.
 */
export function useUnfreezeMembershipAction() {
  const unfreeze = useUnfreezeMembership();
  return {
    isPending: unfreeze.isPending,
    run: (membership: Membership, onDone?: () => void) =>
      unfreeze.mutate(membership.id, {
        onSuccess: () => {
          toast.success("اشتراک دوباره فعال شد");
          onDone?.();
        },
        onError: (error) => toast.error(apiErrorMessage(error, "فعال‌سازی دوباره ناموفق بود")),
      }),
  };
}

/** Exported for the detail page's own labels, so the status copy lives in one place. */
export const MEMBERSHIP_ACTION_LABEL = {
  freeze: "توقف اشتراک",
  unfreeze: "فعال‌سازی دوباره",
  deduct: "کسر یک جلسه",
} as const;

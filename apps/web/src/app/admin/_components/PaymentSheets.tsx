"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { MoreHorizontal, PencilLine, Receipt, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/animations/Skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { apiErrorMessage } from "@/components/auth/auth-helpers";
import {
  useCreatePayment,
  useMemberships,
  useUpdatePayment,
  useUpdatePaymentStatus,
  useUsers,
} from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/lib/types";
import { PAYMENT_STATUS, fullName } from "./admin-data";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./Field";
import { PAYMENT_EDITABLE_STATUSES, PAYMENT_METHOD_OPTIONS } from "./user-admin";

const NO_MEMBERSHIP = "none";
const MENU_ITEM = "min-h-11 gap-2 px-3";

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

const newPaymentSchema = z.object({
  userId: z.string().min(1, "عضو را انتخاب کنید"),
  amount: z
    .string()
    .trim()
    .min(1, "مبلغ را وارد کنید")
    .refine((value) => {
      const parsed = toAmount(value);
      return Number.isFinite(parsed) && parsed > 0;
    }, "مبلغ باید عددی بزرگ‌تر از صفر باشد"),
  method: z.enum(["card", "cash", "wallet", "bank_transfer"]),
  membershipId: z.string().optional(),
  description: z.string().trim().max(300, "بیش از حد طولانی است").optional(),
});

type NewPaymentFormData = z.infer<typeof newPaymentSchema>;

const editPaymentSchema = z.object({
  status: z.enum(PAYMENT_EDITABLE_STATUSES),
  method: z.enum(["card", "cash", "wallet", "bank_transfer"]),
  notes: z.string().trim().max(300, "بیش از حد طولانی است"),
});

type EditPaymentFormData = z.infer<typeof editPaymentSchema>;

/* -------------------------------------------------------------------------- */
/* Record a payment                                                            */
/* -------------------------------------------------------------------------- */

export function NewPaymentSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="ثبت پرداخت"
      description="تراکنش نقدی یا دستی را برای یکی از اعضا ثبت کنید"
    >
      <NewPaymentForm onDone={() => onOpenChange(false)} />
    </Sheet>
  );
}

function NewPaymentForm({ onDone }: { onDone: () => void }) {
  const createPayment = useCreatePayment();
  const members = useUsers("athlete");
  const memberships = useMemberships();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewPaymentFormData>({
    resolver: zodResolver(newPaymentSchema),
    defaultValues: {
      userId: "",
      amount: "",
      method: "cash",
      membershipId: NO_MEMBERSHIP,
      description: "",
    },
  });

  const userId = watch("userId");
  const method = watch("method");
  const membershipId = watch("membershipId");

  // Only the chosen member's memberships, so a payment cannot be attached to
  // somebody else's subscription.
  const theirMemberships = useMemo(
    () => (memberships.data?.data ?? []).filter((membership) => membership.userId === userId),
    [memberships.data, userId]
  );

  const onSubmit = async (data: NewPaymentFormData) => {
    try {
      await createPayment.mutateAsync({
        userId: data.userId,
        amount: toAmount(data.amount),
        method: data.method,
        membershipId: data.membershipId === NO_MEMBERSHIP ? undefined : data.membershipId,
        description: data.description || undefined,
      });
      toast.success("پرداخت ثبت شد");
      onDone();
    } catch (error) {
      toast.error(apiErrorMessage(error, "ثبت پرداخت ناموفق بود"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-2" noValidate>
      {members.isLoading ? (
        <Skeleton className="h-20 w-full rounded-2xl" />
      ) : (
        <Field
          label="عضو"
          error={errors.userId?.message}
          hint={members.isError ? "فهرست اعضا بارگذاری نشد." : undefined}
          required
        >
          {(control) => (
            <Select value={userId} onValueChange={(value) => setValue("userId", value, { shouldValidate: true })}>
              <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
                <SelectValue placeholder="انتخاب عضو" />
              </SelectTrigger>
              <SelectContent>
                {(members.data?.data ?? []).map((member) => (
                  <SelectItem key={member.id} value={member.id} className="min-h-11">
                    {fullName(member) || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      )}

      <Input
        id="payment-amount"
        label="مبلغ (ریال)"
        inputMode="numeric"
        dir="ltr"
        required
        error={errors.amount?.message}
        {...register("amount")}
      />

      <Field label="روش پرداخت" error={errors.method?.message} required>
        {(control) => (
          <Select
            value={method}
            onValueChange={(value) => setValue("method", value as NewPaymentFormData["method"])}
          >
            <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="min-h-11">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      {userId && theirMemberships.length > 0 && (
        <Field label="اتصال به اشتراک" error={errors.membershipId?.message} hint="اختیاری است.">
          {(control) => (
            <Select
              value={membershipId ?? NO_MEMBERSHIP}
              onValueChange={(value) => setValue("membershipId", value)}
            >
              <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MEMBERSHIP} className="min-h-11">
                  بدون اتصال
                </SelectItem>
                {theirMemberships.map((membership) => (
                  <SelectItem key={membership.id} value={membership.id} className="min-h-11">
                    {membership.plan?.name ?? "اشتراک"} — {formatDate(membership.startDate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      )}

      <Field label="توضیحات" error={errors.description?.message} hint="اختیاری — مثلاً شمارهٔ رسید دستی.">
        {(control) => (
          <Textarea
            {...control}
            rows={3}
            placeholder="توضیح کوتاه دربارهٔ این تراکنش…"
            className="rounded-2xl"
            {...register("description")}
          />
        )}
      </Field>

      <p className="rounded-xl bg-muted p-3 text-xs leading-6 text-muted-foreground">
        پرداخت تازه با وضعیت «موفق» ثبت می‌شود. برای ثبت تراکنش در انتظار یا ناموفق، پس از ثبت وضعیت
        آن را از همین فهرست تغییر دهید.
      </p>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          انصراف
        </Button>
        <Button type="submit" loading={isSubmitting}>
          <Receipt aria-hidden className="h-4 w-4" />
          ثبت پرداخت
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Reconcile a payment                                                         */
/* -------------------------------------------------------------------------- */

export function EditPaymentSheet({
  open,
  onOpenChange,
  payment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="ویرایش پرداخت"
      description={`${formatCurrency(payment.amount)} — ${fullName(payment.user) || payment.userId}`}
    >
      <EditPaymentForm payment={payment} onDone={() => onOpenChange(false)} />
    </Sheet>
  );
}

function EditPaymentForm({ payment, onDone }: { payment: Payment; onDone: () => void }) {
  const updatePayment = useUpdatePayment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditPaymentFormData>({
    resolver: zodResolver(editPaymentSchema),
    defaultValues: {
      // `cancelled` is not among the statuses `PUT /payments/{id}` accepts, so
      // a cancelled payment opens on `pending` rather than on a value the save
      // would be rejected for.
      status: PAYMENT_EDITABLE_STATUSES.includes(payment.status as (typeof PAYMENT_EDITABLE_STATUSES)[number])
        ? (payment.status as EditPaymentFormData["status"])
        : "pending",
      method: payment.method,
      notes: payment.description ?? "",
    },
  });

  const status = watch("status");
  const method = watch("method");

  const onSubmit = async (data: EditPaymentFormData) => {
    try {
      await updatePayment.mutateAsync({
        id: payment.id,
        data: { status: data.status, method: data.method, notes: data.notes },
      });
      toast.success("پرداخت به‌روزرسانی شد");
      onDone();
    } catch (error) {
      toast.error(apiErrorMessage(error, "به‌روزرسانی پرداخت ناموفق بود"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-2" noValidate>
      <Field label="وضعیت" error={errors.status?.message} required>
        {(control) => (
          <Select
            value={status}
            onValueChange={(value) => setValue("status", value as EditPaymentFormData["status"])}
          >
            <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_EDITABLE_STATUSES.map((value) => (
                <SelectItem key={value} value={value} className="min-h-11">
                  {PAYMENT_STATUS[value].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <Field label="روش پرداخت" error={errors.method?.message} required>
        {(control) => (
          <Select
            value={method}
            onValueChange={(value) => setValue("method", value as EditPaymentFormData["method"])}
          >
            <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="min-h-11">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <Field label="توضیحات" error={errors.notes?.message}>
        {(control) => (
          <Textarea {...control} rows={3} className="rounded-2xl" {...register("notes")} />
        )}
      </Field>

      <p className="rounded-xl bg-muted p-3 text-xs leading-6 text-muted-foreground">
        برای «لغو» کردن یک تراکنش از فهرست وضعیت در منوی عملیات استفاده کنید؛ این فرم وضعیت «لغوشده»
        را نمی‌پذیرد.
      </p>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          انصراف
        </Button>
        <Button type="submit" loading={isSubmitting}>
          <PencilLine aria-hidden className="h-4 w-4" />
          ذخیره تغییرات
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Row actions                                                                 */
/* -------------------------------------------------------------------------- */

const ALL_STATUSES: Payment["status"][] = [
  "completed",
  "pending",
  "failed",
  "refunded",
  "cancelled",
];

/** Status changes that rewrite the revenue report — always confirmed first. */
const RISKY_STATUSES: Payment["status"][] = ["cancelled", "refunded", "failed"];

/**
 * Status transitions plus the edit sheet for one payment.
 *
 * The transitions go through `useUpdatePaymentStatus` rather than
 * `useUpdatePayment`: it is the only route that accepts `cancelled` (the other
 * answers 422) and it cannot blank a field the caller never sent.
 *
 * Transitions to a destructive status (`cancelled`, `refunded`, `failed`) are
 * confirmed first — they rewrite the revenue report — while `completed` and
 * `pending` apply at once.
 */
export function PaymentRowActions({ payment }: { payment: Payment }) {
  const [editing, setEditing] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Payment["status"] | null>(null);
  const updateStatus = useUpdatePaymentStatus();

  const label = `${formatCurrency(payment.amount)} — ${fullName(payment.user) || payment.userId}`;

  const runStatusChange = (status: Payment["status"], onDone?: () => void) => {
    updateStatus.mutate(
      { id: payment.id, status },
      {
        onSuccess: () => {
          toast.success(`وضعیت تراکنش به «${PAYMENT_STATUS[status].label}» تغییر کرد`);
          onDone?.();
        },
        onError: (error) => toast.error(apiErrorMessage(error, "تغییر وضعیت تراکنش ناموفق بود")),
      }
    );
  };

  const requestStatusChange = (status: Payment["status"]) => {
    if (RISKY_STATUSES.includes(status)) {
      setPendingStatus(status);
      return;
    }
    runStatusChange(status);
  };

  const confirmPending = () => {
    if (!pendingStatus) return;
    runStatusChange(pendingStatus, () => setPendingStatus(null));
  };

  const pendingMeta = pendingStatus ? PAYMENT_STATUS[pendingStatus] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`عملیات تراکنش ${label}`}>
            <MoreHorizontal aria-hidden className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className={MENU_ITEM} onSelect={() => setEditing(true)}>
            <PencilLine aria-hidden className="h-4 w-4" />
            ویرایش پرداخت
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            تغییر وضعیت
          </DropdownMenuLabel>
          {ALL_STATUSES.filter((status) => status !== payment.status).map((status) => (
            <DropdownMenuItem
              key={status}
              className={MENU_ITEM}
              disabled={updateStatus.isPending}
              onSelect={() => requestStatusChange(status)}
            >
              <ShieldCheck aria-hidden className="h-4 w-4" />
              {PAYMENT_STATUS[status].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <EditPaymentSheet open={editing} onOpenChange={setEditing} payment={payment} />
      <ConfirmDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
        title={pendingMeta ? `تغییر وضعیت به «${pendingMeta.label}»` : "تغییر وضعیت تراکنش"}
        description={
          pendingMeta
            ? `تراکنش ${label} به وضعیت «${pendingMeta.label}» می‌رود و در گزارش درآمد اثر می‌گذارد. ادامه می‌دهید؟`
            : "وضعیت این تراکنش تغییر می‌کند."
        }
        confirmLabel={pendingMeta ? `تأیید «${pendingMeta.label}»` : "تأیید تغییر"}
        variant={pendingStatus === "cancelled" ? "destructive" : "warning"}
        loading={updateStatus.isPending}
        onConfirm={confirmPending}
      />
    </>
  );
}

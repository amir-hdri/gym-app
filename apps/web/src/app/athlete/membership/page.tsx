"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { formatPersianNumber, formatCurrency, formatDate, calculateProgress } from "@/lib/utils";
import { CreditCard, Calendar, Award, CheckCircle, AlertTriangle, Crown, Check, ShieldCheck, RefreshCw, Receipt } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useMemberships, usePayments, useMembershipPlans, useRenewMembership, useCreatePayment } from "@/hooks/use-api";
import type { Payment } from "@/lib/types";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { PageShell, PageHeader, SectionTitle, MicroLabelFa } from "@/components/twilight/Page";
import { TwilightCard, CtaButton, EmptyState } from "@/components/twilight/controls";
import { paymentMethodLabels } from "../payment-meta";

const PAYMENT_METHODS: Payment["method"][] = ["card", "cash", "wallet", "bank_transfer"];

export default function MembershipPage() {
  const { user } = useAuth();
  const athleteId = user?.id;

  const { data: membershipsData, isLoading: membershipsLoading, isError: membershipsError, error: membershipsErr } = useMemberships();
  const { data: paymentsData, isLoading: paymentsLoading, isError: paymentsError, error: paymentsErr } = usePayments(athleteId);
  const { data: plansData, isLoading: plansLoading } = useMembershipPlans();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const renewMutation = useRenewMembership();
  const createPaymentMutation = useCreatePayment();

  // Renew dialog state (reset checkbox defaults to on)
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewEndDate, setRenewEndDate] = useState("");
  const [renewSessionsTotal, setRenewSessionsTotal] = useState("");
  const [renewResetUsed, setRenewResetUsed] = useState(true);
  const [renewDone, setRenewDone] = useState(false);

  // Payment form state — amount prefills from the membership's final price
  const [payAmount, setPayAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [payMethod, setPayMethod] = useState<Payment["method"]>("card");
  const [payDescription, setPayDescription] = useState("");
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null);

  const allMemberships = membershipsData?.data || [];
  const membership = allMemberships.find((m) => m.userId === user?.id) || allMemberships[0];
  const payments = paymentsData?.data || [];
  const plans = plansData?.data || [];
  const todayInput = new Date().toISOString().slice(0, 10);

  // Prefill the amount from the membership until the member types: derived
  // during render (no effect) so there is no cascading render.
  const shownPayAmount = amountTouched || !membership ? payAmount : (payAmount !== "" ? payAmount : String(membership.finalPrice));

  const handleRenewConfirm = () => {
    if (!membership) return;
    if (!renewEndDate) {
      toast.error("تاریخ پایان جدید را انتخاب کنید");
      return;
    }
    if (renewEndDate < todayInput) {
      toast.error("تاریخ پایان نمی‌تواند قبل از امروز باشد");
      return;
    }
    const sessionsTotal = renewSessionsTotal === "" ? undefined : Number(renewSessionsTotal);
    if (sessionsTotal !== undefined && (!Number.isFinite(sessionsTotal) || sessionsTotal <= 0)) {
      toast.error("تعداد جلسات باید عدد مثبت باشد");
      return;
    }
    renewMutation.mutate(
      {
        id: membership.id,
        endDate: new Date(renewEndDate).toISOString(),
        ...(sessionsTotal !== undefined ? { sessionsTotal } : {}),
        resetSessionsUsed: renewResetUsed,
      },
      {
        onSuccess: () => {
          toast.success("اشتراک با موفقیت تمدید شد");
          setRenewDone(true);
          setRenewOpen(false);
        },
        onError: (e) => toast.error((e as Error)?.message || "تمدید اشتراک ناموفق بود"),
      }
    );
  };

  const handleCreatePayment = () => {
    if (!athleteId || !membership) return;
    const amount = Number(shownPayAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("مبلغ معتبر وارد کنید");
      return;
    }
    createPaymentMutation.mutate(
      {
        userId: athleteId,
        membershipId: membership.id,
        amount,
        method: payMethod,
        description: payDescription || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success("درخواست پرداخت ثبت شد و در انتظار تأیید است");
          setCreatedPaymentId(res.data?.id ?? null);
        },
        onError: (e) => toast.error((e as Error)?.message || "ثبت پرداخت ناموفق بود"),
      }
    );
  };

  if (membershipsLoading || paymentsLoading || plansLoading) return <Loading />;
  if (membershipsError) return <ErrorDisplay message={membershipsErr?.message} />;
  if (paymentsError) return <ErrorDisplay message={paymentsErr?.message} />;

  if (!membership) {
    return (
      <PageShell>
        <PageHeader title="عضویت و پرداخت" subtitle="وضعیت اشتراک و سوابق پرداخت" />
        <EmptyState
          icon={<CreditCard className="h-6 w-6" strokeWidth={1.75} />}
          title="اشتراک فعالی وجود ندارد"
          description="شما هنوز اشتراکی خریداری نکرده‌اید"
        />
      </PageShell>
    );
  }

  const remaining = membership.sessionsRemaining;
  const progress = calculateProgress(membership.sessionsUsed, membership.sessionsTotal);
  const isActive = membership.status === "active";

  const selectedPlan =
    plans.find((p) => p.id === selectedPlanId) ||
    plans.find((p) => p.id === membership.planId) ||
    plans[0];

  return (
    <PageShell>
      <PageHeader title="عضویت و پرداخت" subtitle="وضعیت اشتراک و سوابق پرداخت" />

      {/* Current subscription — SubscriptionModal header pattern */}
      <TwilightCard className="p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full border border-blush/30 bg-blush/10 text-blush shadow-lg">
            <Crown className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h2 className="font-serif text-2xl font-medium text-foreground">
            {membership.plan?.name || "اشتراک"}
          </h2>
          <Badge
            variant={isActive ? "success" : "secondary"}
            className={isActive ? "border-transparent bg-blush-solid text-blush-foreground" : undefined}
          >
            {isActive ? "فعال" : membership.status}
          </Badge>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
              شروع: {formatDate(membership.startDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
              پایان: {formatDate(membership.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
              مبلغ: {formatCurrency(membership.finalPrice)}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-xs text-muted-foreground">جلسات استفاده شده</span>
          <span className="font-sans text-sm font-medium tabular-nums text-foreground">
            {formatPersianNumber(membership.sessionsUsed)} / {formatPersianNumber(membership.sessionsTotal)}
          </span>
        </div>
        <Progress
          value={progress}
          className="mt-3 bg-border"
          indicatorClassName="bg-none bg-blush-solid shadow-none"
        />
        <p className="mt-3 text-center font-sans text-2xl font-normal tabular-nums text-blush">
          {formatPersianNumber(remaining)}
          <span className="mr-2 text-xs font-normal text-muted-foreground">جلسه باقی‌مانده</span>
        </p>
      </TwilightCard>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <MicroLabelFa>جلسات باقی‌مانده</MicroLabelFa>
            <Award className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-sans text-2xl font-normal tabular-nums text-foreground">
            {formatPersianNumber(remaining)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">از {formatPersianNumber(membership.sessionsTotal)} جلسه</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <MicroLabelFa>وضعیت اشتراک</MicroLabelFa>
            <CheckCircle className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-sans text-2xl font-normal text-primary">
            {isActive ? "فعال" : membership.status}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">تا {formatDate(membership.endDate)}</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <MicroLabelFa>پرداخت بعدی</MicroLabelFa>
            <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-sans text-lg font-normal text-foreground">
            {formatDate(membership.endDate)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">تاریخ سررسید</p>
        </div>
      </div>

      {/* Plans — SubscriptionModal plan-selector pattern */}
      {plans.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>تمدید و ارتقا</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {plans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 text-right transition-all ${
                    isSelected
                      ? "border-primary bg-secondary shadow-md"
                      : "border-border bg-card opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                      {plan.discountPercent > 0 && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {formatPersianNumber(plan.discountPercent)}٪ تخفیف
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatPersianNumber(plan.durationDays)} روز · {formatPersianNumber(plan.sessionsCount)} جلسه
                      {plan.description ? ` · ${plan.description}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-left font-sans">
                    <span className="block text-base font-bold tabular-nums text-foreground">
                      {formatCurrency(plan.price)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedPlan?.features && selectedPlan.features.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              {selectedPlan.features.map((perk, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary/50 bg-secondary text-primary">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </div>
                  <span className="leading-relaxed">{perk}</span>
                </div>
              ))}
            </div>
          )}

          {renewDone ? (
            <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3.5 text-center text-xs text-primary">
              <Check className="h-4 w-4" strokeWidth={1.75} />
              <span>اشتراک شما تمدید شد؛ پس از پرداخت، اشتراک فعال می‌شود</span>
            </div>
          ) : (
            <CtaButton variant="orange" onClick={() => setRenewOpen(true)} className="min-h-11">
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
              <span>تمدید اشتراک</span>
            </CtaButton>
          )}

          <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تمدید اشتراک</DialogTitle>
                <DialogDescription>
                  تاریخ پایان جدید و تعداد جلسات دوره بعد را مشخص کنید
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <Input
                  type="date"
                  label="تاریخ پایان جدید"
                  required
                  value={renewEndDate}
                  min={todayInput}
                  onChange={(e) => setRenewEndDate(e.target.value)}
                  className="min-h-11"
                />
                <Input
                  type="number"
                  label="تعداد جلسات دوره جدید (اختیاری)"
                  hint="خالی بگذارید تا بدون تغییر بماند"
                  value={renewSessionsTotal}
                  min={1}
                  inputMode="numeric"
                  onChange={(e) => setRenewSessionsTotal(e.target.value)}
                  className="min-h-11"
                />
                <label htmlFor="renew-reset-used" className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    id="renew-reset-used"
                    checked={renewResetUsed}
                    onCheckedChange={(v) => setRenewResetUsed(v === true)}
                  />
                  <span>شمارنده جلسات استفاده‌شده صفر شود</span>
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRenewOpen(false)} disabled={renewMutation.isPending}>
                  انصراف
                </Button>
                <Button onClick={handleRenewConfirm} loading={renewMutation.isPending}>
                  تأیید تمدید
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
            <span>پرداخت امن · پشتیبانی باشگاه</span>
          </div>
        </section>
      )}

      {/* Payment — creates a pending payment receipt */}
      <TwilightCard className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
            <Receipt className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <SectionTitle>پرداخت</SectionTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">ثبت پرداخت جدید برای این اشتراک</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Input
            type="number"
            label="مبلغ (تومان)"
            required
            value={shownPayAmount}
            min={1}
            inputMode="numeric"
            onChange={(e) => {
              setPayAmount(e.target.value);
              setAmountTouched(true);
            }}
            className="min-h-11"
          />
          <div>
            <MicroLabelFa className="mb-1.5 block">روش پرداخت</MicroLabelFa>
            <Select value={payMethod} onValueChange={(v) => setPayMethod(v as Payment["method"])}>
              <SelectTrigger aria-label="روش پرداخت" className="min-h-11 w-full">
                <SelectValue placeholder="انتخاب روش پرداخت" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{paymentMethodLabels[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            type="text"
            label="توضیحات (اختیاری)"
            value={payDescription}
            onChange={(e) => setPayDescription(e.target.value)}
            className="min-h-11"
          />
        </div>
        <CtaButton
          variant="cream"
          onClick={handleCreatePayment}
          disabled={createPaymentMutation.isPending}
          className="min-h-11"
        >
          <CreditCard className="h-4 w-4" strokeWidth={1.75} />
          <span>{createPaymentMutation.isPending ? "در حال ثبت…" : "ثبت پرداخت"}</span>
        </CtaButton>
        <div role="status" aria-live="polite" className="text-center text-xs text-muted-foreground">
          {createPaymentMutation.isError
            ? (createPaymentMutation.error as Error)?.message || "ثبت پرداخت ناموفق بود"
            : createdPaymentId
              ? (
                <span>
                  پرداخت با موفقیت ثبت شد (در انتظار تأیید) —{" "}
                  <Link href={`/athlete/membership/payments/${createdPaymentId}`} className="font-bold text-primary hover:underline">
                    مشاهده رسید
                  </Link>
                </span>
              )
              : "پس از ثبت، رسید پرداخت در همین صفحه نمایش داده می‌شود"}
        </div>
      </TwilightCard>

      {/* Payment history */}
      <section className="flex flex-col gap-3">
        <SectionTitle>تاریخچه پرداخت‌ها</SectionTitle>
        {payments.length === 0 ? (
          <EmptyState title="پرداختی ثبت نشده" description="هنوز پرداختی انجام نداده‌اید" />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="bg-transparent text-[11px] font-semibold text-muted-foreground">مبلغ</TableHead>
                  <TableHead className="bg-transparent text-[11px] font-semibold text-muted-foreground">روش پرداخت</TableHead>
                  <TableHead className="bg-transparent text-[11px] font-semibold text-muted-foreground">وضعیت</TableHead>
                  <TableHead className="bg-transparent text-[11px] font-semibold text-muted-foreground">تاریخ</TableHead>
                  <TableHead className="w-20 bg-transparent text-[11px] font-semibold text-muted-foreground">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} className="border-t border-border hover:bg-secondary">
                    <TableCell className="font-medium tabular-nums text-foreground">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.method}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "completed" ? "success" : "secondary"}>
                        {p.status === "completed" ? "موفق" : p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(p.paidAt || p.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/athlete/membership/payments/${p.id}`} className="text-sm text-primary hover:underline">
                        جزئیات
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </PageShell>
  );
}

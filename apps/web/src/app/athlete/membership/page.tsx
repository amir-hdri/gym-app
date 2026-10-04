"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { formatPersianNumber, formatCurrency, formatDate, calculateProgress } from "@/lib/utils";
import { CreditCard, Calendar, Award, CheckCircle, AlertTriangle, Crown, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useMemberships, usePayments, useMembershipPlans } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { PageShell, PageHeader, SectionTitle, MicroLabelFa } from "@/components/twilight/Page";
import { TwilightCard, CtaButton, EmptyState } from "@/components/twilight/controls";

export default function MembershipPage() {
  const { user } = useAuth();
  const athleteId = user?.id;

  const { data: membershipsData, isLoading: membershipsLoading, isError: membershipsError, error: membershipsErr } = useMemberships();
  const { data: paymentsData, isLoading: paymentsLoading, isError: paymentsError, error: paymentsErr } = usePayments(athleteId);
  const { data: plansData, isLoading: plansLoading } = useMembershipPlans();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isRenewed, setIsRenewed] = useState(false);

  const allMemberships = membershipsData?.data || [];
  const membership = allMemberships.find((m) => m.userId === user?.id) || allMemberships[0];
  const payments = paymentsData?.data || [];
  const plans = plansData?.data || [];

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
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full border border-[#d2c0a5]/40 bg-[#202734] text-[#d2c0a5] shadow-lg">
            <Crown className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h2 className="font-serif text-2xl font-medium text-white">
            {membership.plan?.name || "اشتراک"}
          </h2>
          <Badge variant={isActive ? "success" : "secondary"}>
            {isActive ? "فعال" : membership.status}
          </Badge>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#8e98a8]">
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

        <div className="mt-5 flex items-center justify-between rounded-xl border border-[#2b313d] bg-[#181c22] px-4 py-3">
          <span className="text-xs text-[#8e98a8]">جلسات استفاده شده</span>
          <span className="font-sans text-sm font-medium tabular-nums text-white">
            {formatPersianNumber(membership.sessionsUsed)} / {formatPersianNumber(membership.sessionsTotal)}
          </span>
        </div>
        <Progress
          value={progress}
          className="mt-3 bg-white/10"
          indicatorClassName="bg-[#d2c0a5] shadow-none"
        />
        <p className="mt-3 text-center font-sans text-2xl font-normal tabular-nums text-[#d2c0a5]">
          {formatPersianNumber(remaining)}
          <span className="mr-2 text-xs font-normal text-[#8e98a8]">جلسه باقی‌مانده</span>
        </p>
      </TwilightCard>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#232934] bg-[#161a22] p-4">
          <div className="flex items-center justify-between">
            <MicroLabelFa>جلسات باقی‌مانده</MicroLabelFa>
            <Award className="h-4 w-4 text-[#d2c0a5]" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-sans text-2xl font-normal tabular-nums text-white">
            {formatPersianNumber(remaining)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8e98a8]">از {formatPersianNumber(membership.sessionsTotal)} جلسه</p>
        </div>
        <div className="rounded-2xl border border-[#232934] bg-[#161a22] p-4">
          <div className="flex items-center justify-between">
            <MicroLabelFa>وضعیت اشتراک</MicroLabelFa>
            <CheckCircle className="h-4 w-4 text-[#d2c0a5]" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-sans text-2xl font-normal text-[#d2c0a5]">
            {isActive ? "فعال" : membership.status}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8e98a8]">تا {formatDate(membership.endDate)}</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-[#232934] bg-[#161a22] p-4">
          <div className="flex items-center justify-between">
            <MicroLabelFa>پرداخت بعدی</MicroLabelFa>
            <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-sans text-lg font-normal text-white">
            {formatDate(membership.endDate)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8e98a8]">تاریخ سررسید</p>
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
                      ? "border-[#d2c0a5] bg-[#19212d] shadow-md"
                      : "border-[#222a36] bg-[#141820] opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{plan.name}</span>
                      {plan.discountPercent > 0 && (
                        <span className="rounded-full bg-[#d2c0a5]/20 px-2 py-0.5 text-[10px] font-bold text-[#d2c0a5]">
                          {formatPersianNumber(plan.discountPercent)}٪ تخفیف
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#8e98a8]">
                      {formatPersianNumber(plan.durationDays)} روز · {formatPersianNumber(plan.sessionsCount)} جلسه
                      {plan.description ? ` · ${plan.description}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-left font-sans">
                    <span className="block text-base font-bold tabular-nums text-white">
                      {formatCurrency(plan.price)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedPlan?.features && selectedPlan.features.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[#1e2532] pt-3">
              {selectedPlan.features.map((perk, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-[#c3ccd8]">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#d2c0a5]/50 bg-[#1e2734] text-[#d2c0a5]">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </div>
                  <span className="leading-relaxed">{perk}</span>
                </div>
              ))}
            </div>
          )}

          {isRenewed ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d2c0a5]/50 bg-[#161c26] p-3.5 text-center text-xs text-[#f3eedf]">
              <Check className="h-4 w-4 text-[#d2c0a5]" strokeWidth={1.75} />
              <span>درخواست تمدید شما ثبت شد؛ پس از پرداخت، اشتراک فعال می‌شود</span>
            </div>
          ) : (
            <CtaButton variant="orange" onClick={() => setIsRenewed(true)}>
              تمدید عضویت و پرداخت آنلاین
            </CtaButton>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#6b7280]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#d2c0a5]" strokeWidth={1.75} />
            <span>پرداخت امن · پشتیبانی باشگاه</span>
          </div>
        </section>
      )}

      {/* Payment history */}
      <section className="flex flex-col gap-3">
        <SectionTitle>تاریخچه پرداخت‌ها</SectionTitle>
        {payments.length === 0 ? (
          <EmptyState title="پرداختی ثبت نشده" description="هنوز پرداختی انجام نداده‌اید" />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#232934] bg-[#161a22]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#1e2430] hover:bg-transparent">
                  <TableHead className="bg-transparent text-[11px] font-semibold text-[#8e98a8]">مبلغ</TableHead>
                  <TableHead className="bg-transparent text-[11px] font-semibold text-[#8e98a8]">روش پرداخت</TableHead>
                  <TableHead className="bg-transparent text-[11px] font-semibold text-[#8e98a8]">وضعیت</TableHead>
                  <TableHead className="bg-transparent text-[11px] font-semibold text-[#8e98a8]">تاریخ</TableHead>
                  <TableHead className="w-20 bg-transparent text-[11px] font-semibold text-[#8e98a8]">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} className="border-t border-[#1e2430] hover:bg-[#1a202a]">
                    <TableCell className="font-medium tabular-nums text-white">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-[#c3ccd8]">{p.method}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "completed" ? "success" : "secondary"}>
                        {p.status === "completed" ? "موفق" : p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#c3ccd8]">{formatDate(p.paidAt || p.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/athlete/membership/payments/${p.id}`} className="text-sm text-[#d2c0a5] hover:underline">
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

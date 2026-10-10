"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Phone, Mail, Calendar, Award, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatPersianNumber, formatCurrency, formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { useUser, useMemberships, useMembershipPlans, useTrainingPrograms, useUsers, useGoals, usePayments } from "@/hooks/use-api";
import { PageShell, SectionTitle } from "@/components/twilight/Page";
import { StatCard, TwilightCard } from "@/components/twilight/controls";
import { PAYMENT_METHOD } from "../../_components/admin-data";

const statusMap: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "فعال", variant: "success" }, inactive: { label: "غیرفعال", variant: "secondary" }, suspended: { label: "تعلیق شده", variant: "destructive" },
};

function InfoRow({ icon, label, value, ltr }: { icon: ReactNode; label: string; value: ReactNode; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 hover:bg-secondary">
      <span className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </span>
      <span dir={ltr ? "ltr" : undefined} className="text-sm text-foreground">{value}</span>
    </div>
  );
}

const thClass = "px-4 py-3 text-right text-[10px] font-semibold text-muted-foreground";
const tdClass = "px-4 py-3 text-muted-foreground";

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = useUser(params.id);
  const { data: membershipsData } = useMemberships();
  const { data: plansData } = useMembershipPlans();
  const { data: programsData } = useTrainingPrograms();
  const { data: usersData } = useUsers();
  const { data: goalsData } = useGoals(data?.data?.id);
  const { data: paymentsData } = usePayments(data?.data?.id);
  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const member = data?.data;
  if (!member) return <ErrorDisplay message="کاربر یافت نشد" />;
  const goals = goalsData?.data ?? [];
  const payments = paymentsData?.data ?? [];

  // The user row carries no membership/plan/coach fields — resolve them from
  // their own sources instead of rendering literal "undefined".
  const membership = (membershipsData?.data ?? [])
    .filter((m) => m.userId === member.id)
    .sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""))[0];
  const planName = plansData?.data?.find((p) => p.id === membership?.planId)?.name;
  const coachId = (programsData?.data ?? []).find((p) => p.athleteId === member.id)?.coachId;
  const coach = (usersData?.data ?? []).find((u) => u.id === coachId);
  const coachName = coach ? `${coach.firstName} ${coach.lastName}` : null;

  return (
    <PageShell>
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/members">
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            بازگشت به لیست اعضا
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-gradient-to-br from-secondary to-card">
          <span className="font-serif text-2xl text-primary">
            {getInitials(`${member.firstName} ${member.lastName}`)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-foreground">{member.firstName} {member.lastName}</h1>
            <Badge variant={statusMap[member.status].variant}>{statusMap[member.status].label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Edit className="h-4 w-4" strokeWidth={1.75} /> ویرایش</Button>
          <Button variant="destructive" size="sm" aria-label={`حذف ${member.firstName} ${member.lastName}`}><Trash2 className="h-4 w-4" strokeWidth={1.75} /></Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        <InfoRow icon={<Phone className="h-4 w-4" strokeWidth={1.75} />} label="تلفن" value={member.phone} ltr />
        <InfoRow icon={<Mail className="h-4 w-4" strokeWidth={1.75} />} label="ایمیل" value={member.email} ltr />
        <InfoRow icon={<Award className="h-4 w-4" strokeWidth={1.75} />} label="طرح اشتراک" value={planName ?? "—"} />
        <InfoRow icon={<Calendar className="h-4 w-4" strokeWidth={1.75} />} label="عضویت از" value={formatDate(member.createdAt)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard tone="blush" label="اشتراک" value={planName ?? "—"} suffix={formatDate(member.createdAt)} />
        <StatCard tone="blush" label="مربی" value={coachName ?? "—"} />
        <TwilightCard className="col-span-2 border-blush-solid/30 bg-blush/10">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">جلسات</span>
          <div className="mt-3">
            <span className="font-sans text-2xl font-normal tabular-nums tracking-tight text-foreground">
              {formatPersianNumber(membership?.sessionsUsed ?? 0)} / {formatPersianNumber(membership?.sessionsTotal ?? 0)}
            </span>
            <Progress
              value={((membership?.sessionsUsed || 0) / (membership?.sessionsTotal || 1)) * 100}
              className="mt-3"
              indicatorClassName="bg-none bg-blush-solid"
            />
          </div>
        </TwilightCard>
      </div>

      <Tabs defaultValue="goals" dir="rtl">
        <TabsList>
          <TabsTrigger value="goals">اهداف</TabsTrigger>
          <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-3">
          {goals.map((goal) => (
            <TwilightCard key={goal.id}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{goal.title}</span>
                <span className="text-xs text-muted-foreground">{formatPersianNumber(goal.currentValue)}/{formatPersianNumber(goal.targetValue)} {goal.unit}</span>
              </div>
              <Progress value={goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0} indicatorClassName="bg-none bg-blush-solid" />
            </TwilightCard>
          ))}
        </TabsContent>

        <TabsContent value="payments">
          <SectionTitle className="mb-3">تاریخچه پرداخت‌ها</SectionTitle>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr>
                  <th scope="col" className={thClass}>مبلغ</th>
                  <th scope="col" className={thClass}>روش پرداخت</th>
                  <th scope="col" className={thClass}>وضعیت</th>
                  <th scope="col" className={thClass}>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary">
                    <td className={`${tdClass} font-medium text-foreground`}>{formatCurrency(p.amount)}</td>
                    <td className={tdClass}>{PAYMENT_METHOD[p.method] ?? p.method}</td>
                    <td className={tdClass}><Badge variant={p.status === "completed" ? "success" : "warning"}>{p.status === "completed" ? "موفق" : "معلق"}</Badge></td>
                    <td className={tdClass}>{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Phone, Mail, Calendar, Award, ChevronRight, Dumbbell, Plus, Trash2, MessageCircle, CreditCard } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageShell, PageHeader, SectionTitle } from "@/components/twilight/Page";
import { TwilightCard, EmptyState } from "@/components/twilight/controls";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Sheet } from "@/components/ui/Sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { formatPersianNumber, getInitials, generateAvatarColor, formatDate, formatCurrency, calculateProgress } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiErrorMessage } from "@/components/auth/auth-helpers";
import { useUser, useGoals, useTrainingPrograms, useCheckIns, useConversations, useCreateGoal, useDeleteGoal, useMemberships, usePayments } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { SessionDurationChart } from "@/components/analytics/Charts";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { MEMBER_PROGRESS_FILL } from "../../_accents";
import { SelectField } from "../../_components/SelectField";
import { goalCategoryLabels } from "../../_goals";
import { fromDateInputValue, jalaliLong, shiftDateInput, todayDateInput } from "../../_dates";
import type { Goal, Membership, Payment } from "@/lib/types";

const persianDays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

const membershipStatusConfig: Record<Membership["status"], { label: string; variant: "success" | "outline" | "info" | "secondary" }> = {
  active: { label: "فعال", variant: "success" },
  expired: { label: "منقضی شده", variant: "outline" },
  frozen: { label: "متوقف شده", variant: "info" },
  cancelled: { label: "لغو شده", variant: "secondary" },
};

const paymentStatusConfig: Record<Payment["status"], { label: string; variant: "success" | "warning" | "destructive" | "info" | "outline" }> = {
  pending: { label: "در انتظار", variant: "warning" },
  completed: { label: "موفق", variant: "success" },
  failed: { label: "ناموفق", variant: "destructive" },
  refunded: { label: "بازگشت داده شده", variant: "info" },
  cancelled: { label: "لغو شده", variant: "outline" },
};

const paymentMethodLabels: Record<Payment["method"], string> = {
  card: "کارت بانکی",
  cash: "نقدی",
  wallet: "کیف پول",
  bank_transfer: "انتقال بانکی",
};

/** What the inline create sheet hands to `useCreateGoal` (athlete + dates added by the caller). */
export interface GoalCreatePatch {
  title: string;
  description?: string;
  category: Goal["category"];
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate: string;
}

/** Live membership first, then the latest window — the row meant by "their membership". */
function membershipRank(status: Membership["status"]): number {
  if (status === "active") return 0;
  if (status === "frozen") return 1;
  if (status === "expired") return 2;
  return 3;
}

export default function AthleteDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const coachId = user?.id;
  const { data: userData, isLoading: userLoading, isError: userError, error: userErr, refetch: refetchUser } = useUser(params.id);
  const { data: goalsData, isLoading: goalsLoading } = useGoals(params.id);
  const { data: programsData, isLoading: programsLoading } = useTrainingPrograms();
  const { data: checkInsData, isLoading: checkinsLoading } = useCheckIns(params.id);
  const membershipsQuery = useMemberships();
  const paymentsQuery = usePayments(params.id);
  const conversationsQuery = useConversations(coachId);
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();
  const [goalCreateOpen, setGoalCreateOpen] = React.useState(false);
  const [goalToDelete, setGoalToDelete] = React.useState<Goal | null>(null);

  // The thread with this athlete, when one exists — the messages button
  // deep-links to it, otherwise it falls back to the inbox.
  const conversationForAthlete = React.useMemo(
    () => (conversationsQuery.data?.data ?? []).find((row) => row.athleteId === params.id) ?? null,
    [conversationsQuery.data, params.id]
  );
  const messagesHref = conversationForAthlete
    ? `/coach/messages?c=${conversationForAthlete.id}`
    : "/coach/messages";

  // `useMemberships` is not scoped by user, so the athlete's own rows are
  // picked out here; the live window sorts first. Read-only for coaches.
  const currentMembership = React.useMemo(() => {
    const rows = (membershipsQuery.data?.data ?? []).filter((row) => row.userId === params.id);
    return [...rows].sort(
      (left, right) =>
        membershipRank(left.status) - membershipRank(right.status) ||
        right.endDate.localeCompare(left.endDate)
    )[0] ?? null;
  }, [membershipsQuery.data, params.id]);

  const recentPayments = React.useMemo(() => {
    const rows = paymentsQuery.data?.data ?? [];
    return [...rows]
      .sort((left, right) =>
        (right.paidAt ?? right.createdAt).localeCompare(left.paidAt ?? left.createdAt)
      )
      .slice(0, 5);
  }, [paymentsQuery.data]);

  const handleCreateGoal = async (patch: GoalCreatePatch) => {
    try {
      await createGoal.mutateAsync({
        athleteId: params.id,
        coachId,
        title: patch.title,
        description: patch.description,
        category: patch.category,
        targetValue: patch.targetValue,
        currentValue: patch.currentValue,
        unit: patch.unit,
        startDate: new Date().toISOString(),
        targetDate: patch.targetDate,
        status: patch.currentValue > 0 ? "in_progress" : "not_started",
      });
      setGoalCreateOpen(false);
      toast.success("هدف تازه برای شاگرد ثبت شد");
    } catch (error) {
      toast.error(apiErrorMessage(error, "ثبت هدف ناموفق بود"));
    }
  };

  const handleConfirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    try {
      await deleteGoal.mutateAsync(goalToDelete.id);
      setGoalToDelete(null);
      toast.success("هدف شاگرد حذف شد");
    } catch (error) {
      toast.error(apiErrorMessage(error, "حذف هدف ناموفق بود"));
    }
  };

  if (userLoading) return <Loading />;
  if (userError) return <ErrorDisplay message={userErr?.message} onRetry={refetchUser} />;

  const athlete = userData?.data;
  if (!athlete) return null;

  const athletePrograms = (programsData?.data || []).filter((p) => p.athleteId === params.id);
  const athleteGoals = goalsData?.data || [];
  const athleteHistory = checkInsData?.data || [];

  const name = `${athlete.firstName} ${athlete.lastName}`;

  const groupedPrograms = athletePrograms.flatMap((program) => {
    const grouped: Record<number, typeof program.exercises> = {};
    for (const ex of program.exercises) {
      if (!grouped[ex.dayOfWeek]) grouped[ex.dayOfWeek] = [];
      grouped[ex.dayOfWeek].push(ex);
    }
    return Object.entries(grouped).map(([dayNum, exercises]) => ({
      day: persianDays[Number(dayNum)] || `روز ${Number(dayNum) + 1}`,
      exercises: exercises.map((ex) => ({
        name: ex.exercise?.name || "بدون نام",
        sets: ex.sets,
        reps: Number(ex.reps) || 0,
        weight: ex.weight || 0,
        rest: `${ex.restSeconds} ثانیه`,
      })),
    }));
  });

  return (
    <PageShell>
      <PageHeader
        title={name}
        subtitle={`${athlete.role === "athlete" ? "ورزشکار" : "کاربر"} · عضویت از ${formatDate(athlete.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={messagesHref}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                پیام‌ها
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/coach/athletes">
                <ChevronRight className="h-4 w-4" />
                بازگشت
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col items-center pt-2">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-gradient-to-br from-secondary to-card shadow-xl">
          <Avatar className="h-full w-full">
            <AvatarFallback className={`text-2xl ${generateAvatarColor(name)}`}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant={athlete.status === "active" ? "success" : "secondary"}>
            {athlete.status === "active" ? "فعال" : "غیرفعال"}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5" dir="ltr">
            <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
            {athlete.phone}
          </span>
          <span className="flex items-center gap-1.5" dir="ltr">
            <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
            {athlete.email}
          </span>
          <span className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" strokeWidth={1.75} />
            {athlete.role === "athlete" ? "ورزشکار" : "کاربر"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
            عضویت از {formatDate(athlete.createdAt)}
          </span>
        </div>
      </div>

      <Tabs defaultValue="program" dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl border border-border bg-card p-1">
          <TabsTrigger value="program" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none">برنامه تمرینی</TabsTrigger>
          <TabsTrigger value="progress" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none">پیشرفت</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none">تاریخچه</TabsTrigger>
        </TabsList>

        <TabsContent value="program" className="mt-4 space-y-4">
          {programsLoading ? (
            <Loading message="در حال بارگذاری برنامه..." />
          ) : groupedPrograms.length === 0 ? (
            <EmptyState tone="blush" title="برنامه‌ای ثبت نشده" description="هیچ برنامه تمرینی برای این شاگرد ثبت نشده است" />
          ) : (
            groupedPrograms.map((day) => (
              <div key={day.day}>
                <SectionTitle className="mb-3">{day.day}</SectionTitle>
                <TwilightCard className="divide-y divide-border p-0">
                  {day.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5 first:pt-3.5 last:pb-3.5">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blush-solid/30 bg-blush/15 text-blush">
                          <Dumbbell className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{ex.name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatPersianNumber(ex.sets)} ست × {formatPersianNumber(ex.reps)} تکرار
                            {ex.weight > 0 && ` | ${formatPersianNumber(ex.weight)} کیلوگرم`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">{ex.rest}</Badge>
                    </div>
                  ))}
                </TwilightCard>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-4 space-y-4">
          <SectionTitle
            action={
              <Button size="sm" onClick={() => setGoalCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                هدف تازه
              </Button>
            }
          >
            اهداف
          </SectionTitle>
          {goalsLoading ? (
            <Loading message="در حال بارگذاری اهداف..." />
          ) : athleteGoals.length === 0 ? (
            <EmptyState
              tone="blush"
              title="هدفی ثبت نشده"
              description="هیچ هدفی برای این شاگرد ثبت نشده است"
              action={
                <Button size="sm" onClick={() => setGoalCreateOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  ثبت هدف تازه
                </Button>
              }
            />
          ) : (
            athleteGoals.map((goal) => (
              <TwilightCard key={goal.id}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{goal.title}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatPersianNumber(goal.currentValue)} / {formatPersianNumber(goal.targetValue)} {goal.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGoalToDelete(goal)}
                      aria-label={`حذف هدف ${goal.title}`}
                      title={`حذف هدف ${goal.title}`}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                </div>
                <Progress value={calculateProgress(goal.currentValue, goal.targetValue)} indicatorClassName={`bg-none ${MEMBER_PROGRESS_FILL}`} className="bg-border" />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {formatPersianNumber(Math.round(calculateProgress(goal.currentValue, goal.targetValue)))}٪ تکمیل شده
                </p>
              </TwilightCard>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {checkinsLoading ? (
            <Loading message="در حال بارگذاری تاریخچه..." />
          ) : athleteHistory.length === 0 ? (
            <EmptyState tone="blush" title="چک‌اینی ثبت نشده" description="هیچ چک‌اینی برای این شاگرد ثبت نشده است" />
          ) : (
            <>
              <div>
                <SectionTitle className="mb-3">ریتم تمرین</SectionTitle>
                <TwilightCard>
                  <p className="mb-3 text-[11px] text-muted-foreground">مدت جلسات تکمیل‌شده شاگرد</p>
                  <SessionDurationChart checkIns={athleteHistory} />
                </TwilightCard>
              </div>
              <div className="flex flex-col gap-2">
                {athleteHistory.map((checkin) => {
                  const duration = checkin.durationMinutes ? `${checkin.durationMinutes} دقیقه` : "–";
                  return (
                    <TwilightCard key={checkin.id} className="flex items-center justify-between !p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">تمرین</p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(checkin.checkInTime)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs tabular-nums text-muted-foreground">{duration}</span>
                        <Badge variant={checkin.sessionDeducted ? "success" : "secondary"}>
                          {checkin.sessionDeducted ? "انجام شده" : "ثبت شده"}
                        </Badge>
                      </div>
                    </TwilightCard>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <section className="flex flex-col gap-3" aria-live="polite">
        <SectionTitle>اشتراک</SectionTitle>
        {membershipsQuery.isLoading ? (
          <Loading message="در حال بارگذاری اشتراک..." />
        ) : membershipsQuery.isError ? (
          <ErrorDisplay message="اشتراک بارگذاری نشد" onRetry={() => void membershipsQuery.refetch()} />
        ) : !currentMembership ? (
          <EmptyState
            tone="blush"
            icon={<CreditCard className="h-5 w-5" strokeWidth={1.75} />}
            title="اشتراکی ثبت نشده"
            description="برای این شاگرد هنوز پلنی تخصیص داده نشده است"
          />
        ) : (
          <TwilightCard>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {currentMembership.plan?.name ?? "اشتراک"}
              </p>
              <Badge variant={membershipStatusConfig[currentMembership.status].variant}>
                {membershipStatusConfig[currentMembership.status].label}
              </Badge>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatDate(currentMembership.startDate)} — {formatDate(currentMembership.endDate)}
              {currentMembership.branch?.name ? ` · ${currentMembership.branch.name}` : ""}
            </p>
            {currentMembership.sessionsTotal > 0 ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>جلسات استفاده‌شده</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatPersianNumber(currentMembership.sessionsUsed)} از{" "}
                    {formatPersianNumber(currentMembership.sessionsTotal)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={calculateProgress(currentMembership.sessionsUsed, currentMembership.sessionsTotal)}
                    className="h-1.5"
                    indicatorClassName={`bg-none ${MEMBER_PROGRESS_FILL}`}
                  />
                  <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
                    {formatPersianNumber(currentMembership.sessionsRemaining)} جلسه باقی‌مانده
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">این پلن سهمیه جلسه ندارد.</p>
            )}
            <dl className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">مبلغ نهایی</dt>
                <dd className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
                  {formatCurrency(currentMembership.finalPrice)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">پایان اشتراک</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {formatDate(currentMembership.endDate)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              نمای فقط‌خواندنی؛ تغییر اشتراک از پنل پذیرش انجام می‌شود.
            </p>
          </TwilightCard>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-live="polite">
        <SectionTitle>پرداخت‌های اخیر</SectionTitle>
        {paymentsQuery.isLoading ? (
          <Loading message="در حال بارگذاری پرداخت‌ها..." />
        ) : paymentsQuery.isError ? (
          <ErrorDisplay message="پرداخت‌ها بارگذاری نشد" onRetry={() => void paymentsQuery.refetch()} />
        ) : recentPayments.length === 0 ? (
          <EmptyState
            tone="blush"
            icon={<CreditCard className="h-5 w-5" strokeWidth={1.75} />}
            title="پرداختی ثبت نشده"
            description="پرداخت‌های این شاگرد به‌محض ثبت اینجا دیده می‌شوند"
          />
        ) : (
          <TwilightCard className="divide-y divide-border p-0">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex min-h-11 items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium tabular-nums text-foreground">{formatCurrency(payment.amount)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {paymentMethodLabels[payment.method]} · {formatDate(payment.paidAt ?? payment.createdAt)}
                  </p>
                </div>
                <Badge variant={paymentStatusConfig[payment.status].variant}>
                  {paymentStatusConfig[payment.status].label}
                </Badge>
              </div>
            ))}
          </TwilightCard>
        )}
      </section>

      <GoalCreateSheet
        open={goalCreateOpen}
        onOpenChange={setGoalCreateOpen}
        pending={createGoal.isPending}
        onSubmit={handleCreateGoal}
      />

      <ConfirmDialog
        open={goalToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setGoalToDelete(null);
        }}
        title="حذف هدف"
        description={
          goalToDelete
            ? `«${goalToDelete.title}» برای همیشه حذف می‌شود. این کار بازگشت‌پذیر نیست.`
            : "این هدف حذف می‌شود."
        }
        confirmLabel="حذف هدف"
        onConfirm={() => void handleConfirmDeleteGoal()}
        loading={deleteGoal.isPending}
      />
    </PageShell>
  );
}

const goalCreateDecimal = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => /^\d+(\.\d+)?$/.test(value), message);

const goalCreateSchema = z
  .object({
    title: z.string().trim().min(3, "عنوان هدف را وارد کنید").max(80, "عنوان حداکثر ۸۰ کاراکتر است"),
    description: z.string().trim().max(400, "توضیحات حداکثر ۴۰۰ کاراکتر است"),
    category: z.enum(["weight_loss", "muscle_gain", "strength", "endurance", "flexibility", "custom"]),
    targetValue: goalCreateDecimal("مقدار هدف را با رقم وارد کنید"),
    currentValue: goalCreateDecimal("مقدار فعلی را با رقم وارد کنید"),
    unit: z.string().trim().min(1, "واحد را وارد کنید").max(16, "واحد حداکثر ۱۶ کاراکتر است"),
    targetDate: z.string().min(1, "تاریخ هدف را انتخاب کنید"),
  })
  .refine((values) => Number(values.targetValue) > 0, {
    message: "مقدار هدف باید بزرگ‌تر از صفر باشد",
    path: ["targetValue"],
  });

type GoalCreateValues = z.infer<typeof goalCreateSchema>;

const goalCategoryOptions = (
  Object.entries(goalCategoryLabels) as Array<[Goal["category"], string]>
).map(([value, label]) => ({ value, label }));

/**
 * Coach-side goal creator. The existing `GoalSheet` only edits an existing
 * goal, so this is its create-mode equivalent: same fields plus the category
 * picker, same `Sheet` chrome, same validation voice.
 */
function GoalCreateSheet({
  open,
  onOpenChange,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (patch: GoalCreatePatch) => void | Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GoalCreateValues>({
    resolver: zodResolver(goalCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "custom",
      targetValue: "",
      currentValue: "0",
      unit: "کیلوگرم",
      targetDate: shiftDateInput(todayDateInput(), 30),
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        title: "",
        description: "",
        category: "custom",
        targetValue: "",
        currentValue: "0",
        unit: "کیلوگرم",
        targetDate: shiftDateInput(todayDateInput(), 30),
      });
    }
  }, [open, reset]);

  const category = watch("category");
  const targetDate = watch("targetDate");

  const submit = handleSubmit((values) =>
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim() === "" ? undefined : values.description.trim(),
      category: values.category,
      targetValue: Number(values.targetValue),
      currentValue: Number(values.currentValue),
      unit: values.unit.trim(),
      targetDate: fromDateInputValue(values.targetDate),
    })
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="هدف تازه برای شاگرد"
      description="یک هدف قابل اندازه‌گیری برای این شاگرد ثبت کنید."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          id="goal-create-title"
          label="عنوان هدف"
          placeholder="رسیدن به وزن ۷۵ کیلوگرم"
          required
          error={errors.title?.message}
          disabled={pending}
          {...register("title")}
        />

        <SelectField
          id="goal-create-category"
          label="دسته‌بندی"
          required
          value={category}
          onValueChange={(value) =>
            setValue("category", value as Goal["category"], {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          options={goalCategoryOptions}
          error={errors.category?.message}
          disabled={pending}
        />

        <Textarea
          id="goal-create-description"
          label="توضیح"
          rows={3}
          placeholder="چرا این هدف برای شاگرد مهم است؟"
          error={errors.description?.message}
          disabled={pending}
          {...register("description")}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            id="goal-create-current"
            label="مقدار فعلی"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            dir="ltr"
            required
            error={errors.currentValue?.message}
            disabled={pending}
            {...register("currentValue")}
          />
          <Input
            id="goal-create-target"
            label="مقدار هدف"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            dir="ltr"
            required
            error={errors.targetValue?.message}
            disabled={pending}
            {...register("targetValue")}
          />
          <Input
            id="goal-create-unit"
            label="واحد"
            placeholder="کیلوگرم"
            required
            error={errors.unit?.message}
            disabled={pending}
            {...register("unit")}
          />
        </div>

        <Input
          id="goal-create-target-date"
          label="تاریخ هدف"
          type="date"
          required
          hint={targetDate ? jalaliLong(fromDateInputValue(targetDate)) : undefined}
          error={errors.targetDate?.message}
          disabled={pending}
          {...register("targetDate")}
        />

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            انصراف
          </Button>
          <Button type="submit" loading={pending}>
            ثبت هدف
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

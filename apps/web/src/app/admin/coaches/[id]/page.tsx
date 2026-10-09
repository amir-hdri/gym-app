"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, Mail, Calendar, ChevronRight, Edit, Trash2, Award, Plus, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Textarea";
import { formatPersianNumber, formatDate, getInitials } from "@/lib/utils";
import { apiErrorMessage } from "@/components/auth/auth-helpers";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import {
  useUser,
  useTrainingPrograms,
  useUsers,
  useCreateTrainingProgram,
} from "@/hooks/use-api";
import { PageShell, SectionTitle } from "@/components/twilight/Page";
import { StatCard, EmptyState } from "@/components/twilight/controls";
import { Field } from "../../_components/Field";
import { fullName } from "../../_components/admin-data";
import {
  addDaysToDateInput,
  jalaliHint,
  todayDateInput,
} from "../../_components/user-admin";
import type { TrainingProgram } from "@/lib/types";

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

const programStatusConfig: Record<TrainingProgram["status"], { label: string; variant: "success" | "secondary" | "info" | "outline" }> = {
  draft: { label: "پیش‌نویس", variant: "outline" },
  active: { label: "فعال", variant: "success" },
  completed: { label: "تمام‌شده", variant: "info" },
  archived: { label: "بایگانی", variant: "secondary" },
};

const assignProgramSchema = z
  .object({
    athleteId: z.string().min(1, "ورزشکار را انتخاب کنید"),
    name: z
      .string()
      .trim()
      .min(3, "عنوان برنامه را وارد کنید")
      .max(80, "عنوان حداکثر ۸۰ کاراکتر است"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ شروع را انتخاب کنید"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ پایان را انتخاب کنید"),
    frequencyPerWeek: z.string().min(1, "تعداد روزهای تمرین را انتخاب کنید"),
    description: z.string().trim().max(600, "توضیحات حداکثر ۶۰۰ کاراکتر است"),
  })
  // `YYYY-MM-DD` sorts lexicographically, so a string compare is a date compare.
  .refine((values) => values.endDate > values.startDate, {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
    path: ["endDate"],
  });

type AssignProgramFormData = z.infer<typeof assignProgramSchema>;

const FREQUENCY_OPTIONS = Array.from({ length: 7 }, (_, index) => ({
  value: String(index + 1),
  label: `${formatPersianNumber(index + 1)} روز در هفته`,
}));

/** ISO timestamp off a `YYYY-MM-DD` input value, read as a local calendar date. */
function toIsoDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function AssignProgramSheet({
  open,
  onOpenChange,
  coachId,
  coachName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  coachName: string;
}) {
  const athletes = useUsers("athlete");
  const createProgram = useCreateTrainingProgram();
  const [seed] = useState(() => {
    const start = todayDateInput();
    return { start, end: addDaysToDateInput(start, 27) };
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignProgramFormData>({
    resolver: zodResolver(assignProgramSchema),
    defaultValues: {
      athleteId: "",
      name: "",
      startDate: seed.start,
      endDate: seed.end,
      frequencyPerWeek: "3",
      description: "",
    },
  });

  const athleteId = watch("athleteId");
  const frequency = watch("frequencyPerWeek");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const options = useMemo(
    () =>
      (athletes.data?.data ?? []).map((athlete) => ({
        value: athlete.id,
        label: fullName(athlete) || athlete.email,
      })),
    [athletes.data]
  );

  const onSubmit = async (values: AssignProgramFormData) => {
    try {
      await createProgram.mutateAsync({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        athleteId: values.athleteId,
        coachId,
        startDate: toIsoDate(values.startDate),
        endDate: toIsoDate(values.endDate),
        frequencyPerWeek: Number(values.frequencyPerWeek),
        status: "draft",
      });
      const athleteLabel =
        options.find((option) => option.value === values.athleteId)?.label ?? "ورزشکار";
      toast.success(`برنامه برای ${athleteLabel} ثبت شد`);
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, "ساخت برنامه ناموفق بود"));
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="تخصیص برنامه تازه"
      description={`برنامه‌ای از ${coachName} برای یکی از ورزشکاران؛ به‌صورت پیش‌نویس ساخته می‌شود`}
    >
      {athletes.isError && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted p-3">
          <p role="alert" className="flex-1 text-xs leading-5 text-destructive">
            فهرست ورزشکاران بارگذاری نشد؛ بدون آن نمی‌توان برنامه ساخت.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={athletes.isFetching}
            onClick={() => void athletes.refetch()}
          >
            تلاش دوباره
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-2" noValidate>
        <Field
          label="ورزشکار"
          required
          error={errors.athleteId?.message}
          hint={
            athletes.isLoading
              ? "در حال بارگذاری فهرست ورزشکاران…"
              : options.length === 0
                ? "ورزشکاری ثبت نشده است؛ ابتدا یک عضو اضافه کنید."
                : "برنامه برای این ورزشکار ساخته می‌شود."
          }
        >
          {(control) => (
            <Select
              value={athleteId}
              onValueChange={(value) => setValue("athleteId", value, { shouldValidate: true })}
            >
              <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
                <SelectValue placeholder="انتخاب ورزشکار" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="min-h-11">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
        <Input
          id="assign-program-name"
          label="عنوان برنامه"
          placeholder="دوره قدرت — بلوک اول"
          required
          maxLength={80}
          error={errors.name?.message}
          {...register("name")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="assign-program-start"
            label="تاریخ شروع"
            type="date"
            dir="ltr"
            required
            error={errors.startDate?.message}
            hint={jalaliHint(startDate)}
            {...register("startDate")}
          />
          <Input
            id="assign-program-end"
            label="تاریخ پایان"
            type="date"
            dir="ltr"
            required
            error={errors.endDate?.message}
            hint={jalaliHint(endDate)}
            {...register("endDate")}
          />
        </div>
        <Field label="تکرار هفتگی" required error={errors.frequencyPerWeek?.message}>
          {(control) => (
            <Select value={frequency} onValueChange={(value) => setValue("frequencyPerWeek", value)}>
              <SelectTrigger {...control} className="h-12 min-h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="min-h-11">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
        <Textarea
          id="assign-program-description"
          label="توضیح برنامه"
          rows={3}
          placeholder="هدف این بلوک و نکته‌هایی که ورزشکار باید بداند."
          error={errors.description?.message}
          {...register("description")}
        />
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            انصراف
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={options.length === 0}>
            <Plus aria-hidden className="h-4 w-4" />
            ساخت برنامه
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

export default function CoachProfilePage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = useUser(params.id);
  const programsQuery = useTrainingPrograms();
  const usersQuery = useUsers("athlete");
  const [assigning, setAssigning] = useState(false);
  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const coach = data?.data as any;
  if (!coach) return <ErrorDisplay message="مربی یافت نشد" />;

  const coachName = `${coach.firstName} ${coach.lastName}`;
  const myPrograms = (programsQuery.data?.data ?? []).filter(
    (program) => program.coachId === params.id
  );
  // The user row carries no student count — distinct coached athletes.
  const studentCount = new Set(myPrograms.map((program) => program.athleteId)).size;
  const athleteById = new Map((usersQuery.data?.data ?? []).map((u) => [u.id, u] as const));

  return (
    <PageShell>
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/coaches"><ChevronRight className="h-4 w-4" strokeWidth={1.75} /> بازگشت به مربیان</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-gradient-to-br from-secondary to-card">
          <span className="font-serif text-2xl text-primary">
            {getInitials(`${coach.firstName} ${coach.lastName}`)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-foreground">{coach.firstName} {coach.lastName}</h1>
            <Badge variant={statusMap[coach.status].variant}>{statusMap[coach.status].label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Edit className="h-4 w-4" strokeWidth={1.75} /> ویرایش</Button>
          <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" strokeWidth={1.75} /></Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        <InfoRow icon={<Phone className="h-4 w-4" strokeWidth={1.75} />} label="تلفن" value={coach.phone} ltr />
        <InfoRow icon={<Mail className="h-4 w-4" strokeWidth={1.75} />} label="ایمیل" value={coach.email} ltr />
        <InfoRow icon={<Award className="h-4 w-4" strokeWidth={1.75} />} label="شعبه" value={coach.branchName ?? "—"} />
        <InfoRow icon={<Calendar className="h-4 w-4" strokeWidth={1.75} />} label="عضویت از" value={formatDate(coach.createdAt)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="تعداد شاگردان" value={formatPersianNumber(studentCount)} />
        <StatCard
          label="برنامه‌های فعال"
          value={formatPersianNumber(myPrograms.filter((p) => p.status === "active").length)}
        />
      </div>

      <div>
        <SectionTitle className="mb-3">لیست شاگردان</SectionTitle>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr>
                <th scope="col" className={thClass}>نام</th>
                <th scope="col" className={thClass}>طرح اشتراک</th>
                <th scope="col" className={thClass}>پیشرفت</th>
              </tr>
            </thead>
            <tbody>
              {myPrograms.map((program) => {
                const athlete = athleteById.get(program.athleteId);
                if (!athlete) return null;
                const done = program.exercises.filter((e) => e.isCompleted).length;
                const total = program.exercises.length || 1;
                const progress = Math.round((done / total) * 100);
                return (
                  <tr key={program.id} className="border-t border-border hover:bg-secondary">
                    <td className={`${tdClass} font-medium text-foreground`}>{athlete.firstName} {athlete.lastName}</td>
                    <td className={tdClass}>{program.name}</td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-sm">{formatPersianNumber(progress)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <SectionTitle
          className="mb-3"
          action={
            <Button size="sm" onClick={() => setAssigning(true)}>
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              تخصیص برنامه
            </Button>
          }
        >
          برنامه‌های تمرینی
        </SectionTitle>
        {programsQuery.isLoading ? (
          <Loading message="در حال بارگذاری برنامه‌ها..." />
        ) : programsQuery.isError ? (
          <ErrorDisplay message="برنامه‌ها بارگذاری نشد" onRetry={() => void programsQuery.refetch()} />
        ) : myPrograms.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-5 w-5" strokeWidth={1.75} />}
            title="برنامه‌ای ثبت نشده"
            description="نخستین برنامه این مربی را برای یک ورزشکار بسازید"
            action={
              <Button size="sm" onClick={() => setAssigning(true)}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                تخصیص برنامه
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr>
                  <th scope="col" className={thClass}>نام برنامه</th>
                  <th scope="col" className={thClass}>ورزشکار</th>
                  <th scope="col" className={thClass}>بازه</th>
                  <th scope="col" className={thClass}>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {myPrograms.map((program) => {
                  const status = programStatusConfig[program.status];
                  const athlete = program.athlete ?? athleteById.get(program.athleteId);
                  return (
                    <tr key={program.id} className="border-t border-border hover:bg-muted/40">
                      <td className={`${tdClass} font-medium text-foreground`}>
                        <Link
                          href={`/coach/programs/${program.id}`}
                          className="rounded-md hover:underline"
                        >
                          {program.name}
                        </Link>
                      </td>
                      <td className={tdClass}>
                        {athlete ? fullName(athlete) || athlete.email : program.athleteId}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {formatDate(program.startDate)} — {formatDate(program.endDate)}
                      </td>
                      <td className={tdClass}>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssignProgramSheet
        open={assigning}
        onOpenChange={setAssigning}
        coachId={params.id}
        coachName={coachName}
      />
    </PageShell>
  );
}

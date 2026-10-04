"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ChevronRight, Plus, Save, CheckCircle, Dumbbell, Pencil } from "lucide-react";
import Link from "next/link";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { StatCard, TwilightCard } from "@/components/twilight/controls";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatPersianNumber, formatDate } from "@/lib/utils";
import { useTrainingProgram, useExercises } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";

const persianDays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

const statusConfig: Record<string, { label: string; variant: "secondary" | "success" | "info" | "outline" }> = {
  draft: { label: "پیش‌نویس", variant: "secondary" as const },
  active: { label: "فعال", variant: "success" as const },
  completed: { label: "تکمیل شده", variant: "info" as const },
};

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: programResp, isLoading, isError, error } = useTrainingProgram(params.id);
  const { data: exercisesResp } = useExercises();
  const [activeDay, setActiveDay] = React.useState(0);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newExercise, setNewExercise] = React.useState({ name: "", sets: "", reps: "", weight: "", rest: "" });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const program = programResp?.data;
  if (!program) return null;

  const exerciseOptions = exercisesResp?.data?.map((ex) => ex.name) || [];

  const groupedDays = (program.exercises || []).reduce<Record<number, typeof program.exercises>>((acc, ex) => {
    if (!acc[ex.dayOfWeek]) acc[ex.dayOfWeek] = [];
    acc[ex.dayOfWeek].push(ex);
    return acc;
  }, {});

  const days = Object.entries(groupedDays).map(([dayNum, exercises]) => ({
    day: persianDays[Number(dayNum)] || `روز ${Number(dayNum) + 1}`,
    exercises: exercises.map((ex) => ({
      name: ex.exercise?.name || "بدون نام",
      sets: ex.sets,
      reps: Number(ex.reps) || 0,
      weight: ex.weight || 0,
      rest: `${ex.restSeconds} ثانیه`,
    })),
  }));

  const athleteName = program.athlete ? `${program.athlete.firstName} ${program.athlete.lastName}` : program.athleteId || "نامشخص";
  const frequencyLabel = `${program.frequencyPerWeek} روز در هفته`;

  function handleAddExercise() {
    setNewExercise({ name: "", sets: "", reps: "", weight: "", rest: "" });
    setShowAddForm(false);
  }

  return (
    <PageShell>
      <PageHeader
        title={program.name}
        subtitle={athleteName}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Pencil className="h-4 w-4" />
              ویرایش
            </Button>
            {program.status === "draft" && (
              <Button variant="success" size="sm">
                <CheckCircle className="h-4 w-4" />
                فعال‌سازی
              </Button>
            )}
            {program.status === "active" && (
              <Button variant="default" size="sm">
                <Save className="h-4 w-4" />
                ذخیره
              </Button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <Badge variant={statusConfig[program.status]?.variant || "outline"}>
          {statusConfig[program.status]?.label || program.status}
        </Badge>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/coach/programs">
            <ChevronRight className="h-4 w-4" />
            بازگشت به برنامه‌ها
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="ورزشکار" value={<span className="text-lg">{athleteName}</span>} />
        <StatCard label="تاریخ شروع" value={<span className="text-lg">{formatDate(program.startDate)}</span>} />
        <StatCard label="تاریخ پایان" value={<span className="text-lg">{formatDate(program.endDate)}</span>} />
        <StatCard label="تعداد جلسات" value={<span className="text-lg">{frequencyLabel}</span>} />
      </div>

      <Tabs value={String(activeDay)} onValueChange={(v) => setActiveDay(Number(v))} dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl border border-[#232934] bg-[#161a22] p-1">
          {days.map((day, i) => (
            <TabsTrigger key={i} value={String(i)} className="rounded-lg data-[state=active]:bg-[#d2c0a5] data-[state=active]:text-[#121417] data-[state=active]:shadow-none">{day.day}</TabsTrigger>
          ))}
        </TabsList>

        {days.map((day, i) => (
          <TabsContent key={i} value={String(i)} className="mt-4 space-y-4">
            <TwilightCard className="!p-0">
              <div className="flex items-center justify-between px-4 py-3.5">
                <h3 className="font-serif text-lg font-normal text-white">{day.day}</h3>
                <Button variant="ghost" size="sm" onClick={() => { setActiveDay(i); setShowAddForm(true); }}>
                  <Plus className="h-4 w-4" />
                  افزودن تمرین
                </Button>
              </div>
              <div className="divide-y divide-[#1e2430] border-t border-[#1e2430]">
                {day.exercises.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-[#8e98a8]">هیچ تمرینی برای این روز ثبت نشده است</p>
                ) : (
                  day.exercises.map((ex, j) => (
                    <div key={j} className="flex items-center gap-4 px-4 py-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2c3444] bg-[#202632] text-[#d2c0a5]">
                        <Dumbbell className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{ex.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#8e98a8]">
                          {formatPersianNumber(ex.sets)} ست × {formatPersianNumber(ex.reps)} تکرار
                          {ex.weight > 0 && ` | ${formatPersianNumber(ex.weight)} کیلوگرم`}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        استراحت: {ex.rest}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </TwilightCard>

            {showAddForm && activeDay === i && (
              <TwilightCard className="!p-5">
                <h3 className="mb-4 font-serif text-lg font-normal text-white">افزودن تمرین جدید</h3>
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="space-y-1.5">
                    <Label className="mb-1.5 block text-sm font-medium">نام تمرین</Label>
                    <Select
                      value={newExercise.name}
                      onValueChange={(v) => setNewExercise((prev) => ({ ...prev, name: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {exerciseOptions.map((ex) => (
                          <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      label="ست"
                      type="number"
                      value={newExercise.sets}
                      onChange={(e) => setNewExercise((prev) => ({ ...prev, sets: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Input
                      label="تکرار"
                      type="number"
                      value={newExercise.reps}
                      onChange={(e) => setNewExercise((prev) => ({ ...prev, reps: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Input
                      label="وزن (کیلوگرم)"
                      type="number"
                      value={newExercise.weight}
                      onChange={(e) => setNewExercise((prev) => ({ ...prev, weight: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Input
                      label="استراحت"
                      value={newExercise.rest}
                      placeholder="مثلاً ۶۰ ثانیه"
                      onChange={(e) => setNewExercise((prev) => ({ ...prev, rest: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button onClick={handleAddExercise} disabled={!newExercise.name}>
                    <Plus className="h-4 w-4" />
                    افزودن
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                    انصراف
                  </Button>
                </div>
              </TwilightCard>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}

"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ChevronRight, Plus, Save, CheckCircle, Dumbbell, Pencil } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/coach/programs">
              <ChevronRight className="h-4 w-4" />
              بازگشت به برنامه‌ها
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
            <Badge variant={statusConfig[program.status]?.variant || "outline"}>
              {statusConfig[program.status]?.label || program.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Pencil className="h-4 w-4" />
            ویرایش
          </Button>
          {program.status === "draft" && (
            <Button variant="success">
              <CheckCircle className="h-4 w-4" />
              فعال‌سازی
            </Button>
          )}
          {program.status === "active" && (
            <Button variant="default">
              <Save className="h-4 w-4" />
              ذخیره
            </Button>
          )}
        </div>
      </div>

      <StaggerContainer className="grid gap-4 md:grid-cols-4">
        <StaggerItem>
          <Card glass>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">ورزشکار</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{athleteName}</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card glass>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">تاریخ شروع</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{formatDate(program.startDate)}</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card glass>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">تاریخ پایان</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{formatDate(program.endDate)}</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card glass>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">تعداد جلسات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{frequencyLabel}</p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      <Tabs value={String(activeDay)} onValueChange={(v) => setActiveDay(Number(v))} dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto">
          {days.map((day, i) => (
            <TabsTrigger key={i} value={String(i)}>{day.day}</TabsTrigger>
          ))}
        </TabsList>

        {days.map((day, i) => (
          <TabsContent key={i} value={String(i)} className="space-y-4">
            <Card glass>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{day.day}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => { setActiveDay(i); setShowAddForm(true); }}>
                  <Plus className="h-4 w-4" />
                  افزودن تمرین
                </Button>
              </CardHeader>
              <CardContent>
                {day.exercises.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">هیچ تمرینی برای این روز ثبت نشده است</p>
                ) : (
                  <StaggerContainer className="divide-y">
                    {day.exercises.map((ex, j) => (
                      <StaggerItem key={j}>
                        <div className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Dumbbell className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{ex.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPersianNumber(ex.sets)} ست × {formatPersianNumber(ex.reps)} تکرار
                              {ex.weight > 0 && ` | ${formatPersianNumber(ex.weight)} کیلوگرم`}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            استراحت: {ex.rest}
                          </Badge>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </CardContent>
            </Card>

            {showAddForm && activeDay === i && (
              <FadeIn>
                <Card glass>
                <CardHeader>
                  <CardTitle className="text-lg">افزودن تمرین جدید</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">نام تمرین</label>
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
                </CardContent>
              </Card>
            </FadeIn>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

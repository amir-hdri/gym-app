"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { formatPersianNumber, formatDate, calculateProgress, cn } from "@/lib/utils";
import { useTrainingProgram } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { PageShell, PageHeader, SectionTitle, MicroLabelFa } from "@/components/twilight/Page";
import { TwilightCard, FilterChips, CtaButton } from "@/components/twilight/controls";
import { GymWorkoutPlayerModal } from "@/components/twilight/GymWorkoutPlayerModal";
import { toast } from "sonner";

const dayNames = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"] as const;
type DayName = (typeof dayNames)[number];

export default function ProgramDetailPage() {
  const params = useParams();
  const { data, isLoading, isError, error, refetch } = useTrainingProgram(params.id as string);
  const [completedExercises, setCompletedExercises] = useState<Record<string, number[]>>({});
  const [activeDay, setActiveDay] = useState<DayName>(dayNames[0]);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const program = data?.data;

  const weeklyProgram = useMemo(() => {
    if (!program?.exercises) return [];
    const grouped: Record<number, typeof program.exercises> = {};
    program.exercises.forEach((ex) => {
      const day = ex.dayOfWeek;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(ex);
    });
    return dayNames.map((day, idx) => ({
      day,
      exercises: grouped[idx] || [],
    }));
  }, [program]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} onRetry={refetch} />;
  if (!program) return <ErrorDisplay message="برنامه یافت نشد" />;

  const toggleExercise = (day: string, exerciseId: number) => {
    setCompletedExercises((prev) => {
      const dayExercises = prev[day] || [];
      return {
        ...prev,
        [day]: dayExercises.includes(exerciseId)
          ? dayExercises.filter((id) => id !== exerciseId)
          : [...dayExercises, exerciseId],
      };
    });
  };

  const totalExercises = weeklyProgram.reduce((sum, day) => sum + day.exercises.length, 0);
  const totalCompleted = Object.values(completedExercises).reduce((sum, arr) => sum + arr.length, 0);
  const overallProgress = calculateProgress(totalCompleted, totalExercises);

  const activeDayData = weeklyProgram.find((d) => d.day === activeDay) || weeklyProgram[0];
  const activeDayCompleted = (completedExercises[activeDayData?.day || ""] || []).length;

  const playerRoutine = {
    id: program.id,
    name: `${program.name} - ${activeDayData?.day || ""}`,
    exercises: (activeDayData?.exercises || []).map((e, idx) => ({
      id: String(e.id || idx),
      name: e.exercise?.name || `حرکت ${idx + 1}`,
      nameFa: e.exercise?.name,
      targetMuscle: e.exercise?.muscleGroup || "عضلات هدف",
      sets: e.sets || 3,
      reps: e.reps || "10-12",
      restSecs: e.restSeconds || 60,
      tips: e.exercise?.tips || "تمرکز روی فرم صحیح و اضافه بار تدریجی",
    })),
  };

  return (
    <PageShell>
      <Button variant="ghost" size="sm" asChild className="self-start">
        <Link href="/athlete/programs">
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} /> بازگشت به برنامه‌ها
        </Link>
      </Button>

      <PageHeader
        title={program.name}
        subtitle={`${program.coach?.firstName || ""} ${program.coach?.lastName || ""} | ${formatDate(program.startDate)} - ${formatDate(program.endDate)} | ${formatPersianNumber(program.frequencyPerWeek)} روز در هفته`}
        action={
          <span className="rounded-full border border-[#2b313d] bg-[#181c22] px-3 py-1.5 text-[11px] text-[#e5d9c5]">
            {formatPersianNumber(Math.round(overallProgress))}٪ تکمیل
          </span>
        }
      />

      <TwilightCard>
        <div className="mb-3 flex items-center justify-between">
          <MicroLabelFa>پیشرفت کلی برنامه</MicroLabelFa>
          <span className="font-sans text-sm font-medium tabular-nums text-white">
            {formatPersianNumber(Math.round(overallProgress))}٪
          </span>
        </div>
        <Progress
          value={overallProgress}
          className="bg-white/10"
          indicatorClassName="bg-[#d2c0a5] shadow-none"
        />
      </TwilightCard>

      <FilterChips
        pillId="athlete-program-days"
        options={dayNames}
        value={activeDay}
        onChange={setActiveDay}
        labels={Object.fromEntries(dayNames.map((d) => [d, d])) as Record<DayName, string>}
      />

      {activeDayData && (
        <TwilightCard className="p-0">
          <div className="flex items-center justify-between px-4 pt-4">
            <div>
              <SectionTitle>تمرینات {activeDayData.day}</SectionTitle>
              <span className="text-[11px] text-[#8e98a8]">
                {formatPersianNumber(activeDayCompleted)}/{formatPersianNumber(activeDayData.exercises.length)} حرکت تکمیل شده
              </span>
            </div>
            {activeDayData.exercises.length > 0 && (
              <CtaButton
                variant="cream"
                onClick={() => setIsPlayerOpen(true)}
                className="w-auto px-4 py-2 text-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[#121417]" />
                <span>شروع تمرین این روز</span>
              </CtaButton>
            )}
          </div>
          <div className="flex flex-col gap-2.5 p-4">
            {activeDayData.exercises.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#8e98a8]">روز استراحت و ریکاوری عضلات</p>
            ) : (
              activeDayData.exercises.map((exercise, idx) => {
                const isCompleted = (completedExercises[activeDayData.day] || []).includes(idx);
                return (
                  <div
                    key={exercise.id || idx}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border border-[#232934] bg-[#161a22] p-4 transition-colors",
                      isCompleted && "opacity-50"
                    )}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleExercise(activeDayData.day, idx)}
                    />
                    <div className={cn("flex-1", isCompleted && "line-through text-[#8e98a8]")}>
                      <p className="text-sm font-medium text-white">{exercise.exercise?.name || exercise.exerciseId}</p>
                      <p className="mt-0.5 text-[11px] text-[#8e98a8]">
                        {formatPersianNumber(exercise.sets)} × {exercise.reps}
                        {exercise.weight ? ` - ${formatPersianNumber(exercise.weight)} کیلوگرم` : ""}
                        {" - "}
                        {formatPersianNumber(exercise.restSeconds)} ثانیه استراحت
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TwilightCard>
      )}

      {/* Interactive Workout Modal */}
      <GymWorkoutPlayerModal
        isOpen={isPlayerOpen}
        routine={playerRoutine}
        onClose={() => setIsPlayerOpen(false)}
        onFinishWorkout={() => {
          toast.success("تمرین این روز با موفقیت ثبت شد!");
        }}
      />
    </PageShell>
  );
}

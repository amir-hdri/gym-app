"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Checkbox } from "@/components/ui/Checkbox";
import { Progress } from "@/components/ui/Progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { formatPersianNumber, formatDate, calculateProgress, cn } from "@/lib/utils";
import { useTrainingProgram } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";

const dayNames = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

export default function ProgramDetailPage() {
  const params = useParams();
  const { data, isLoading, isError, error } = useTrainingProgram(params.id as string);
  const [completedExercises, setCompletedExercises] = useState<Record<string, number[]>>({});

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
  if (isError) return <ErrorDisplay message={error?.message} />;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
        <p className="mt-1 text-muted-foreground">
          مربی: {program.coach?.firstName || ""} {program.coach?.lastName || ""} | {formatDate(program.startDate)} - {formatDate(program.endDate)} | {formatPersianNumber(program.frequencyPerWeek)} روز در هفته
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border bg-white/30 backdrop-blur-sm p-4">
        <Progress value={overallProgress} className="flex-1" />
        <span className="text-sm font-medium">{formatPersianNumber(Math.round(overallProgress))}%</span>
      </div>

      <Tabs defaultValue={dayNames[0]} dir="rtl">
        <TabsList className="w-full flex-wrap bg-white/40 backdrop-blur-xl border border-white/30">
          {dayNames.map((day) => (
            <TabsTrigger key={day} value={day} className="flex-1">
              {day}
            </TabsTrigger>
          ))}
        </TabsList>
        {weeklyProgram.map((dayData) => (
          <TabsContent key={dayData.day} value={dayData.day}>
            <Card glass>
              <CardHeader>
                <CardTitle>تمرینات {dayData.day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayData.exercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">روز استراحت</p>
                ) : (
                  dayData.exercises.map((exercise, idx) => {
                    const isCompleted = (completedExercises[dayData.day] || []).includes(idx);
                    return (
                      <div
                        key={exercise.id || idx}
                        className={cn(
                          "flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 hover:shadow-sm transition-all duration-200",
                          isCompleted ? "opacity-50" : "bg-white/30 backdrop-blur-sm"
                        )}
                      >
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleExercise(dayData.day, idx)}
                        />
                        <div className={`flex-1 ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          <p className="font-medium">{exercise.exercise?.name || exercise.exerciseId}</p>
                          <p className="text-sm text-muted-foreground">
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
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

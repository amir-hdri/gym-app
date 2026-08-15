"use client";

import * as React from "react";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Dumbbell, Clock, BarChart3, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FadeIn } from "@/components/animations/FadeIn";
import { formatPersianNumber } from "@/lib/utils";
import { toast } from "sonner";
import { useExercise } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";

const diffColors: Record<string, "default" | "secondary" | "destructive"> = {
  beginner: "default",
  intermediate: "secondary",
  advanced: "destructive",
};

const diffLabels: Record<string, string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

const defaultSets = 3;
const defaultReps = 10;
const defaultWeight = 30;
const defaultRest = 60;

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useExercise(params.id);
  const ex = data?.data;
  const [weight, setWeight] = useState(String(ex?.name ? defaultWeight : 0));
  const [reps, setReps] = useState(String(ex?.name ? defaultReps : 0));
  const [logged, setLogged] = useState(false);

  const handleLog = () => {
    toast.success("ست ثبت شد");
    setLogged(true);
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;
  if (!ex) return <ErrorDisplay message="تمرین یافت نشد" />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link href="/athlete"><ChevronRight className="h-4 w-4" /> بازگشت به برنامه امروز</Link>
      </Button>

      <FadeIn>
        <Card glass>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Dumbbell className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{ex.name}</h1>
                  <Badge variant={diffColors[ex.difficulty] || "default"}>{diffLabels[ex.difficulty] || ex.difficulty}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" />عضله: {ex.muscleGroup}</span>
                  <span className="flex items-center gap-1"><Dumbbell className="h-4 w-4" />وسیله: {ex.equipment || "بدون وسیله"}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />استراحت: {formatPersianNumber(defaultRest)} ثانیه</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card glass>
          <CardHeader><CardTitle>نحوه اجرا</CardTitle></CardHeader>
          <CardContent>
            <p className="leading-relaxed text-muted-foreground">{ex.description || ex.instructions || "توضیحاتی ثبت نشده است"}</p>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card glass>
          <CardHeader><CardTitle>نکات مهم</CardTitle></CardHeader>
          <CardContent>
            <p className="leading-relaxed text-muted-foreground">{ex.tips || "نکته خاصی ثبت نشده است"}</p>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card glass>
          <CardHeader><CardTitle>ثبت ست</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>تعداد ست</Label>
                <p className="text-lg font-semibold">{formatPersianNumber(defaultSets)}</p>
              </div>
              <div className="space-y-1.5">
                <Label>تکرار</Label>
                <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="bg-white/70 backdrop-blur-sm border-white/30" />
              </div>
              <div className="space-y-1.5">
                <Label>وزن (کیلوگرم)</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-white/70 backdrop-blur-sm border-white/30" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleLog} disabled={logged}>
                {logged ? <><CheckCircle2 className="ml-2 h-4 w-4" />ثبت شد</> : "ثبت ست"}
              </Button>
              {logged && (
                <Button variant="outline" onClick={() => setLogged(false)}>ثبت مجدد</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

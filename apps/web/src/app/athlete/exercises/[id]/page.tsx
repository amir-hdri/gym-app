"use client";

import * as React from "react";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Dumbbell, Clock, BarChart3, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { formatPersianNumber } from "@/lib/utils";
import { toast } from "sonner";
import { useExercise } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { PageShell, SectionTitle } from "@/components/twilight/Page";
import { TwilightCard, CtaButton } from "@/components/twilight/controls";

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
    <PageShell>
      <Button variant="ghost" size="sm" asChild className="self-start">
        <Link href="/athlete">
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} /> بازگشت به برنامه امروز
        </Link>
      </Button>

      <TwilightCard className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#2c3444] bg-[#202632] text-[#d2c0a5]">
            <Dumbbell className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-2xl font-normal text-white">{ex.name}</h1>
              <Badge variant={diffColors[ex.difficulty] || "default"} className="bg-primary">
                {diffLabels[ex.difficulty] || ex.difficulty}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#8e98a8]">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-[#d2c0a5]" strokeWidth={1.75} />
                عضله: {ex.muscleGroup}
              </span>
              <span className="flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-[#d2c0a5]" strokeWidth={1.75} />
                وسیله: {ex.equipment || "بدون وسیله"}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#d2c0a5]" strokeWidth={1.75} />
                استراحت: {formatPersianNumber(defaultRest)} ثانیه
              </span>
            </div>
          </div>
        </div>
      </TwilightCard>

      <section className="flex flex-col gap-3">
        <SectionTitle>نحوه اجرا</SectionTitle>
        <TwilightCard>
          <p className="text-sm leading-relaxed text-[#c3ccd8]">
            {ex.description || ex.instructions || "توضیحاتی ثبت نشده است"}
          </p>
        </TwilightCard>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>نکات مهم</SectionTitle>
        <TwilightCard>
          <p className="text-sm leading-relaxed text-[#c3ccd8]">
            {ex.tips || "نکته خاصی ثبت نشده است"}
          </p>
        </TwilightCard>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>ثبت ست</SectionTitle>
        <TwilightCard>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>تعداد ست</Label>
              <p className="pt-2 font-sans text-lg font-semibold tabular-nums text-white">
                {formatPersianNumber(defaultSets)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>تکرار</Label>
              <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>وزن (کیلوگرم)</Label>
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <CtaButton onClick={handleLog} disabled={logged} className="w-auto px-8">
              {logged ? (
                <>
                  <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                  ثبت شد
                </>
              ) : (
                "ثبت ست"
              )}
            </CtaButton>
            {logged && (
              <CtaButton variant="ghost" onClick={() => setLogged(false)} className="w-auto px-6">
                ثبت مجدد
              </CtaButton>
            )}
          </div>
        </TwilightCard>
      </section>
    </PageShell>
  );
}

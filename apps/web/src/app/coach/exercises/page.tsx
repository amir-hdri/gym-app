"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { formatPersianNumber, cn } from "@/lib/utils";
import { SearchInput, FilterChips, EmptyState } from "@/components/twilight/controls";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { Plus, Dumbbell, Pencil, Trash2 } from "lucide-react";
import { useExercises } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";

const muscles = ["همه", "سینه", "پشت", "پاها", "بازو", "شکم", "سرشانه"];
const difficulties = ["همه", "مبتدی", "متوسط", "پیشرفته"];

const chipLabels = (opts: string[]): Record<string, string> =>
  Object.fromEntries(opts.map((o) => [o, o]));

export default function ExerciseLibraryPage() {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("همه");
  const [difficultyFilter, setDifficultyFilter] = useState("همه");
  const { data, isLoading, isError, error, refetch } = useExercises();

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} onRetry={refetch} />;

  const exercisesData = data?.data || [];

  const filtered = exercisesData.filter((ex) => {
    const matchSearch = ex.name.includes(search);
    const matchMuscle = muscleFilter === "همه" || ex.muscleGroup === muscleFilter;
    const matchDifficulty = difficultyFilter === "همه" || ex.difficulty === difficultyFilter;
    return matchSearch && matchMuscle && matchDifficulty;
  });

  const difficultyColor: Record<string, "default" | "secondary" | "destructive" | "info"> = {
    beginner: "default", intermediate: "secondary", advanced: "destructive",
    مبتدی: "default", متوسط: "secondary", پیشرفته: "destructive",
  };

  return (
    <PageShell>
      <PageHeader
        title="کتابخانه تمرینات"
        subtitle="مدیریت حرکات ورزشی"
        action={
          <Button variant="default" asChild className="w-auto">
            <Link href="/coach/exercises/new">
              <Plus className="ml-2 h-4 w-4" />
              افزودن حرکت جدید
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="جستجوی حرکت..." />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-16 shrink-0 text-[11px] font-semibold text-muted-foreground">عضله هدف</span>
          <FilterChips
            pillId="coach-exercises-muscle"
            options={muscles}
            value={muscleFilter}
            onChange={setMuscleFilter}
            labels={chipLabels(muscles)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-16 shrink-0 text-[11px] font-semibold text-muted-foreground">سطح</span>
          <FilterChips
            pillId="coach-exercises-difficulty"
            options={difficulties}
            value={difficultyFilter}
            onChange={setDifficultyFilter}
            labels={chipLabels(difficulties)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="w-12 text-[11px] font-semibold text-muted-foreground">ردیف</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground">نام حرکت</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground">عضله هدف</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground">وسیله</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground">سطح</TableHead>
              <TableHead className="w-28 text-[11px] font-semibold text-muted-foreground">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ex, idx) => (
              <TableRow key={ex.id} className={cn("border-t border-border hover:bg-secondary")}>
                <TableCell className="tabular-nums text-foreground">{formatPersianNumber(idx + 1)}</TableCell>
                <TableCell className="font-medium text-foreground">{ex.name}</TableCell>
                <TableCell><Badge variant="outline">{ex.muscleGroup}</Badge></TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-foreground">
                    <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                    {ex.equipment || "–"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={difficultyColor[ex.difficulty] || difficultyColor["متوسط"]}>
                    {ex.difficulty}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                      ویرایش
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="border-t border-border p-6">
            <EmptyState
              tone="blush"
              title="هیچ حرکتی یافت نشد"
              description="حرکتی با فیلترهای انتخاب شده وجود ندارد"
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}

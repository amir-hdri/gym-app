"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { formatPersianNumber } from "@/lib/utils";
import { Search, Plus, Dumbbell, Filter } from "lucide-react";
import { useExercises } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";

const muscles = ["همه", "سینه", "پشت", "پاها", "بازو", "شکم", "سرشانه"];
const difficulties = ["همه", "مبتدی", "متوسط", "پیشرفته"];

export default function ExerciseLibraryPage() {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("همه");
  const [difficultyFilter, setDifficultyFilter] = useState("همه");
  const { data, isLoading, isError, error } = useExercises();

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

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
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-8">کتابخانه تمرینات</h1>
          <p className="mt-1 text-muted-foreground leading-6">مدیریت حرکات ورزشی</p>
        </div>
        <Button asChild className="w-full sm:w-auto"><Link href="/coach/exercises/new"><Plus className="ml-2 h-4 w-4" />افزودن حرکت جدید</Link></Button>
      </div>

      <Card glass>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="جستجوی حرکت..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 bg-white/70 backdrop-blur-sm border-white/30" />
            </div>
            <Select value={muscleFilter} onValueChange={setMuscleFilter}>
              <SelectTrigger className="w-36 bg-white/70 backdrop-blur-sm border-white/30">
                <Filter className="h-4 w-4" /><SelectValue />
              </SelectTrigger>
              <SelectContent>{muscles.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-36 bg-white/70 backdrop-blur-sm border-white/30">
                <Filter className="h-4 w-4" /><SelectValue />
              </SelectTrigger>
              <SelectContent>{difficulties.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ردیف</TableHead>
                <TableHead>نام حرکت</TableHead>
                <TableHead>عضله هدف</TableHead>
                <TableHead>وسیله</TableHead>
                <TableHead>سطح</TableHead>
                <TableHead className="w-28">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState title="هیچ حرکتی یافت نشد" description="حرکتی با فیلترهای انتخاب شده وجود ندارد" />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ex, idx) => (
                <TableRow key={ex.id} className="transition-colors hover:bg-white/30">
                  <TableCell>{formatPersianNumber(idx + 1)}</TableCell>
                  <TableCell className="font-medium">{ex.name}</TableCell>
                  <TableCell><Badge variant="outline" className="bg-white/40">{ex.muscleGroup}</Badge></TableCell>
                  <TableCell><span className="flex items-center gap-1"><Dumbbell className="h-3.5 w-3.5" />{ex.equipment || "–"}</span></TableCell>
                  <TableCell><Badge variant={difficultyColor[ex.difficulty] || difficultyColor["متوسط"]}>{ex.difficulty}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">ویرایش</Button>
                      <Button variant="destructive" size="sm">حذف</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

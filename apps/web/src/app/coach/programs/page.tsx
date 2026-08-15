"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Eye, Pencil } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { formatPersianNumber, formatDate, cn } from "@/lib/utils";
import { useTrainingPrograms } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";

const statusConfig: Record<string, { label: string; variant: "secondary" | "success" | "info" | "outline" | "destructive" | "default" | "warning" }> = {
  draft: { label: "پیش‌نویس", variant: "secondary" as const },
  active: { label: "فعال", variant: "success" as const },
  completed: { label: "تکمیل شده", variant: "info" as const },
  archived: { label: "بایگانی", variant: "outline" as const },
};

export default function ProgramsPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const { data, isLoading, isError, error } = useTrainingPrograms();

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const programsData = data?.data || [];

  const filtered = programsData.filter(
    (p) => statusFilter === "all" || p.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-10">برنامه‌های تمرینی</h1>
          <p className="mt-1 text-muted-foreground leading-6">مدیریت برنامه‌های تمرینی شاگردان</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/coach/programs/new">
            <Plus className="h-4 w-4" />
            برنامه جدید
          </Link>
        </Button>
      </div>

      <FadeIn>
        <Card glass className="p-4">
          <div className="flex flex-wrap gap-2">
            {["all", "active", "draft", "completed", "archived"].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "همه" : statusConfig[s as keyof typeof statusConfig]?.label || s}
              </Button>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card glass>
          <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام برنامه</TableHead>
                <TableHead>ورزشکار</TableHead>
                <TableHead>تاریخ شروع</TableHead>
                <TableHead>تاریخ پایان</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تمرینات</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState title="هیچ برنامه‌ای یافت نشد" description="برنامه‌ای با فیلتر انتخاب شده وجود ندارد" />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((program) => (
                <TableRow key={program.id} className={cn()}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>{program.athlete ? `${program.athlete.firstName} ${program.athlete.lastName}` : "–"}</TableCell>
                  <TableCell>{formatDate(program.startDate)}</TableCell>
                  <TableCell>{formatDate(program.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[program.status]?.variant || "outline"}>
                      {statusConfig[program.status]?.label || program.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPersianNumber(program.exercises.length)} تمرین</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/coach/programs/${program.id}`}>
                          <Eye className="h-4 w-4" />
                          مشاهده
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/coach/programs/${program.id}`}>
                          <Pencil className="h-4 w-4" />
                          ویرایش
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

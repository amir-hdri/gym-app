"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Eye, Pencil } from "lucide-react";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { FilterChips, EmptyState } from "@/components/twilight/controls";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { formatPersianNumber, formatDate, cn } from "@/lib/utils";
import { useTrainingPrograms } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";

const statusOptions = ["all", "active", "draft", "completed", "archived"] as const;
type StatusOption = (typeof statusOptions)[number];

const statusConfig: Record<string, { label: string; variant: "secondary" | "success" | "info" | "outline" | "destructive" | "default" | "warning" }> = {
  draft: { label: "پیش‌نویس", variant: "secondary" as const },
  active: { label: "فعال", variant: "success" as const },
  completed: { label: "تکمیل شده", variant: "info" as const },
  archived: { label: "بایگانی", variant: "outline" as const },
};

const statusLabels: Record<StatusOption, string> = {
  all: "همه",
  active: "فعال",
  draft: "پیش‌نویس",
  completed: "تکمیل شده",
  archived: "بایگانی",
};

export default function ProgramsPage() {
  const [statusFilter, setStatusFilter] = React.useState<StatusOption>("all");
  const { data, isLoading, isError, error } = useTrainingPrograms();

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const programsData = data?.data || [];

  const filtered = programsData.filter(
    (p) => statusFilter === "all" || p.status === statusFilter
  );

  return (
    <PageShell>
      <PageHeader
        title="برنامه‌های تمرینی"
        subtitle="مدیریت برنامه‌های تمرینی شاگردان"
        action={
          <Button variant="default" asChild className="w-auto">
            <Link href="/coach/programs/new">
              <Plus className="h-4 w-4" />
              برنامه جدید
            </Link>
          </Button>
        }
      />

      <FilterChips
        pillId="coach-programs-status"
        options={statusOptions}
        value={statusFilter}
        onChange={setStatusFilter}
        labels={statusLabels}
      />

      <div className="overflow-hidden rounded-2xl border border-[#232934] bg-[#161a22]">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#232934]">
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">نام برنامه</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">ورزشکار</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">تاریخ شروع</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">تاریخ پایان</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">وضعیت</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">تمرینات</TableHead>
              <TableHead className="text-left text-[11px] font-semibold text-[#8e98a8]">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((program) => (
              <TableRow key={program.id} className={cn("border-t border-[#1e2430] hover:bg-[#1a202a]")}>
                <TableCell className="font-medium text-white">{program.name}</TableCell>
                <TableCell className="text-white">{program.athlete ? `${program.athlete.firstName} ${program.athlete.lastName}` : "–"}</TableCell>
                <TableCell className="text-white">{formatDate(program.startDate)}</TableCell>
                <TableCell className="text-white">{formatDate(program.endDate)}</TableCell>
                <TableCell>
                  <Badge variant={statusConfig[program.status]?.variant || "outline"}>
                    {statusConfig[program.status]?.label || program.status}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums text-white">{formatPersianNumber(program.exercises.length)} تمرین</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/coach/programs/${program.id}`}>
                        <Eye className="h-4 w-4" />
                        مشاهده
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/coach/programs/${program.id}`}>
                        <Pencil className="h-4 w-4" />
                        ویرایش
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="border-t border-[#1e2430] p-6">
            <EmptyState
              title="هیچ برنامه‌ای یافت نشد"
              description="برنامه‌ای با فیلتر انتخاب شده وجود ندارد"
              action={
                <Button variant="default" asChild className="w-full">
                  <Link href="/coach/programs/new">
                    <Plus className="h-4 w-4" />
                    برنامه جدید
                  </Link>
                </Button>
              }
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}

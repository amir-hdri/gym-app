"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Dumbbell, ChevronLeft, Play } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPersianNumber, formatDate, calculateProgress } from "@/lib/utils";
import { useTrainingPrograms } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { PageShell, PageHeader, SectionTitle, MicroLabel } from "@/components/twilight/Page";
import {
  SearchInput,
  FilterChips,
  RowCard,
  EmptyState,
} from "@/components/twilight/controls";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";

const statusConfig: Record<string, { label: string; variant: "secondary" | "success" | "info" | "outline" }> = {
  draft: { label: "پیش‌نویس", variant: "secondary" },
  active: { label: "فعال", variant: "success" },
  completed: { label: "تکمیل شده", variant: "info" },
  archived: { label: "بایگانی", variant: "outline" },
};

const statusFilters = ["all", "draft", "active", "completed", "archived"] as const;
type StatusFilter = (typeof statusFilters)[number];

const statusFilterLabels: Record<StatusFilter, string> = {
  all: "همه",
  draft: "پیش‌نویس",
  active: "فعال",
  completed: "تکمیل شده",
  archived: "بایگانی",
};

export default function ProgramsPage() {
  const { data, isLoading, isError, error } = useTrainingPrograms();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const programs = useMemo(() => data?.data ?? [], [data]);

  const filteredPrograms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return programs.filter((program) => {
      if (statusFilter !== "all" && program.status !== statusFilter) return false;
      if (!q) return true;
      const coachName = `${program.coach?.firstName || ""} ${program.coach?.lastName || ""}`.toLowerCase();
      return program.name.toLowerCase().includes(q) || coachName.includes(q);
    });
  }, [programs, searchQuery, statusFilter]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  if (programs.length === 0) {
    return (
      <PageShell>
        <PageHeader title="برنامه‌های تمرینی" subtitle="برنامه‌های تمرینی شما" />
        <EmptyState
          icon={<Dumbbell className="h-6 w-6" strokeWidth={1.75} />}
          title="برنامه تمرینی وجود ندارد"
          description="هنوز برنامه تمرینی برای شما ثبت نشده است"
          action={
            <Button asChild>
              <Link href="/athlete">بازگشت به داشبورد</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  const featured = programs.find((p) => p.status === "active") || programs[0];
  const featuredCompleted = featured.exercises?.filter((e) => e.isCompleted).length || 0;
  const featuredTotal = featured.exercises?.length || 1;
  const featuredProgress = calculateProgress(featuredCompleted, featuredTotal);
  const listPrograms = filteredPrograms.filter((p) => p.id !== featured.id);

  return (
    <PageShell>
      <PageHeader
        title="برنامه‌های تمرینی"
        subtitle="برنامه‌های تمرینی شما"
        action={
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-primary">
            {formatPersianNumber(programs.length)} برنامه
          </span>
        }
      />

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="جستجوی برنامه یا مربی..."
      />

      <FilterChips
        pillId="athlete-programs-filter"
        options={statusFilters}
        value={statusFilter}
        onChange={setStatusFilter}
        labels={statusFilterLabels}
      />

      {/* Featured program hero */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionTitle>برنامه شاخص</SectionTitle>
          <Badge variant={(statusConfig[featured.status] || statusConfig.draft).variant}>
            {(statusConfig[featured.status] || statusConfig.draft).label}
          </Badge>
        </div>
        <Link href={`/athlete/programs/${featured.id}`} className="group block">
          <div className="relative h-48 cursor-pointer overflow-hidden rounded-[26px] border border-logo-ink-inverse/10 shadow-xl">
            <GymBackdrop />
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
              <MicroLabel className="mb-1">Featured Program</MicroLabel>
              <h3 className="font-serif text-[26px] font-medium text-logo-ink-inverse transition-colors group-hover:text-logo-ink-inverse">
                {featured.name}
              </h3>
              <p className="mt-1 text-[11px] text-logo-ink-inverse/70 dark:text-muted-foreground">
                {formatPersianNumber(featuredTotal)} حرکت · {formatPersianNumber(Math.round(featuredProgress))}٪ تکمیل · {formatDate(featured.startDate)} - {formatDate(featured.endDate)}
              </p>
            </div>
            <div className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-logo-ink-inverse/20 bg-scrim/40 text-logo-ink-inverse backdrop-blur-md transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Play className="h-3.5 w-3.5 fill-current" strokeWidth={1.75} />
            </div>
          </div>
        </Link>
      </section>

      {/* All programs list */}
      <section className="flex flex-col gap-3">
        <SectionTitle>همه برنامه‌ها</SectionTitle>
        {listPrograms.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="h-6 w-6" strokeWidth={1.75} />}
            title="برنامه‌ای یافت نشد"
            description="با این جستجو یا فیلتر، برنامه‌ای پیدا نشد"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {listPrograms.map((program) => {
              const status = statusConfig[program.status] || statusConfig.draft;
              const completedCount = program.exercises?.filter((e) => e.isCompleted).length || 0;
              const totalCount = program.exercises?.length || 1;
              const progressPercent = calculateProgress(completedCount, totalCount);
              return (
                <Link key={program.id} href={`/athlete/programs/${program.id}`}>
                  <RowCard
                    icon={<Dumbbell className="h-4 w-4" strokeWidth={1.75} />}
                    title={program.name}
                    subtitle={`${program.coach?.firstName || ""} ${program.coach?.lastName || ""} · ${formatPersianNumber(completedCount)}/${formatPersianNumber(totalCount)} حرکت · ${formatPersianNumber(Math.round(progressPercent))}٪`}
                    trailing={
                      <span className="flex items-center gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                      </span>
                    }
                    className={program.status === "active" ? "ring-2 ring-primary/40" : undefined}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}

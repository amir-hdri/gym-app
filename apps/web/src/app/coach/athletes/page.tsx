"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Eye, ClipboardList } from "lucide-react";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { SearchInput, FilterChips, EmptyState } from "@/components/twilight/controls";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { getInitials, generateAvatarColor, formatDate, cn } from "@/lib/utils";
import { useUsers } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";

const statusFilters = ["all", "active", "inactive"] as const;
type StatusFilter = (typeof statusFilters)[number];

const statusFilterLabels: Record<StatusFilter, string> = {
  all: "همه",
  active: "فعال",
  inactive: "غیرفعال",
};

function getStatusBadge(status: string) {
  return status === "active"
    ? { label: "فعال", variant: "success" as const }
    : { label: "غیرفعال", variant: "secondary" as const };
}

export default function AthletesPage() {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<StatusFilter>("all");
  const { data, isLoading, isError, error } = useUsers("athlete");

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const usersData = data?.data || [];

  const filtered = usersData.filter((a) => {
    const name = `${a.firstName} ${a.lastName}`;
    const matchesSearch = name.includes(search) || a.phone.includes(search);
    const matchesFilter = filter === "all" || a.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <PageShell>
      <PageHeader
        title="شاگردان"
        subtitle="مدیریت و مشاهده شاگردان شما"
        action={
          <Button variant="default" asChild className="w-auto">
            <Link href="/coach/athletes/new">
              <Plus className="h-4 w-4" />
              شاگرد جدید
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="جستجوی شاگرد..." />
        <FilterChips
          pillId="coach-athletes-status"
          options={statusFilters}
          value={filter}
          onChange={setFilter}
          labels={statusFilterLabels}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="text-[11px] font-semibold text-muted-foreground">نام</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground">تلفن</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground">برنامه فعلی</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground">آخرین چک‌این</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground">پیشرفت</TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground">وضعیت</TableHead>
              <TableHead className="text-left text-[11px] font-semibold text-muted-foreground">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((athlete) => {
              const name = `${athlete.firstName} ${athlete.lastName}`;
              return (
                <TableRow key={athlete.id} className={cn("border-t border-border hover:bg-secondary")}>
                  <TableCell>
                    <Link href={`/coach/athletes/${athlete.id}`} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={generateAvatarColor(name)}>
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{name}</span>
                    </Link>
                  </TableCell>
                  <TableCell dir="ltr" className="text-left text-foreground">{athlete.phone}</TableCell>
                  <TableCell className="text-foreground">–</TableCell>
                  <TableCell className="text-foreground">{athlete.lastLoginAt ? formatDate(athlete.lastLoginAt) : "–"}</TableCell>
                  <TableCell className="text-foreground">–</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(athlete.status).variant}>
                      {getStatusBadge(athlete.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/coach/athletes/${athlete.id}`}>
                          <Eye className="h-4 w-4" />
                          مشاهده
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ClipboardList className="h-4 w-4" />
                        برنامه تمرینی
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="border-t border-border p-6">
            <EmptyState
              title="هیچ شاگردی یافت نشد"
              description="شما هنوز هیچ شاگردی ندارید"
              action={
                <Button variant="default" asChild className="w-full">
                  <Link href="/coach/athletes/new">
                    <Plus className="h-4 w-4" />
                    شاگرد جدید
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

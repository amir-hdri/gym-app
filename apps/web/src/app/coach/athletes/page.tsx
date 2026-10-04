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

      <div className="overflow-hidden rounded-2xl border border-[#232934] bg-[#161a22]">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#232934]">
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">نام</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">تلفن</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">برنامه فعلی</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">آخرین چک‌این</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">پیشرفت</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#8e98a8]">وضعیت</TableHead>
              <TableHead className="text-left text-[11px] font-semibold text-[#8e98a8]">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((athlete) => {
              const name = `${athlete.firstName} ${athlete.lastName}`;
              return (
                <TableRow key={athlete.id} className={cn("border-t border-[#1e2430] hover:bg-[#1a202a]")}>
                  <TableCell>
                    <Link href={`/coach/athletes/${athlete.id}`} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={generateAvatarColor(name)}>
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-white">{name}</span>
                    </Link>
                  </TableCell>
                  <TableCell dir="ltr" className="text-left text-white">{athlete.phone}</TableCell>
                  <TableCell className="text-white">–</TableCell>
                  <TableCell className="text-white">{athlete.lastLoginAt ? formatDate(athlete.lastLoginAt) : "–"}</TableCell>
                  <TableCell className="text-white">–</TableCell>
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
          <div className="border-t border-[#1e2430] p-6">
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

"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Plus, Eye, ClipboardList } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { formatPersianNumber, getInitials, generateAvatarColor, formatDate, cn } from "@/lib/utils";
import { useUsers } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";

function getStatusBadge(status: string) {
  return status === "active"
    ? { label: "فعال", variant: "success" as const }
    : { label: "غیرفعال", variant: "secondary" as const };
}

export default function AthletesPage() {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "active" | "inactive">("all");
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
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-10">شاگردان</h1>
          <p className="mt-1 text-muted-foreground leading-6">مدیریت و مشاهده شاگردان شما</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/coach/athletes/new">
            <Plus className="h-4 w-4" />
            شاگرد جدید
          </Link>
        </Button>
      </div>

      <FadeIn>
        <Card glass className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی شاگرد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "active", "inactive"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "همه" : f === "active" ? "فعال" : "غیرفعال"}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card glass>
          <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>تلفن</TableHead>
                <TableHead>برنامه فعلی</TableHead>
                <TableHead>آخرین چک‌این</TableHead>
                <TableHead>پیشرفت</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((athlete) => {
                const name = `${athlete.firstName} ${athlete.lastName}`;
                return (
                <TableRow key={athlete.id} className={cn()}>
                  <TableCell>
                    <Link href={`/coach/athletes/${athlete.id}`} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={generateAvatarColor(name)}>
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{name}</span>
                    </Link>
                  </TableCell>
                  <TableCell dir="ltr" className="text-left">{athlete.phone}</TableCell>
                  <TableCell>–</TableCell>
                  <TableCell>{athlete.lastLoginAt ? formatDate(athlete.lastLoginAt) : "–"}</TableCell>
                  <TableCell>–</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(athlete.status).variant}>
                      {getStatusBadge(athlete.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/coach/athletes/${athlete.id}`}>
                          <Eye className="h-4 w-4" />
                          مشاهده
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
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
            <EmptyState title="هیچ شاگردی یافت نشد" description="شما هنوز هیچ شاگردی ندارید" />
          )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

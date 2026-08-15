"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { formatPersianNumber, formatDate } from "@/lib/utils";
import { Search, Plus, Users } from "lucide-react";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";
import { useUsers } from "@/hooks/use-api";

const statusMap: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "فعال", variant: "success" },
  inactive: { label: "غیرفعال", variant: "secondary" },
  suspended: { label: "تعلیق شده", variant: "destructive" },
};

export default function MembersPage() {
  const { data, isLoading, isError } = useUsers("athlete");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const members = data?.data || [];

  const filtered = members.filter((m) => {
    const matchSearch = `${m.firstName} ${m.lastName}`.includes(search) || m.email.includes(search) || m.phone.includes(search);
    const matchFilter = filter === "all" || m.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-8">مدیریت اعضا</h1>
          <p className="mt-1 text-muted-foreground leading-6">لیست تمام اعضای باشگاه</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/members/new">
            <Plus className="ml-2 h-4 w-4" />
            افزودن عضو جدید
          </Link>
        </Button>
      </div>

      <Card glass>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی عضو..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 bg-white/70 backdrop-blur-sm border-white/30"
              />
            </div>
            <select
              className="flex h-10 w-40 rounded-lg border border-white/30 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">همه</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="suspended">تعلیق شده</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12 text-muted-foreground" />}
              title="هیچ عضوی یافت نشد"
              description={search || filter !== "all" ? "هیچ نتیجه‌ای با فیلترهای فعلی مطابقت ندارد" : "هنوز عضوی ثبت‌نام نکرده است"}
            />
          ) : (
            <>
            <div className="grid gap-3 p-3 sm:hidden">
              {filtered.map((member) => (
                <article key={member.id} className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-bold leading-6">{member.firstName} {member.lastName}</h2>
                      <p dir="ltr" className="mt-1 truncate text-left text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant={statusMap[member.status].variant}>{statusMap[member.status].label}</Badge>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-border/50 py-3 text-xs">
                    <div><dt className="text-muted-foreground">شماره تماس</dt><dd dir="ltr" className="mt-1 text-right font-medium">{member.phone}</dd></div>
                    <div><dt className="text-muted-foreground">طرح اشتراک</dt><dd className="mt-1 font-medium">{(member as any).plan || "بدون طرح"}</dd></div>
                    <div className="col-span-2"><dt className="text-muted-foreground">تاریخ ثبت‌نام</dt><dd className="mt-1 font-medium">{formatDate(member.createdAt)}</dd></div>
                  </dl>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                    <Link href={`/admin/members/${member.id}`}>مشاهده و ویرایش</Link>
                  </Button>
                </article>
              ))}
            </div>
            <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ردیف</TableHead>
                  <TableHead>نام</TableHead>
                  <TableHead>ایمیل</TableHead>
                  <TableHead>تلفن</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>طرح اشتراک</TableHead>
                  <TableHead>تاریخ ثبت‌نام</TableHead>
                  <TableHead className="w-28">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member, idx) => (
                  <TableRow key={member.id} className="transition-colors hover:bg-white/30">
                    <TableCell>{formatPersianNumber(idx + 1)}</TableCell>
                    <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                    <TableCell dir="ltr" className="text-left">{member.email}</TableCell>
                    <TableCell dir="ltr" className="text-left">{member.phone}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[member.status].variant}>
                        {statusMap[member.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{(member as any).plan}</TableCell>
                    <TableCell>{formatDate(member.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm"><Link href={`/admin/members/${member.id}`}>ویرایش</Link></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

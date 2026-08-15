"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { formatPersianNumber } from "@/lib/utils";
import { Search, Plus, UserCircle } from "lucide-react";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";
import { useUsers } from "@/hooks/use-api";

const statusMap: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "فعال", variant: "success" },
  inactive: { label: "غیرفعال", variant: "secondary" },
  suspended: { label: "تعلیق شده", variant: "destructive" },
};

export default function CoachesPage() {
  const { data, isLoading, isError } = useUsers("coach");
  const [search, setSearch] = useState("");

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const coaches = data?.data || [];

  const filtered = coaches.filter((c) =>
    `${c.firstName} ${c.lastName}`.includes(search) || c.email.includes(search) || c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-8">مدیریت مربیان</h1>
          <p className="mt-1 text-muted-foreground leading-6">لیست تمام مربیان باشگاه</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/coaches/new">
            <Plus className="ml-2 h-4 w-4" />
            افزودن مربی جدید
          </Link>
        </Button>
      </div>

      <Card glass>
        <CardContent className="p-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجوی مربی..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-white/70 backdrop-blur-sm border-white/30"
            />
          </div>
        </CardContent>
      </Card>

      <Card glass>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<UserCircle className="h-12 w-12 text-muted-foreground" />}
              title="هیچ مربی‌ای یافت نشد"
              description={search ? "هیچ نتیجه‌ای با جستجوی فعلی مطابقت ندارد" : "هنوز مربی‌ای ثبت نشده است"}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ردیف</TableHead>
                  <TableHead>نام</TableHead>
                  <TableHead>ایمیل</TableHead>
                  <TableHead>تلفن</TableHead>
                  <TableHead>تعداد شاگردان</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="w-28">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((coach, idx) => (
                  <TableRow key={coach.id} className="transition-colors hover:bg-white/30">
                    <TableCell>{formatPersianNumber(idx + 1)}</TableCell>
                    <TableCell className="font-medium">{coach.firstName} {coach.lastName}</TableCell>
                    <TableCell dir="ltr" className="text-left">{coach.email}</TableCell>
                    <TableCell dir="ltr" className="text-left">{coach.phone}</TableCell>
                    <TableCell>{formatPersianNumber((coach as any).students)}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[coach.status].variant}>
                        {statusMap[coach.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm"><Link href={`/admin/coaches/${coach.id}`}>ویرایش</Link></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

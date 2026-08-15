"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Phone, Mail, Calendar, Award, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { FadeIn } from "@/components/animations/FadeIn";
import { formatPersianNumber, formatCurrency, formatDate, formatDateTime, getInitials, generateAvatarColor } from "@/lib/utils";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { useUser } from "@/hooks/use-api";

const statusMap: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "فعال", variant: "success" }, inactive: { label: "غیرفعال", variant: "secondary" }, suspended: { label: "تعلیق شده", variant: "destructive" },
};

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = useUser(params.id);
  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const member = data?.data as any;
  if (!member) return <ErrorDisplay message="کاربر یافت نشد" />;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/members">
            <ChevronRight className="h-4 w-4" />
            بازگشت به لیست اعضا
          </Link>
        </Button>
      </div>

      <FadeIn>
        <Card glass>
          <CardContent className="flex items-center gap-6 p-6">
            <Avatar className="h-20 w-20 ring-4 ring-white/50">
              <AvatarFallback className={"text-2xl " + generateAvatarColor(`${member.firstName} ${member.lastName}`)}>
                {getInitials(`${member.firstName} ${member.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{member.firstName} {member.lastName}</h1>
                <Badge variant={statusMap[member.status].variant}>{statusMap[member.status].label}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{member.phone}</span>
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{member.email}</span>
                <span className="flex items-center gap-1"><Award className="h-4 w-4" />{member.plan}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />عضویت از {formatDate(member.createdAt)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Edit className="h-4 w-4" /> ویرایش</Button>
              <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card glass>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">اشتراک</p>
              <p className="text-lg font-semibold">{member.plan}</p>
              <p className="text-xs text-muted-foreground">{formatDate(member.createdAt)}</p>
            </CardContent>
          </Card>
          <Card glass>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">جلسات</p>
              <p className="text-lg font-semibold">{formatPersianNumber(member.sessionsUsed)} / {formatPersianNumber(member.sessionsTotal)}</p>
              <Progress value={((member.sessionsUsed || 0) / (member.sessionsTotal || 1)) * 100} className="mt-2" />
            </CardContent>
          </Card>
          <Card glass>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">مربی</p>
              <p className="text-lg font-semibold">{member.coach}</p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      <Tabs defaultValue="goals" dir="rtl">
        <TabsList>
          <TabsTrigger value="goals">اهداف</TabsTrigger>
          <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          {(member.goals || []).map((goal: any, i: number) => (
            <Card key={i} glass>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{goal.title}</span>
                  <span className="text-sm text-muted-foreground">{formatPersianNumber(goal.current)}/{formatPersianNumber(goal.target)} {goal.unit}</span>
                </div>
                <Progress value={(goal.current / goal.target) * 100} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payments">
          <Card glass>
            <CardHeader><CardTitle>تاریخچه پرداخت‌ها</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>روش پرداخت</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(member.payments || []).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell><Badge variant={p.status === "completed" ? "success" : "warning"}>{p.status === "completed" ? "موفق" : "معلق"}</Badge></TableCell>
                      <TableCell>{formatDateTime(p.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Phone, Mail, Calendar, ChevronRight, Edit, Trash2, Award, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { FadeIn } from "@/components/animations/FadeIn";
import { formatPersianNumber, getInitials, generateAvatarColor } from "@/lib/utils";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { useUser } from "@/hooks/use-api";

const statusMap: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "فعال", variant: "success" }, inactive: { label: "غیرفعال", variant: "secondary" }, suspended: { label: "تعلیق شده", variant: "destructive" },
};

export default function CoachProfilePage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = useUser(params.id);
  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const coach = data?.data as any;
  if (!coach) return <ErrorDisplay message="مربی یافت نشد" />;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/coaches"><ChevronRight className="h-4 w-4" /> بازگشت به مربیان</Link>
        </Button>
      </div>

      <FadeIn>
        <Card glass>
          <CardContent className="flex items-center gap-6 p-6">
            <Avatar className="h-20 w-20 ring-4 ring-white/50">
              <AvatarFallback className={"text-2xl " + generateAvatarColor(`${coach.firstName} ${coach.lastName}`)}>
                {getInitials(`${coach.firstName} ${coach.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{coach.firstName} {coach.lastName}</h1>
                <Badge variant={statusMap[coach.status].variant}>{statusMap[coach.status].label}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{coach.phone}</span>
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{coach.email}</span>
                <span className="flex items-center gap-1"><Award className="h-4 w-4" />{coach.specialty}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />سابقه: {coach.experience}</span>
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
          <Card glass><CardContent className="p-6">
            <p className="text-sm text-muted-foreground">تعداد شاگردان</p>
            <p className="text-2xl font-bold">{formatPersianNumber(coach.students)}</p>
          </CardContent></Card>
          <Card glass><CardContent className="p-6">
            <p className="text-sm text-muted-foreground">امتیاز</p>
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <p className="text-2xl font-bold">{coach.rating}</p>
            </div>
          </CardContent></Card>
          <Card glass><CardContent className="p-6">
            <p className="text-sm text-muted-foreground">تخصص</p>
            <p className="text-lg font-semibold">{coach.specialty}</p>
          </CardContent></Card>
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card glass>
          <CardHeader><CardTitle>لیست شاگردان</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>طرح اشتراک</TableHead>
                  <TableHead>پیشرفت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(coach.studentsList || []).map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.plan}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-white/20"><div className="h-full rounded-full bg-primary" style={{ width: `${s.progress}%` }} /></div><span className="text-sm">{formatPersianNumber(s.progress)}%</span></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

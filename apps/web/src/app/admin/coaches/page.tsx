"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPersianNumber } from "@/lib/utils";
import { Plus, UserCircle } from "lucide-react";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { useUsers, useTrainingPrograms } from "@/hooks/use-api";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { CtaButton, SearchInput, EmptyState } from "@/components/twilight/controls";

const statusMap: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "فعال", variant: "success" },
  inactive: { label: "غیرفعال", variant: "secondary" },
  suspended: { label: "تعلیق شده", variant: "destructive" },
};

const thClass = "px-4 py-3 text-right text-[10px] font-semibold text-muted-foreground";
const tdClass = "px-4 py-3 text-muted-foreground";

export default function CoachesPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useUsers("coach");
  const { data: programsData } = useTrainingPrograms();
  const [search, setSearch] = useState("");

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay onRetry={refetch} />;
  const coaches = data?.data || [];

  // Distinct coached athletes per coach, from the program roster.
  const studentsByCoach = new Map<string, Set<string>>();
  for (const program of programsData?.data ?? []) {
    let set = studentsByCoach.get(program.coachId);
    if (!set) {
      set = new Set();
      studentsByCoach.set(program.coachId, set);
    }
    set.add(program.athleteId);
  }

  const filtered = coaches.filter((c) =>
    `${c.firstName} ${c.lastName}`.includes(search) || c.email.includes(search) || c.phone.includes(search)
  );

  return (
    <PageShell>
      <PageHeader
        title="مدیریت مربیان"
        subtitle="لیست تمام مربیان باشگاه"
        action={
          <CtaButton onClick={() => router.push("/admin/coaches/new")} className="w-auto px-5">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            افزودن مربی جدید
          </CtaButton>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="جستجوی مربی..." />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<UserCircle className="h-6 w-6" strokeWidth={1.75} />}
          title="هیچ مربی‌ای یافت نشد"
          description={search ? "هیچ نتیجه‌ای با جستجوی فعلی مطابقت ندارد" : "هنوز مربی‌ای ثبت نشده است"}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr>
                <th scope="col" className={thClass}>ردیف</th>
                <th scope="col" className={thClass}>نام</th>
                <th scope="col" className={thClass}>ایمیل</th>
                <th scope="col" className={thClass}>تلفن</th>
                <th scope="col" className={thClass}>تعداد شاگردان</th>
                <th scope="col" className={thClass}>وضعیت</th>
                <th scope="col" className={thClass}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((coach, idx) => (
                <tr key={coach.id} className="border-t border-border hover:bg-secondary">
                  <td className={tdClass}>{formatPersianNumber(idx + 1)}</td>
                  <td className={`${tdClass} font-medium text-foreground`}>{coach.firstName} {coach.lastName}</td>
                  <td dir="ltr" className={`${tdClass} text-left`}>{coach.email}</td>
                  <td dir="ltr" className={`${tdClass} text-left`}>{coach.phone}</td>
                  <td className={tdClass}>{formatPersianNumber(studentsByCoach.get(coach.id)?.size ?? 0)}</td>
                  <td className={tdClass}>
                    <Badge variant={statusMap[coach.status].variant}>
                      {statusMap[coach.status].label}
                    </Badge>
                  </td>
                  <td className={tdClass}>
                    <Button asChild variant="outline" size="sm"><Link href={`/admin/coaches/${coach.id}`} aria-label={`ویرایش ${coach.firstName} ${coach.lastName}`}>ویرایش</Link></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

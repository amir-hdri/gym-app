"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Phone, Mail, Calendar, ChevronRight, Edit, Trash2, Award, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPersianNumber, getInitials } from "@/lib/utils";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { useUser } from "@/hooks/use-api";
import { PageShell, SectionTitle } from "@/components/twilight/Page";
import { StatCard } from "@/components/twilight/controls";

const statusMap: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "فعال", variant: "success" }, inactive: { label: "غیرفعال", variant: "secondary" }, suspended: { label: "تعلیق شده", variant: "destructive" },
};

function InfoRow({ icon, label, value, ltr }: { icon: ReactNode; label: string; value: ReactNode; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 hover:bg-[#1a202a]">
      <span className="flex items-center gap-3">
        <span className="text-[#8e98a8]">{icon}</span>
        <span className="text-xs text-[#8e98a8]">{label}</span>
      </span>
      <span dir={ltr ? "ltr" : undefined} className="text-sm text-white">{value}</span>
    </div>
  );
}

const thClass = "px-4 py-3 text-right text-[10px] font-semibold text-[#8e98a8]";
const tdClass = "px-4 py-3 text-[#c8cdd6]";

export default function CoachProfilePage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = useUser(params.id);
  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const coach = data?.data as any;
  if (!coach) return <ErrorDisplay message="مربی یافت نشد" />;

  return (
    <PageShell>
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/coaches"><ChevronRight className="h-4 w-4" strokeWidth={1.75} /> بازگشت به مربیان</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-[#232934] bg-[#161a22] p-5 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[#d2c0a5] bg-gradient-to-br from-[#2a3444] to-[#141a22]">
          <span className="font-serif text-2xl text-[#d2c0a5]">
            {getInitials(`${coach.firstName} ${coach.lastName}`)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-white">{coach.firstName} {coach.lastName}</h1>
            <Badge variant={statusMap[coach.status].variant}>{statusMap[coach.status].label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Edit className="h-4 w-4" strokeWidth={1.75} /> ویرایش</Button>
          <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" strokeWidth={1.75} /></Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#232934] bg-[#161a22] divide-y divide-[#1e2430]">
        <InfoRow icon={<Phone className="h-4 w-4" strokeWidth={1.75} />} label="تلفن" value={coach.phone} ltr />
        <InfoRow icon={<Mail className="h-4 w-4" strokeWidth={1.75} />} label="ایمیل" value={coach.email} ltr />
        <InfoRow icon={<Award className="h-4 w-4" strokeWidth={1.75} />} label="تخصص" value={coach.specialty} />
        <InfoRow icon={<Calendar className="h-4 w-4" strokeWidth={1.75} />} label="سابقه" value={coach.experience} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="تعداد شاگردان" value={formatPersianNumber(coach.students)} />
        <StatCard
          label="امتیاز"
          value={
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {coach.rating}
            </span>
          }
        />
        <StatCard label="تخصص" value={coach.specialty} className="col-span-2" />
      </div>

      <div>
        <SectionTitle className="mb-3">لیست شاگردان</SectionTitle>
        <div className="overflow-x-auto rounded-2xl border border-[#232934] bg-[#161a22]">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr>
                <th scope="col" className={thClass}>نام</th>
                <th scope="col" className={thClass}>طرح اشتراک</th>
                <th scope="col" className={thClass}>پیشرفت</th>
              </tr>
            </thead>
            <tbody>
              {(coach.studentsList || []).map((s: any) => (
                <tr key={s.id} className="border-t border-[#1e2430] hover:bg-[#1a202a]">
                  <td className={`${tdClass} font-medium text-white`}>{s.name}</td>
                  <td className={tdClass}>{s.plan}</td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-[#202632]">
                        <div className="h-full rounded-full bg-[#d2c0a5]" style={{ width: `${s.progress}%` }} />
                      </div>
                      <span className="text-sm">{formatPersianNumber(s.progress)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}

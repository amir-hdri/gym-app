"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPersianNumber, formatDate } from "@/lib/utils";
import { Plus, Users } from "lucide-react";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { useUsers } from "@/hooks/use-api";
import type { User } from "@/lib/types";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { CtaButton, SearchInput, FilterChips, EmptyState } from "@/components/twilight/controls";

type MemberRow = User & { plan?: string };

const statusMap: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "فعال", variant: "success" },
  inactive: { label: "غیرفعال", variant: "secondary" },
  suspended: { label: "تعلیق شده", variant: "destructive" },
};

const statusFilterOptions = ["all", "active", "inactive", "suspended"] as const;
type StatusFilter = (typeof statusFilterOptions)[number];
const statusFilterLabels: Record<StatusFilter, string> = {
  all: "همه",
  active: "فعال",
  inactive: "غیرفعال",
  suspended: "تعلیق شده",
};

const thClass = "px-4 py-3 text-right text-[10px] font-semibold text-muted-foreground";
const tdClass = "px-4 py-3 text-muted-foreground";

export default function MembersPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useUsers("athlete");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay onRetry={refetch} />;
  const members: MemberRow[] = data?.data || [];

  const filtered = members.filter((m) => {
    const matchSearch = `${m.firstName} ${m.lastName}`.includes(search) || m.email.includes(search) || m.phone.includes(search);
    const matchFilter = filter === "all" || m.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <PageShell>
      <PageHeader
        title="مدیریت اعضا"
        subtitle="لیست تمام اعضای باشگاه"
        action={
          <CtaButton onClick={() => router.push("/admin/members/new")} className="w-auto px-5">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            افزودن عضو جدید
          </CtaButton>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="جستجوی عضو..." />

      <FilterChips
        options={statusFilterOptions}
        value={filter}
        onChange={setFilter}
        labels={statusFilterLabels}
        pillId="admin-members-filter"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" strokeWidth={1.75} />}
          title="هیچ عضوی یافت نشد"
          description={search || filter !== "all" ? "هیچ نتیجه‌ای با فیلترهای فعلی مطابقت ندارد" : "هنوز عضوی ثبت‌نام نکرده است"}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:hidden">
            {filtered.map((member) => (
              <article key={member.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-sans text-sm font-medium text-foreground">{member.firstName} {member.lastName}</h2>
                    <p dir="ltr" className="mt-1 truncate text-left text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant={statusMap[member.status].variant}>{statusMap[member.status].label}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3 text-xs">
                  <div><dt className="text-muted-foreground">شماره تماس</dt><dd dir="ltr" className="mt-1 text-right font-medium text-foreground">{member.phone}</dd></div>
                  <div><dt className="text-muted-foreground">طرح اشتراک</dt><dd className="mt-1 font-medium text-foreground">{member.plan || "بدون طرح"}</dd></div>
                  <div className="col-span-2"><dt className="text-muted-foreground">تاریخ ثبت‌نام</dt><dd className="mt-1 font-medium text-foreground">{formatDate(member.createdAt)}</dd></div>
                </dl>
                <CtaButton variant="outline" onClick={() => router.push(`/admin/members/${member.id}`)} className="mt-3 w-full">
                  مشاهده و ویرایش
                </CtaButton>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card sm:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr>
                  <th scope="col" className={thClass}>ردیف</th>
                  <th scope="col" className={thClass}>نام</th>
                  <th scope="col" className={thClass}>ایمیل</th>
                  <th scope="col" className={thClass}>تلفن</th>
                  <th scope="col" className={thClass}>وضعیت</th>
                  <th scope="col" className={thClass}>طرح اشتراک</th>
                  <th scope="col" className={thClass}>تاریخ ثبت‌نام</th>
                  <th scope="col" className={thClass}>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member, idx) => (
                  <tr key={member.id} className="border-t border-border hover:bg-secondary">
                    <td className={tdClass}>{formatPersianNumber(idx + 1)}</td>
                    <td className={`${tdClass} font-medium text-foreground`}>{member.firstName} {member.lastName}</td>
                    <td dir="ltr" className={`${tdClass} text-left`}>{member.email}</td>
                    <td dir="ltr" className={`${tdClass} text-left`}>{member.phone}</td>
                    <td className={tdClass}>
                      <Badge variant={statusMap[member.status].variant}>
                        {statusMap[member.status].label}
                      </Badge>
                    </td>
                    <td className={tdClass}>{member.plan}</td>
                    <td className={tdClass}>{formatDate(member.createdAt)}</td>
                    <td className={tdClass}>
                      <Button asChild variant="outline" size="sm"><Link href={`/admin/members/${member.id}`}>ویرایش</Link></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageShell>
  );
}

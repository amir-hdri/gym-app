"use client";

import { Building2, CalendarDays, Clock, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import type { User } from "@/lib/types";
import { USER_ROLE, USER_STATUS, fullName } from "./admin-data";

interface DetailRow {
  icon: React.ReactNode;
  label: string;
  value: string;
  /** Latin values (email, phone) are isolated so bidi does not reorder them. */
  ltr?: boolean;
}

/**
 * Identity card for one account: avatar, name, role and status, then the
 * contact and lifecycle facts as a description list.
 *
 * Shared by the member and coach profiles. Deliberately *not* an `<h1>` — the
 * page's single heading of rank 1 belongs to `PageHeader`.
 */
export function UserIdentityPanel({ user, extra }: { user: User; extra?: React.ReactNode }) {
  const name = fullName(user) || user.email;
  const status = USER_STATUS[user.status];

  const rows: DetailRow[] = [
    { icon: <Phone aria-hidden className="h-4 w-4" />, label: "شماره تماس", value: user.phone || "ثبت نشده", ltr: Boolean(user.phone) },
    { icon: <Mail aria-hidden className="h-4 w-4" />, label: "ایمیل", value: user.email, ltr: true },
    {
      icon: <Building2 aria-hidden className="h-4 w-4" />,
      label: "شعبه",
      value: user.branchName ?? (user.branchId ? user.branchId : "تعیین نشده"),
    },
    { icon: <CalendarDays aria-hidden className="h-4 w-4" />, label: "تاریخ عضویت", value: formatDate(user.createdAt) },
    {
      icon: <Clock aria-hidden className="h-4 w-4" />,
      label: "آخرین ورود",
      value: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "تا کنون وارد نشده",
    },
  ];

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16 border border-border">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={`تصویر ${name}`} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                {getInitials(name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-lg font-bold leading-7 text-foreground">{name}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="outline">{USER_ROLE[user.role]}</Badge>
            </div>
          </div>
          {extra && <div className="flex flex-wrap items-center gap-2">{extra}</div>}
        </div>

        <dl className="grid gap-x-6 gap-y-3 @sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start gap-2.5">
              <span aria-hidden className="mt-0.5 shrink-0 text-muted-foreground">
                {row.icon}
              </span>
              <div className="min-w-0">
                <dt className="text-xs leading-5 text-muted-foreground">{row.label}</dt>
                <dd className="truncate text-sm font-medium text-foreground">
                  {row.ltr ? (
                    // An inline `dir` isolates the Latin run without flipping the
                    // alignment of the surrounding RTL column.
                    <span dir="ltr" className="inline-block max-w-full truncate align-bottom">
                      {row.value}
                    </span>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

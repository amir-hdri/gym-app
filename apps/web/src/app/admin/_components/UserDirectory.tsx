"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState, ErrorDisplay } from "@/components/ui/DataState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { CardSkeleton, TableSkeleton } from "@/components/animations/Skeleton";
import { formatDate, formatPersianNumber, getInitials } from "@/lib/utils";
import type { User, UserStatus } from "@/lib/types";
import { USER_STATUS } from "./admin-data";
import { PaginationBar, SearchField, SortableHead } from "./TableControls";
import { UserRowActions } from "./UserRowActions";
import { usePagination } from "./use-pagination";
import type { SortState } from "./admin-data";

export type DirectorySortKey = "name" | "email" | "createdAt" | "status";

const STATUS_FILTERS: { value: UserStatus | "all"; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "active", label: USER_STATUS.active.label },
  { value: "inactive", label: USER_STATUS.inactive.label },
  { value: "suspended", label: USER_STATUS.suspended.label },
  { value: "pending", label: USER_STATUS.pending.label },
];

/** A secondary column, shown in the desktop table and on the mobile card. */
export interface DirectoryColumn {
  key: string;
  label: string;
  /** Cell text. `ltr` values are isolated so bidi cannot reorder them. */
  value: (user: User) => string;
  ltr?: boolean;
}

export interface UserDirectoryProps {
  users: User[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** `/admin/members` — also the base for each row's link. */
  basePath: string;
  /** Noun used in the confirmation copy, e.g. "عضو". */
  noun: string;
  /** Initial status filter, normally read from `?status=`. */
  initialStatus?: UserStatus | "all";
  /** Extra columns beyond name / contact / status / joined. */
  columns?: DirectoryColumn[];
  /** Extra sort keys, matching `columns[].key`. */
  sortValues?: Record<string, (user: User) => string | number>;
  /** Panel caption. */
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

const PAGE_SIZE = 10;

/**
 * The member / coach list, shared by both so a filter, a sort and a row action
 * can never exist on one and not the other.
 *
 * The table is desktop-only and collapses to cards under `sm`; both render from
 * the same sorted, paginated rows. Nothing here is optimistic — every write goes
 * through `UserRowActions`, which reports its own failures.
 */
export function UserDirectory({
  users,
  isLoading,
  isError,
  onRetry,
  basePath,
  noun,
  initialStatus = "all",
  columns = [],
  sortValues = {},
  title,
  description,
  emptyTitle,
  emptyDescription,
}: UserDirectoryProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "all">(initialStatus);
  const [sort, setSort] = useState<SortState<DirectorySortKey>>({ key: "createdAt", dir: "desc" });

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return users.filter((user) => {
      if (status !== "all" && user.status !== status) return false;
      if (!needle) return true;
      return (
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle) ||
        user.phone.includes(needle)
      );
    });
  }, [users, search, status]);

  const sorted = useMemo(() => {
    const read: Record<DirectorySortKey, (user: User) => string | number> = {
      name: (user) => `${user.firstName} ${user.lastName}`.trim(),
      email: (user) => user.email,
      createdAt: (user) => new Date(user.createdAt).getTime(),
      status: (user) => USER_STATUS[user.status].label,
      ...sortValues,
    };
    const factor = sort.dir === "asc" ? 1 : -1;
    const reader = read[sort.key] ?? read.name;
    return [...filtered].sort((a, b) => {
      const left = reader(a);
      const right = reader(b);
      if (typeof left === "number" && typeof right === "number") return (left - right) * factor;
      return String(left).localeCompare(String(right), "fa") * factor;
    });
  }, [filtered, sort, sortValues]);

  const pagination = usePagination(sorted.length, PAGE_SIZE);
  const rows = useMemo(
    () => sorted.slice(pagination.from, pagination.to),
    [sorted, pagination.from, pagination.to]
  );

  const toggleSort = (key: DirectorySortKey) =>
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );

  const isFiltered = search.trim().length > 0 || status !== "all";

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-4 @sm:p-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold leading-6 text-foreground">{title}</h2>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{description}</p>
            </div>
            {!isLoading && !isError && (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {formatPersianNumber(sorted.length)} {noun}
              </p>
            )}
          </div>

          <SearchField
            value={search}
            onValueChange={setSearch}
            label={`جستجوی ${noun}`}
            placeholder="نام، ایمیل یا شماره موبایل…"
          />

          {/* A filter row is a Chip row: `--primary` is the selected-chip token. */}
          <div className="flex flex-wrap gap-2" role="group" aria-label={`فیلتر وضعیت ${noun}`}>
            {STATUS_FILTERS.map((option) => (
              <Chip
                key={option.value}
                selected={status === option.value}
                onSelect={() => setStatus(option.value)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="@sm:hidden">
              <CardSkeleton />
            </div>
            <div className="hidden @sm:block">
              <TableSkeleton rows={PAGE_SIZE} />
            </div>
          </>
        ) : isError ? (
          <ErrorDisplay message={`فهرست ${noun} بارگذاری نشد`} onRetry={onRetry} />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<Users aria-hidden className="h-7 w-7" />}
            title={emptyTitle}
            description={isFiltered ? "هیچ حسابی با فیلترهای فعلی مطابقت ندارد." : emptyDescription}
            action={
              isFiltered ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                  }}
                >
                  پاک کردن فیلترها
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            {/* Mobile: one card per account. */}
            <ul className="space-y-3 @sm:hidden">
              {rows.map((user) => {
                const statusMeta = USER_STATUS[user.status];
                const name = `${user.firstName} ${user.lastName}`.trim() || user.email;
                return (
                  <li key={user.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11 border border-border">
                        {user.avatarUrl ? (
                          <AvatarImage src={user.avatarUrl} alt="" />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                            {getInitials(name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`${basePath}/${user.id}`}
                          className="ring-focus block truncate text-sm font-semibold text-foreground"
                        >
                          {name}
                        </Link>
                        <p dir="ltr" className="mt-0.5 truncate text-start text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <UserRowActions user={user} detailHref={`${basePath}/${user.id}`} noun={noun} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      {columns.map((column) => (
                        <span key={column.key} className="text-xs text-muted-foreground">
                          {column.label}:{" "}
                          <span dir={column.ltr ? "ltr" : undefined} className="font-medium text-foreground">
                            {column.value(user)}
                          </span>
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: the table. */}
            <div className="hidden @sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead column="name" label="نام" sort={sort} onSort={toggleSort} />
                    <SortableHead column="email" label="ایمیل" sort={sort} onSort={toggleSort} />
                    {columns.map((column) => (
                      <TableHead key={column.key} scope="col">
                        {column.label}
                      </TableHead>
                    ))}
                    <SortableHead column="createdAt" label="تاریخ عضویت" sort={sort} onSort={toggleSort} />
                    <SortableHead column="status" label="وضعیت" sort={sort} onSort={toggleSort} />
                    <TableHead scope="col" className="w-16">
                      عملیات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((user) => {
                    const statusMeta = USER_STATUS[user.status];
                    const name = `${user.firstName} ${user.lastName}`.trim() || user.email;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`${basePath}/${user.id}`}
                            className="ring-focus rounded-md hover:text-primary"
                          >
                            {name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span dir="ltr" className="inline-block max-w-56 truncate align-bottom text-muted-foreground">
                            {user.email}
                          </span>
                        </TableCell>
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            <span dir={column.ltr ? "ltr" : undefined} className="inline-block">
                              {column.value(user)}
                            </span>
                          </TableCell>
                        ))}
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <UserRowActions user={user} detailHref={`${basePath}/${user.id}`} noun={noun} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <PaginationBar view={pagination} total={sorted.length} unit={noun} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

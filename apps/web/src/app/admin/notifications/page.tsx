"use client";

import { useEffect, useMemo, useState } from "react";
import { PageShell, PageHeader, SectionTitle, MicroLabelFa } from "@/components/twilight/Page";
import { TwilightCard, RowCard, CtaButton, FilterChips, EmptyState } from "@/components/twilight/controls";
import { toast } from "sonner";
import { Send, Bell, Loader2, RotateCcw } from "lucide-react";
import {
  useBroadcastNotification,
  useBranches,
  useCreateNotification,
  useUsers,
} from "@/hooks/use-api";
import { apiErrorMessage } from "@/components/auth/auth-helpers";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { fullName } from "../_components/admin-data";
import { formatDateTime, formatPersianNumber } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type Mode = "broadcast" | "single";

const modeOptions = ["broadcast", "single"] as const;
const modeLabels: Record<Mode, string> = {
  broadcast: "ارسال همگانی",
  single: "ارسال به یک کاربر",
};

const targetOptions = [
  { value: "all", label: "همه اعضا" },
  { value: "active", label: "اعضای فعال" },
  { value: "expiring", label: "اشتراک‌های در حال انقضا" },
  { value: "coaches", label: "مربیان" },
];

/** Chip value → broadcast role filter. `expiring` has no server filter, so it reaches athletes. */
const targetRole: Record<string, UserRole | undefined> = {
  all: undefined,
  active: "athlete",
  expiring: "athlete",
  coaches: "coach",
};

interface SentLogEntry {
  id: string;
  time: string;
  title: string;
  audience: string;
  count: number;
}

const HISTORY_KEY = "admin-notification-history";
const HISTORY_LIMIT = 30;

function loadHistory(): SentLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is SentLogEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as SentLogEntry).id === "string" &&
        typeof (entry as SentLogEntry).time === "string" &&
        typeof (entry as SentLogEntry).title === "string" &&
        typeof (entry as SentLogEntry).audience === "string" &&
        typeof (entry as SentLogEntry).count === "number"
    );
  } catch {
    return [];
  }
}

function audienceLabel(target: string, branchName?: string): string {
  const group = targetOptions.find((o) => o.value === target)?.label ?? "همه اعضا";
  return branchName ? `${group} · ${branchName}` : group;
}

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none";

const errorClassName = "text-xs text-destructive";

export default function BroadcastPage() {
  const [mode, setMode] = useState<Mode>("broadcast");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [branchId, setBranchId] = useState("");
  const [userId, setUserId] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Lazy initializer: the log is read once from this browser and survives
  // navigation without a hydration round-trip.
  const [history, setHistory] = useState<SentLogEntry[]>(loadHistory);

  const branches = useBranches();
  const users = useUsers();
  const broadcast = useBroadcastNotification();
  const createNotification = useCreateNotification();

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
    } catch {
      // Private mode quota — history simply does not persist.
    }
  }, [history]);

  const pushEntry = (entry: Omit<SentLogEntry, "id" | "time">) =>
    setHistory((prev) =>
      [
        {
          ...entry,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          time: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, HISTORY_LIMIT)
    );

  const branchList = useMemo(() => branches.data?.data ?? [], [branches.data]);
  const userList = useMemo(() => users.data?.data ?? [], [users.data]);
  const pending = broadcast.isPending || createNotification.isPending;

  const validate = (single: boolean): boolean => {
    let ok = true;
    if (!title.trim()) {
      setTitleError("عنوان پیام را وارد کنید");
      ok = false;
    } else if (title.trim().length > 100) {
      setTitleError("عنوان حداکثر ۱۰۰ کاراکتر است");
      ok = false;
    } else {
      setTitleError(null);
    }
    if (!message.trim()) {
      setMessageError("متن پیام را وارد کنید");
      ok = false;
    } else if (message.trim().length > 2000) {
      setMessageError("متن حداکثر ۲۰۰۰ کاراکتر است");
      ok = false;
    } else {
      setMessageError(null);
    }
    if (single) {
      if (!userId) {
        setUserError("گیرنده را انتخاب کنید");
        ok = false;
      } else {
        setUserError(null);
      }
    }
    return ok;
  };

  const sendBroadcast = async () => {
    try {
      const branchName = branchId ? branchList.find((b) => b.id === branchId)?.name : undefined;
      const result = await broadcast.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        role: targetRole[target],
        branchId: branchId || undefined,
      });
      const count = result.data?.sent ?? 0;
      pushEntry({
        title: title.trim(),
        audience: audienceLabel(target, branchName),
        count,
      });
      toast.success(`اعلان برای ${formatPersianNumber(count)} حساب ثبت شد`);
      setTitle("");
      setMessage("");
      setTarget("all");
      setBranchId("");
      setConfirming(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, "ارسال ناموفق بود؛ متن شما حفظ شد"));
    }
  };

  const sendSingle = async () => {
    try {
      const targetUser = userList.find((u) => u.id === userId);
      await createNotification.mutateAsync({
        userId,
        title: title.trim(),
        message: message.trim(),
      });
      pushEntry({
        title: title.trim(),
        audience: targetUser ? fullName(targetUser) || targetUser.email : userId,
        count: 1,
      });
      toast.success("اعلان برای کاربر ثبت شد");
      setTitle("");
      setMessage("");
      setUserId("");
    } catch (error) {
      toast.error(apiErrorMessage(error, "ارسال ناموفق بود؛ متن شما حفظ شد"));
    }
  };

  const handleSend = () => {
    if (mode === "single") {
      if (!validate(true)) return;
      void sendSingle();
      return;
    }
    if (!validate(false)) return;
    // Broadcasts to everyone are confirmed first — they cannot be undone.
    if (target === "all") {
      setConfirming(true);
      return;
    }
    void sendBroadcast();
  };

  const branchName = branchId ? branchList.find((b) => b.id === branchId)?.name : undefined;

  return (
    <PageShell>
      <PageHeader
        title="ارسال اطلاع‌رسانی همگانی"
        subtitle="ارسال پیام به گروه خاص یا همه کاربران"
      />

      <section className="flex flex-col gap-3">
        <SectionTitle>پیام جدید</SectionTitle>
        <TwilightCard className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <MicroLabelFa>نوع ارسال</MicroLabelFa>
              <FilterChips
                pillId="admin-notifications-mode"
                options={modeOptions}
                value={mode}
                onChange={setMode}
                labels={modeLabels}
              />
            </div>

            {mode === "broadcast" ? (
              <>
                <div className="flex flex-col gap-2">
                  <MicroLabelFa>گروه دریافت‌کنندگان</MicroLabelFa>
                  <FilterChips
                    pillId="admin-notifications-filter"
                    options={targetOptions.map((o) => o.value)}
                    value={target}
                    onChange={setTarget}
                    labels={Object.fromEntries(targetOptions.map((o) => [o.value, o.label]))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="broadcast-branch">
                    <MicroLabelFa>شعبه</MicroLabelFa>
                  </label>
                  <select
                    id="broadcast-branch"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    disabled={branches.isLoading || pending}
                    className={`${inputClassName} min-h-11`}
                  >
                    <option value="">همه شعبه‌ها</option>
                    {branchList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {branches.isLoading && (
                    <p className="text-xs text-muted-foreground" aria-live="polite">
                      در حال بارگذاری فهرست شعبه‌ها…
                    </p>
                  )}
                  {branches.isError && (
                    <div className="flex flex-wrap items-center gap-2">
                      <p role="alert" className={`${errorClassName} flex-1`}>
                        فهرست شعبه‌ها بارگذاری نشد؛ اعلان بدون فیلتر شعبه ارسال می‌شود.
                      </p>
                      <button
                        type="button"
                        onClick={() => void branches.refetch()}
                        disabled={branches.isFetching}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-muted px-4 text-xs font-bold text-foreground"
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                        تلاش دوباره
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <label htmlFor="single-user">
                  <MicroLabelFa>گیرنده</MicroLabelFa>
                </label>
                <select
                  id="single-user"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    if (userError) setUserError(null);
                  }}
                  disabled={users.isLoading || pending}
                  aria-invalid={userError ? "true" : "false"}
                  className={`${inputClassName} min-h-11`}
                >
                  <option value="">انتخاب کاربر</option>
                  {userList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {fullName(u) || u.email}
                    </option>
                  ))}
                </select>
                {userError && (
                  <p role="alert" className={errorClassName}>
                    {userError}
                  </p>
                )}
                {users.isLoading && (
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    در حال بارگذاری فهرست کاربران…
                  </p>
                )}
                {users.isError && (
                  <div className="flex flex-wrap items-center gap-2">
                    <p role="alert" className={`${errorClassName} flex-1`}>
                      فهرست کاربران بارگذاری نشد؛ بدون آن نمی‌توان گیرنده انتخاب کرد.
                    </p>
                      <button
                        type="button"
                        onClick={() => void users.refetch()}
                        disabled={users.isFetching}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-muted px-4 text-xs font-bold text-foreground"
                      >
                      <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                      تلاش دوباره
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="broadcast-title">
                <MicroLabelFa>عنوان پیام</MicroLabelFa>
              </label>
              <input
                id="broadcast-title"
                type="text"
                placeholder="مثلاً: اطلاعیه تعطیلی باشگاه"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                maxLength={100}
                disabled={pending}
                aria-invalid={titleError ? "true" : "false"}
                className={`${inputClassName} min-h-11`}
              />
              {titleError && (
                <p role="alert" className={errorClassName}>
                  {titleError}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="message">
                <MicroLabelFa>متن پیام</MicroLabelFa>
              </label>
              <textarea
                id="message"
                placeholder="متن پیام خود را وارد کنید..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (messageError) setMessageError(null);
                }}
                rows={5}
                maxLength={2000}
                disabled={pending}
                aria-invalid={messageError ? "true" : "false"}
                className={`${inputClassName} h-auto min-h-11 py-3 leading-relaxed`}
              />
              {messageError && (
                <p role="alert" className={errorClassName}>
                  {messageError}
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <CtaButton
                onClick={handleSend}
                disabled={!title.trim() || !message.trim() || pending}
                className="w-auto px-8"
              >
                {pending ? (
                  <Loader2 strokeWidth={1.75} className="h-4 w-4 animate-spin" />
                ) : (
                  <Send strokeWidth={1.75} className="h-4 w-4" />
                )}
                {mode === "single" ? "ارسال به کاربر" : "ارسال پیام"}
              </CtaButton>
            </div>
          </div>
        </TwilightCard>
      </section>

      <section className="flex flex-col gap-3" aria-live="polite">
        <SectionTitle>پیام‌های ارسال شده</SectionTitle>
        {history.length === 0 ? (
          <EmptyState
            tone="blush"
            icon={<Bell strokeWidth={1.75} className="h-5 w-5" />}
            title="پیام ارسال‌شده‌ای نیست"
            description="هنوز هیچ اطلاع‌رسانی همگانی ارسال نشده است"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {history.map((item) => (
              <RowCard
                key={item.id}
                icon={<Bell strokeWidth={1.75} className="h-4 w-4" />}
                title={item.title}
                subtitle={`${item.audience} · ${formatDateTime(item.time)}`}
                trailing={
                  <span className="text-xs text-primary">
                    {formatPersianNumber(item.count)} گیرنده
                  </span>
                }
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open) setConfirming(false);
        }}
        title="ارسال اعلان همگانی"
        description={`«${title.trim()}» برای ${audienceLabel(target, branchName)} ثبت می‌شود و قابل بازگشت نیست. ادامه می‌دهید؟`}
        confirmLabel="تأیید و ارسال"
        loading={broadcast.isPending}
        onConfirm={() => void sendBroadcast()}
      />
    </PageShell>
  );
}

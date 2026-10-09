"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  Download,
  KeyRound,
  LogOut,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  useAthleteDashboard,
  useChangePassword,
  useCoachDashboard,
  useDashboardStats,
  useTrainingPrograms,
  useUpdateProfile,
  useUsers,
} from "@/hooks/use-api";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  formatDate,
  formatPersianNumber,
  validateIranianPhone,
} from "@/lib/utils";
import type { NavItem } from "@/components/layout/nav-items";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "نام را وارد کنید").max(50, "نام طولانی‌تر از حد مجاز است"),
  lastName: z
    .string()
    .trim()
    .min(1, "نام خانوادگی را وارد کنید")
    .max(50, "نام خانوادگی طولانی‌تر از حد مجاز است"),
  phone: z
    .string()
    .trim()
    .max(20, "شماره موبایل طولانی است")
    .refine((value) => value === "" || validateIranianPhone(value), "شماره موبایل معتبر وارد کنید."),
  avatarUrl: z
    .string()
    .trim()
    .max(2000, "نشانی تصویر طولانی است")
    .refine((value) => value === "" || /^https?:\/\/.+/.test(value), "نشانی تصویر باید با http شروع شود."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "رمز فعلی را وارد کنید"),
    newPassword: z
      .string()
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر و شامل حرف و رقم باشد.")
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "رمز عبور باید حداقل ۸ کاراکتر و شامل حرف و رقم باشد."),
    confirmPassword: z.string().min(1, "تکرار رمز عبور را وارد کنید"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "تکرار رمز عبور یکسان نیست.",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface NotifPrefs {
  workout: boolean;
  membership: boolean;
  coach: boolean;
}

const NOTIF_PREFS_KEY = "portal-notif-prefs";
const DEFAULT_NOTIF_PREFS: NotifPrefs = { workout: true, membership: true, coach: false };

function loadNotifPrefs(): NotifPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIF_PREFS;
  try {
    const raw = window.localStorage.getItem(NOTIF_PREFS_KEY);
    if (!raw) return DEFAULT_NOTIF_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotifPrefs>;
    return {
      workout: typeof parsed.workout === "boolean" ? parsed.workout : DEFAULT_NOTIF_PREFS.workout,
      membership:
        typeof parsed.membership === "boolean" ? parsed.membership : DEFAULT_NOTIF_PREFS.membership,
      coach: typeof parsed.coach === "boolean" ? parsed.coach : DEFAULT_NOTIF_PREFS.coach,
    };
  } catch {
    return DEFAULT_NOTIF_PREFS;
  }
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function PortalProfile({ navItems }: { navItems: NavItem[] }) {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const dashboard = useAthleteDashboard(user?.role === "athlete" ? user.id : undefined);
  const coachDashboard = useCoachDashboard(user?.role === "coach" ? user.id : undefined);
  const dashboardStats = useDashboardStats();
  const usersQuery = useUsers();
  const programs = useTrainingPrograms();
  const update = useUpdateProfile();
  const changePassword = useChangePassword();
  const [panel, setPanel] = useState<"profile" | "password" | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [prefs, setPrefs] = useState<NotifPrefs>(() => loadNotifPrefs());

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
      avatarUrl: user?.avatarUrl ?? "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!user) return;
    profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      avatarUrl: user.avatarUrl ?? "",
    });
  }, [user, profileForm]);

  useEffect(() => {
    if (panel === "password") {
      passwordForm.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
    setSubmitError("");
  }, [panel, passwordForm]);

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Private mode — preferences still apply for this session.
    }
  }, [prefs]);

  const programList = useMemo(() => programs.data?.data ?? [], [programs.data]);
  const coachData = coachDashboard.data?.data;
  const adminStats = dashboardStats.data?.data;
  const stats = dashboard.data?.data?.stats;
  const membership = dashboard.data?.data?.membership;
  const allUsers = useMemo(() => usersQuery.data?.data ?? [], [usersQuery.data]);
  const watchedAvatar = profileForm.watch("avatarUrl");

  const roleStats = useMemo(() => {
    if (!user) return [];
    if (user.role === "coach") {
      return [
        {
          label: "شاگردان",
          value: coachData?.totalAthletes ?? coachData?.athletesCount ?? 0,
        },
        {
          label: "برنامه فعال",
          value:
            coachData?.activePrograms ??
            programList.filter((p) => p.status === "active").length,
        },
        { label: "جلسه امروز", value: coachData?.todaySessions ?? 0 },
      ];
    }
    if (user.role === "admin" || user.role === "receptionist") {
      const memberCount =
        adminStats?.activeMembers ??
        adminStats?.totalMembers ??
        allUsers.filter((u) => u.role === "athlete").length;
      const coachCount =
        adminStats?.totalCoaches ?? allUsers.filter((u) => u.role === "coach").length;
      return [
        { label: "اعضای فعال", value: memberCount },
        { label: "مربیان", value: coachCount },
        { label: "عضویت فعال", value: adminStats?.activeMemberships ?? 0 },
      ];
    }
    return [
      {
        label: "جلسه تمرین",
        value:
          stats?.totalSessions ?? programList.filter((p) => p.status === "active").length,
      },
      { label: "رکورد پیوستگی", value: stats?.longestStreak ?? programList.length },
      {
        label: "برنامه تکمیل",
        value: programList.filter((p) => p.status === "completed").length,
      },
    ];
  }, [user, coachData, programList, stats, adminStats, allUsers]);

  if (!user) return null;

  const root = navItems[0].href;
  const fullName = `${user.firstName} ${user.lastName}`;
  const initial = [user.firstName[0], user.lastName[0]].join(" ");
  const list = programList;
  const avatarPreview = watchedAvatar?.trim() || user.avatarUrl || "";

  async function saveProfile(values: ProfileFormValues) {
    setSubmitError("");
    try {
      const response = await update.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        avatarUrl: values.avatarUrl.trim(),
      });
      if (response.data) updateUser(response.data);
      toast.success("تغییرات ذخیره شد");
      setPanel(null);
    } catch {
      setSubmitError("ذخیره تغییرات ناموفق بود؛ اطلاعات را بررسی کنید.");
    }
  }

  async function savePassword(values: PasswordFormValues) {
    setSubmitError("");
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      logout();
      toast.success("رمز عبور تغییر کرد؛ با رمز جدید وارد شوید");
      setPanel(null);
      router.replace("/auth/login");
    } catch {
      setSubmitError("ذخیره تغییرات ناموفق بود؛ اطلاعات را بررسی کنید.");
    }
  }

  function downloadHistory() {
    try {
      setExportStatus("");
      const headers = [
        "نام برنامه",
        "حرکت",
        "ست",
        "تکرار",
        "وزن (کیلوگرم)",
        "ست انجام‌شده",
        "وضعیت",
        "تاریخ تکمیل",
      ];
      const rows: string[][] = [];
      for (const program of list) {
        for (const exercise of program.exercises) {
          rows.push([
            program.name,
            exercise.exercise?.name ?? "حرکت تمرینی",
            String(exercise.sets),
            String(exercise.reps),
            exercise.actualWeight != null
              ? String(exercise.actualWeight)
              : exercise.weight != null
                ? String(exercise.weight)
                : "",
            exercise.actualSets != null ? String(exercise.actualSets) : "",
            exercise.isCompleted ? "تکمیل‌شده" : "باز",
            exercise.completedAt ? formatDate(exercise.completedAt) : "",
          ]);
        }
      }
      if (!rows.length) {
        setExportStatus("تاریخچه‌ای برای خروجی وجود ندارد.");
        return;
      }
      const csv =
        "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "workout-history.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportStatus(`خروجی تاریخچه تمرین با ${formatPersianNumber(rows.length)} ردیف دانلود شد.`);
      toast.success("خروجی تاریخچه تمرین دانلود شد");
    } catch {
      setExportStatus("ساخت خروجی ناموفق بود؛ دوباره تلاش کنید.");
    }
  }

  const notifRows: { key: keyof NotifPrefs; label: string; hint: string }[] = [
    { key: "workout", label: "یادآوری تمرین", hint: "یادآوری جلسه‌ها و برنامه هفتگی" },
    { key: "membership", label: "یادآوری اشتراک", hint: "اتمام اشتراک و پرداخت‌ها" },
    { key: "coach", label: "پیام مربی", hint: "بازخورد و برنامه تازه مربی" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-center pt-2 text-center">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-primary bg-secondary text-2xl text-primary">
            {avatarPreview ? (
              <AvatarImage src={avatarPreview} alt={`تصویر ${fullName}`} />
            ) : null}
            <AvatarFallback className="bg-secondary text-2xl text-primary">{initial}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-solid text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
        </div>
        <h1 className="mt-3.5 !text-2xl">{fullName}</h1>
        <p className="twilight-caption mt-1">
          {user.role === "athlete"
            ? "ورزشکار"
            : user.role === "coach"
              ? "مربی باشگاه"
              : "مدیریت باشگاه"}{" "}
          · عضو از {formatDate(user.createdAt)}
        </p>
      </header>
      <div
        className="flex items-center justify-around border-y border-border px-2 py-3"
        aria-live="polite"
      >
        {roleStats.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-1 flex-col items-center ${i ? "border-s border-border" : ""}`}
          >
            <span className="text-xl">{formatPersianNumber(s.value)}</span>
            <span className="twilight-caption !text-[10px]">{s.label}</span>
          </div>
        ))}
      </div>
      <section className="twilight-card space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="!font-sans !text-sm !font-semibold">
              {membership?.plan?.name ??
                (user.role === "athlete"
                  ? "عضویت باشگاه"
                  : "حساب حرفه‌ای باشگاه")}
            </h2>
            <p className="twilight-caption mt-0.5">
              {membership
                ? `${formatPersianNumber(membership.sessionsRemaining)} جلسه باقیمانده · تا ${formatDate(membership.endDate)}`
                : "مدیریت برنامه‌ها و امکانات حساب"}
            </p>
          </div>
        </div>
        <Button asChild className="w-full !rounded-xl !text-xs">
          <Link
            href={
              user.role === "athlete"
                ? "/athlete/membership"
                : `${root}/${user.role === "coach" ? "programs" : "settings"}`
            }
          >
            {user.role === "athlete"
              ? "مدیریت و تمدید اشتراک باشگاه"
              : "مدیریت باشگاه و برنامه‌ها"}
          </Link>
        </Button>
      </section>
      <section className="space-y-3">
        <h2 className="!font-sans !text-[10px] !font-semibold text-muted-foreground">
          تنظیمات حساب و باشگاه
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
          {[
            {
              id: "profile" as const,
              label: "ویرایش اطلاعات شخصی",
              icon: UserRound,
            },
            {
              id: "password" as const,
              label: "امنیت و رمز عبور",
              icon: KeyRound,
            },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setSubmitError("");
                setPanel(id);
              }}
              aria-label={label}
              className="ring-focus flex min-h-11 w-full items-center justify-between px-4 py-3.5 text-xs hover:bg-secondary"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </span>
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          {navItems
            .filter((i) => i.href !== root && !i.href.endsWith("/profile"))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="ring-focus flex min-h-11 items-center justify-between px-4 py-3.5 text-xs hover:bg-secondary"
              >
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
        </div>
      </section>
      <section className="twilight-card space-y-3">
        <div>
          <h2 className="!font-sans !text-xs !font-semibold">ترجیحات اطلاع‌رسانی</h2>
          <p className="twilight-caption mt-1">
            این تنظیمات فقط روی همین دستگاه ذخیره می‌شود و به سامانه ارسال نمی‌شود.
          </p>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {notifRows.map((row) => (
            <label
              key={row.key}
              htmlFor={`notif-${row.key}`}
              className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3"
            >
              <span>
                <span className="block text-xs font-medium">{row.label}</span>
                <span className="twilight-caption mt-0.5 block">{row.hint}</span>
              </span>
              <Switch
                id={`notif-${row.key}`}
                checked={prefs[row.key]}
                onCheckedChange={(checked) =>
                  setPrefs((current) => ({ ...current, [row.key]: checked }))
                }
                aria-label={row.label}
              />
            </label>
          ))}
        </div>
      </section>
      <div className="space-y-2">
        <button
          onClick={downloadHistory}
          disabled={programs.isLoading || !list.length}
          aria-label="دانلود تاریخچه تمرین با فرمت CSV"
          className="twilight-card ring-focus flex min-h-11 w-full items-center justify-between !p-3.5 text-xs disabled:opacity-50"
        >
          <span className="flex items-center gap-2.5">
            <Download className="h-4 w-4 text-primary" />
            دانلود تاریخچه تمرین (CSV)
          </span>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        {exportStatus && (
          <p className="twilight-caption" role="status" aria-live="polite">
            {exportStatus}
          </p>
        )}
      </div>
      <button
        onClick={logout}
        aria-label="خروج از حساب"
        className="ring-focus flex min-h-11 w-full items-center justify-center gap-2 rounded-xl py-3 text-xs text-muted-foreground"
      >
        <LogOut className="h-4 w-4" />
        خروج از حساب
      </button>
      <Sheet
        open={!!panel}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        title={panel === "profile" ? "ویرایش اطلاعات شخصی" : "تغییر رمز عبور"}
        description="اطلاعات حساب شما"
      >
        {panel === "profile" ? (
          <form
            onSubmit={profileForm.handleSubmit(saveProfile)}
            className="space-y-4"
            key="profile"
            noValidate
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border border-border bg-secondary text-lg text-primary">
                {avatarPreview ? <AvatarImage src={avatarPreview} alt="پیش‌نمایش تصویر پروفایل" /> : null}
                <AvatarFallback className="bg-secondary text-lg text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <p className="twilight-caption" aria-live="polite">
                {avatarPreview ? "پیش‌نمایش تصویر پروفایل" : "بدون تصویر — حروف اول نام نمایش داده می‌شود"}
              </p>
            </div>
            <Input
              id="profile-first-name"
              label="نام"
              required
              error={profileForm.formState.errors.firstName?.message}
              disabled={update.isPending}
              {...profileForm.register("firstName")}
            />
            <Input
              id="profile-last-name"
              label="نام خانوادگی"
              required
              error={profileForm.formState.errors.lastName?.message}
              disabled={update.isPending}
              {...profileForm.register("lastName")}
            />
            <Input
              id="profile-phone"
              label="شماره موبایل"
              type="tel"
              inputMode="tel"
              dir="ltr"
              error={profileForm.formState.errors.phone?.message}
              hint="مثل 09123456789"
              disabled={update.isPending}
              {...profileForm.register("phone")}
            />
            <Input
              id="profile-avatar"
              label="نشانی تصویر پروفایل"
              type="url"
              inputMode="url"
              dir="ltr"
              placeholder="https://…"
              error={profileForm.formState.errors.avatarUrl?.message}
              hint="اختیاری — پیوند مستقیم تصویر"
              disabled={update.isPending}
              {...profileForm.register("avatarUrl")}
            />
            <p className="twilight-caption" dir="ltr">
              {user.email}
            </p>
            {submitError && (
              <p role="alert" className="text-xs text-destructive">
                {submitError}
              </p>
            )}
            <Button type="submit" loading={update.isPending} className="w-full">
              ذخیره تغییرات
            </Button>
          </form>
        ) : (
          <form
            onSubmit={passwordForm.handleSubmit(savePassword)}
            className="space-y-4"
            key="password"
            noValidate
          >
            <p className="twilight-caption">
              بعد از تغییر رمز، از حساب خارج می‌شوید و باید با رمز تازه وارد شوید.
            </p>
            <Input
              id="password-current"
              label="رمز فعلی"
              type="password"
              autoComplete="current-password"
              required
              error={passwordForm.formState.errors.currentPassword?.message}
              disabled={changePassword.isPending}
              {...passwordForm.register("currentPassword")}
            />
            <Input
              id="password-new"
              label="رمز جدید"
              type="password"
              autoComplete="new-password"
              required
              error={passwordForm.formState.errors.newPassword?.message}
              hint="حداقل ۸ کاراکتر، شامل حرف و رقم"
              disabled={changePassword.isPending}
              {...passwordForm.register("newPassword")}
            />
            <Input
              id="password-confirm"
              label="تکرار رمز جدید"
              type="password"
              autoComplete="new-password"
              required
              error={passwordForm.formState.errors.confirmPassword?.message}
              disabled={changePassword.isPending}
              {...passwordForm.register("confirmPassword")}
            />
            {submitError && (
              <p role="alert" className="text-xs text-destructive">
                {submitError}
              </p>
            )}
            <Button type="submit" loading={changePassword.isPending} className="w-full">
              ذخیره تغییرات
            </Button>
          </form>
        )}
      </Sheet>
    </div>
  );
}

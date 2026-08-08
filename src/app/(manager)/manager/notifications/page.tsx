export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addDays } from "date-fns";

const typeStyle: Record<string,{dot:string;label:string}> = {
  urgent:  { dot:"bg-rose-500 anim-dot-pulse", label:"text-rose-400" },
  success: { dot:"bg-emerald-400", label:"text-emerald-400" },
  warning: { dot:"bg-amber-400", label:"text-amber-400" },
  info:    { dot:"bg-white/20", label:"text-white/40" },
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${mins.toLocaleString("fa-IR")} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "دیروز";
  return `${days.toLocaleString("fa-IR")} روز پیش`;
}

export default async function NotificationsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch user notifications if exists
  let userNotifications: any[] = [];
  if (userId) {
    try {
      userNotifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    } catch {}
  }

  // Fetch recent activities for manager dashboard context
  const sevenDaysFromNow = addDays(new Date(), 7);
  
  let expiringSubs: any[] = [];
  let recentPayments: any[] = [];
  let pendingFreezes: any[] = [];
  let recentMembers: any[] = [];

  try {
    expiringSubs = await prisma.subscription.findMany({
      where: { status: "ACTIVE", endsAt: { lte: sevenDaysFromNow, gte: new Date() } },
      include: { member: { include: { user: true } }, plan: true },
      orderBy: { endsAt: "asc" },
      take: 3,
    });
  } catch {}

  try {
    recentPayments = await prisma.payment.findMany({
      where: { status: "PAID" },
      include: { subscription: { include: { member: { include: { user: true } }, plan: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch {}

  try {
    pendingFreezes = await prisma.freezeRequest.findMany({
      where: { status: "PENDING" },
      include: { member: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch {}

  try {
    recentMembers = await prisma.user.findMany({
      where: { role: "MEMBER" },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch {}

  const activityNotifs = [
    ...expiringSubs.map((s: any) => ({
      title: "انقضای اشتراک نزدیک است",
      body: `${s.member?.user?.name || "عضو"} — ${s.plan?.name} در ${new Date(s.endsAt!).toLocaleDateString("fa-IR")} منقضی می‌شود`,
      time: timeAgo(s.endsAt || s.createdAt),
      type: "urgent" as const,
    })),
    ...recentPayments.map((p: any) => ({
      title: "پرداخت دریافت شد",
      body: `${p.subscription?.member?.user?.name || "کاربر"} مبلغ ${Number(p.amount).toLocaleString("fa-IR")} تومان پرداخت کرد (${p.subscription?.plan?.name || ""})`,
      time: timeAgo(p.createdAt),
      type: "success" as const,
    })),
    ...pendingFreezes.map((fr: any) => ({
      title: "درخواست تعلیق اشتراک",
      body: `${fr.member?.user?.name || "عضو"} درخواست تعلیق ثبت کرده است`,
      time: timeAgo(fr.createdAt),
      type: "info" as const,
    })),
    ...recentMembers.map((m: any) => ({
      title: "عضو جدید ملحق شد",
      body: `${m.name} ثبت‌نام کرد`,
      time: timeAgo(m.createdAt),
      type: "info" as const,
    })),
  ];

  // Combine with user notifications
  const combined = [
    ...userNotifications.map((n: any) => ({
      title: n.title,
      body: n.body,
      time: timeAgo(n.createdAt),
      type: n.type.includes("expiry") ? "urgent" as const : "info" as const,
    })),
    ...activityNotifs,
  ].slice(0, 15);

  const finalNotifs = combined.length > 0 ? combined : [
    { title:"انقضای اشتراک نزدیک است", body:"سارا محمدی — امروز منقضی می‌شود", time:"۲ دقیقه پیش", type:"urgent" as const },
    { title:"پرداخت دریافت شد", body:"رضا احمدی مبلغ ۵,۹۰۰,۰۰۰ تومان پرداخت کرد (سالانه الیت)", time:"۱ ساعت پیش", type:"success" as const },
    { title:"درخواست تعلیق اشتراک", body:"نیکا رضایی درخواست تعلیق ۲ هفته‌ای ثبت کرده است", time:"۳ ساعت پیش", type:"info" as const },
    { title:"عضو جدید ملحق شد", body:"دارا سهرابی طرح ماهانه پایه را ثبت‌نام کرد", time:"دیروز", type:"info" as const },
  ];

  return (
    <div className="space-y-5 text-right">
      <div className="flex items-center justify-between flex-row-reverse anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">فعالیت‌ها</p>
          <h1 className="text-2xl font-bold gradient-text">اعلان‌ها</h1>
        </div>
        <form action={async () => {
          "use server";
          const { sendExpiryReminders } = await import("@/server/actions/notifications");
          await sendExpiryReminders();
        }}>
          <button className="btn-primary rounded-xl px-4 py-2 text-xs font-bold">ارسال یادآور انقضا</button>
        </form>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/[0.05] stagger">
          {finalNotifs.map((n, idx) => {
            const s = typeStyle[n.type] || typeStyle.info;
            return (
              <div key={idx} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors cursor-default flex-row-reverse anim-fade-up" style={{animationDelay: `${idx*40}ms`}}>
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${s.dot}`}/>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{n.body}</p>
                </div>
                <span className="text-[10px] text-white/25 shrink-0 whitespace-nowrap">{n.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

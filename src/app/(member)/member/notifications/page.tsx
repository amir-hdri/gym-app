export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ts: Record<string,{dot:string}> = {
  urgent:  {dot:"bg-rose-500 anim-dot-pulse"},
  success: {dot:"bg-emerald-400"},
  info:    {dot:"bg-bubblegum_pink"},
  warning: {dot:"bg-amber-400"},
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${mins.toLocaleString("fa-IR")} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days === 0) return "امروز";
  if (days === 1) return "دیروز";
  return `${days.toLocaleString("fa-IR")} روز پیش`;
}

export default async function MemberNotificationsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let notifications: any[] = [];
  let memberProfile: any = null;

  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { memberProfile: { include: { subscriptions: { include: { plan: true }, orderBy: { endsAt: "asc" } } } } },
      });
      memberProfile = user?.memberProfile;
      notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    } catch {}
  }

  // Generate dynamic notifications based on subscription status
  const dynamicNotifs: any[] = [];

  if (memberProfile) {
    const activeSub = memberProfile.subscriptions?.find((s: any) => s.status === "ACTIVE");
    if (activeSub?.endsAt) {
      const ends = new Date(activeSub.endsAt);
      const diffDays = Math.ceil((ends.getTime() - Date.now()) / (1000*60*60*24));
      if (diffDays <= 7 && diffDays >= 0) {
        dynamicNotifs.push({
          title: "انقضای نزدیک اشتراک",
          body: `اشتراک ${activeSub.plan?.name} شما ${diffDays === 0 ? "امروز" : `${diffDays.toLocaleString("fa-IR")} روز دیگر`} منقضی می‌شود. هم‌اکنون تمدید کنید.`,
          time: "امروز",
          type: "urgent",
          createdAt: new Date(),
        });
      }
    }

    // Check upcoming classes
    try {
      const upcomingBookings = await prisma.classBooking.findMany({
        where: { memberId: memberProfile.id, status: "BOOKED" },
        include: { classSession: true },
        orderBy: { classSession: { startAt: "asc" } },
        take: 2,
      });
      upcomingBookings.forEach((b: any) => {
        const start = new Date(b.classSession.startAt);
        const isToday = start.toDateString() === new Date().toDateString();
        if (isToday || start > new Date()) {
          dynamicNotifs.push({
            title: isToday ? "یادآور کلاس ورزشی" : "تایید رزرو کلاس",
            body: `کلاس ${b.classSession.title} — ${start.toLocaleDateString("fa-IR")} ساعت ${start.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`,
            time: isToday ? "امروز" : "به زودی",
            type: isToday ? "info" : "success",
            createdAt: b.bookedAt,
          });
        }
      });
    } catch {}

    // Recent payments
    try {
      const payments = await prisma.payment.findMany({
        where: { subscription: { memberId: memberProfile.id }, status: "PAID" },
        orderBy: { paidAt: "desc" },
        take: 2,
        include: { subscription: { include: { plan: true } } },
      });
      payments.forEach((p: any) => {
        dynamicNotifs.push({
          title: "پرداخت موفق دریافت شد",
          body: `مبلغ ${Number(p.amount).toLocaleString("fa-IR")} تومان برای ${p.subscription?.plan?.name || "اشتراک"} دریافت شد.`,
          time: timeAgo(p.paidAt || p.createdAt),
          type: "success",
          createdAt: p.paidAt || p.createdAt,
        });
      });
    } catch {}
  }

  const allNotifs = [
    ...notifications.map((n: any) => ({
      title: n.title,
      body: n.body,
      time: timeAgo(n.createdAt),
      type: n.type.includes("expiry") || n.type.includes("urgent") ? "urgent" : n.type.includes("success") ? "success" : "info",
      createdAt: n.createdAt,
      read: !!n.readAt,
    })),
    ...dynamicNotifs,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const finalNotifs = allNotifs.length > 0 ? allNotifs.slice(0, 20) : [
    { title:"انقضای نزدیک اشتراک", body:"اشتراک ماهانه پرمیوم شما ۷ روز دیگر منقضی می‌شود. هم‌اکنون تمدید کنید.", time:"امروز", type:"urgent" },
    { title:"یادآور کلاس ورزشی", body:"کلاس یوگای صبحگاهی تا ۱ ساعت دیگر شروع می‌شود.", time:"امروز", type:"info" },
    { title:"تایید رزرو کلاس", body:"کلاس تمرینات HIIT — فردا ساعت ۱۰:۰۰ صبح.", time:"دیروز", type:"success" },
    { title:"پرداخت موفق دریافت شد", body:"مبلغ ۶۵۰,۰۰۰ تومان برای اشتراک خرداد ماه دریافت شد.", time:"۳۰ خرداد", type:"success" },
  ];

  return (
    <div className="space-y-4 text-right">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">فعالیت‌ها</p>
        <h1 className="text-2xl font-bold gradient-text">اعلان‌ها</h1>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/[0.05] stagger">
          {finalNotifs.map((n, idx) => {
            const s = ts[n.type] || ts.info;
            return (
              <div key={idx} className={`flex items-start gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors cursor-default flex-row-reverse anim-fade-up ${n.read === false ? "bg-white/[0.02]" : ""}`} style={{animationDelay: `${idx*30}ms`}}>
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

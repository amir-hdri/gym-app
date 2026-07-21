import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

function KPI({ label, value, hint, delta, accent, iconPath }: {
  label: string; value: string; hint: string; delta: string;
  accent: string; iconPath: string;
}) {
  return (
    <div className="glass-card p-5 relative overflow-hidden anim-fade-up">
      <div className={`absolute top-0 right-0 w-0.5 h-full rounded-r-xl ${accent}`}/>
      <div className="absolute top-0 left-0 right-0 h-px" style={{background:"linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)"}}/>
      <div className="pr-2.5 text-right">
        <div className="flex items-center gap-2 mb-2.5">
          <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d={iconPath}/>
          </svg>
          <span className="text-[10px] text-white/40 font-medium">{label}</span>
        </div>
        <p className="text-2xl font-bold tracking-tight" style={{background:"linear-gradient(135deg,#fff 60%,rgba(255,255,255,.4))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{value}</p>
        <p className="text-[10px] text-white/25 mt-1">{hint}</p>
      </div>
      <span className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.07] text-white/60" dir="ltr">{delta}</span>
    </div>
  );
}

export default async function ManagerDashboard() {
  // Query actual counts
  const totalMembers = await prisma.user.count({
    where: { role: "MEMBER", isActive: true }
  });

  // Calculate earnings this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const paymentsThisMonth = await prisma.payment.findMany({
    where: { status: "PAID", paidAt: { gte: startOfMonth } }
  });
  const monthlyEarnings = paymentsThisMonth.reduce((sum, p) => sum + Number(p.amount), 0);

  // Expiring subs in 7 days
  const sevenDaysFromNow = addDays(new Date(), 7);
  const expiringSubsCount = await prisma.subscription.count({
    where: { status: "ACTIVE", endsAt: { lte: sevenDaysFromNow, gte: new Date() } }
  });

  // Today's checkins
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayCheckinsCount = await prisma.attendance.count({
    where: { checkInAt: { gte: startOfToday } }
  });

  // Get list of expiring subscriptions
  const expiringSubs = await prisma.subscription.findMany({
    where: { status: "ACTIVE", endsAt: { lte: sevenDaysFromNow, gte: new Date() } },
    include: { member: { include: { user: true } }, plan: true },
    orderBy: { endsAt: "asc" },
    take: 5
  });

  // Get recent payments
  const recentPayments = await prisma.payment.findMany({
    include: {
      subscription: {
        include: { member: { include: { user: true } }, plan: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const methodTranslate: Record<string, string> = {
    CASH: "نقدی",
    CARD: "کارت بانکی",
    TRANSFER: "کارت به کارت",
    WALLET: "کیف پول",
    ONLINE: "درگاه آنلاین",
    OTHER: "سایر",
  };

  return (
    <div className="space-y-5">
      <div className="anim-fade-up text-right">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">نمای کلی</p>
        <h1 className="text-2xl font-bold" style={{background:"linear-gradient(135deg,#fff 50%,rgba(255,255,255,.35))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>داشبورد مدیریت</h1>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KPI label="اعضای فعال" value={`${totalMembers.toLocaleString("fa-IR")} نفر`} hint="ثبت‌نام شده در سامانه" delta="+۱.۲%" accent="bg-blue-500" iconPath="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0"/>
        <KPI label="درآمد ماه جاری" value={`${monthlyEarnings.toLocaleString("fa-IR")} تومان`} hint="پرداخت‌های نهایی این ماه" delta="+۸.۵%" accent="bg-emerald-500" iconPath="M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        <KPI label="اشتراک‌های رو به اتمام" value={`${expiringSubsCount.toLocaleString("fa-IR")} مورد`} hint="نیازمند یادآوری و تمدید" delta="-۲" accent="bg-amber-400" iconPath="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z M12 6v6l4 2"/>
        <KPI label="حضورهای امروز" value={`${todayCheckinsCount.toLocaleString("fa-IR")} بار`} hint="ورودهای ثبت شده امروز" delta="+۵.۳%" accent="bg-violet-500" iconPath="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01"/>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Expiring List */}
        <div className="glass-card overflow-hidden anim-fade-up text-right" style={{animationDelay:"200ms"}}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-row-reverse">
            <h3 className="text-sm font-semibold">اشتراک‌های در حال انقضا</h3>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">۷ روز آینده</span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {expiringSubs.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/30">هیچ اشتراکی در حال انقضا نیست.</div>
            ) : (
              expiringSubs.map(item => {
                const endsDate = new Date(item.endsAt!);
                const now = new Date();
                const diffDays = Math.ceil((endsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = diffDays <= 1;
                
                return (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.025] transition-colors flex-row-reverse">
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isUrgent ? "bg-rose-500 anim-dot-pulse" : "bg-amber-400"}`}/>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.member.user.name}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{item.plan.name}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${isUrgent ? "text-rose-400 font-bold" : "text-amber-400"}`}>
                      {diffDays === 0 ? "امروز" : `${diffDays.toLocaleString("fa-IR")} روز دیگر`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Payments List */}
        <div className="glass-card overflow-hidden anim-fade-up text-right" style={{animationDelay:"280ms"}}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-row-reverse">
            <h3 className="text-sm font-semibold">پرداخت‌های اخیر</h3>
            <span className="text-[10px] text-white/30">آخرین تراکنش‌ها</span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {recentPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/30">پرداختی ثبت نشده است.</div>
            ) : (
              recentPayments.map(p => {
                const name = p.subscription?.member?.user?.name || "کاربر ناشناس";
                const initials = name.substring(0, 2);
                const methodStr = methodTranslate[p.method] || p.method;
                const isPaid = p.status === "PAID";
                
                return (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.025] transition-colors flex-row-reverse">
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-rose-500/10 text-rose-400 border border-rose-500/20">{initials}</div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{methodStr}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{Number(p.amount).toLocaleString("fa-IR")} تومان</p>
                      <p className={`text-[10px] mt-0.5 ${isPaid ? "text-emerald-400 font-bold" : "text-amber-400"}`}>
                        {isPaid ? "پرداخت شده" : "در انتظار تایید"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { getMember } from "@/server/actions/members";
import { getWorkoutRoutine } from "@/server/actions/workouts";
import { redirect } from "next/navigation";
import Link from "next/link";
import WorkoutTodoList from "@/components/WorkoutTodoList";

export default async function MemberDashboard() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const member = JSON.parse(JSON.stringify(await getMember(session.user.id)));
  const name = member?.name || "کاربر باشگاه";
  const profile = member?.memberProfile;
  
  // Find active subscription
  const activeSub = profile?.subscriptions?.find((s: any) => s.status === "ACTIVE");
  const planName = activeSub?.plan?.name || "بدون اشتراک فعال";
  
  // Calculate remaining days
  let expiryDateFarsi = "---";
  let remainingDaysText = "فاقد اشتراک";
  let progressWidth = "0%";
  let remainingDaysVal = 0;
  
  if (activeSub?.endsAt) {
    const ends = new Date(activeSub.endsAt);
    const start = activeSub.startedAt ? new Date(activeSub.startedAt) : new Date();
    const now = new Date();
    
    expiryDateFarsi = ends.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
    
    const totalDays = Math.ceil((ends.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 30;
    remainingDaysVal = Math.max(0, Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    remainingDaysText = `${remainingDaysVal.toLocaleString("fa-IR")} روز باقی‌مانده`;
    progressWidth = `${Math.min(100, Math.max(0, (remainingDaysVal / totalDays) * 100))}%`;
  }

  // Count classes, payments, progress metrics dynamically
  const attendanceCount = profile?.attendance?.length || 0;
  const progressCount = profile?.progressEntries?.length || 0;
  const pendingPayments = profile?.subscriptions?.flatMap((s: any) => s.payments)?.filter((p: any) => p.status === "PENDING")?.length || 0;

  // Fetch workout routine
  const routine = JSON.parse(JSON.stringify(await getWorkoutRoutine(session.user.id)));

  return (
    <div className="space-y-4 text-right">
      {/* Alert banner if no active subscription */}
      {!activeSub && (
        <div className="relative rounded-2xl p-4 overflow-hidden border border-rose-500/30 bg-rose-950/20 text-right anim-fade-up">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500"/>
          <p className="text-xs font-bold text-rose-400">شما فاقد اشتراک فعال هستید!</p>
          <p className="text-[10px] text-white/50 mt-1">جهت استفاده از گیت‌های ورود باشگاه و ثبت‌نام در کلاس‌ها، لطفاً اشتراک جدید تهیه کنید.</p>
        </div>
      )}

      {/* Hero membership card */}
      <div className="relative rounded-2xl overflow-hidden p-5 anim-scale-in"
        style={{background:"linear-gradient(135deg,rgba(40,5,15,.9),rgba(30,5,20,.8),rgba(20,5,10,.9))",border:"1px solid rgba(255,255,255,.14)",boxShadow:"inset 0 1px 0 rgba(255,255,255,.2),0 16px 48px rgba(0,0,0,.5)"}}>
        {/* Glows */}
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full animate-float-glow" style={{background:"radial-gradient(circle,rgba(201,24,74,.35),transparent 70%)"}}/>
        <div className="absolute -bottom-8 -right-4 w-24 h-24 rounded-full animate-float-glow" style={{background:"radial-gradient(circle,rgba(255,77,109,.15),transparent 70%)",animationDelay:".5s"}}/>
        
        <div className="relative">
          <div className="flex items-start justify-between mb-4 flex-row-reverse">
            <div className="text-right">
              <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">عضویت فعال</p>
              <p className="text-xl font-bold">{name}</p>
            </div>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full" 
              style={{
                background: activeSub ? "rgba(16,185,129,.2)" : "rgba(244,63,94,.2)", 
                color: activeSub ? "#34d399" : "#fb7185", 
                border: activeSub ? "1px solid rgba(16,185,129,.25)" : "1px solid rgba(244,63,94,.25)"
              }}>
              {activeSub ? "فعال" : "غیر فعال"}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3 text-right" style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)"}}>
              <p className="text-[9px] text-white/40">طرح اشتراک</p>
              <p className="text-xs font-semibold mt-1">{planName}</p>
            </div>
            <div className="rounded-xl p-3 text-right" style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)"}}>
              <p className="text-[9px] text-white/40">تاریخ انقضا</p>
              <p className="text-xs font-semibold mt-1">{expiryDateFarsi}</p>
            </div>
          </div>
          
          {activeSub && (
            <div className="flex items-center gap-3 flex-row-reverse">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,.08)"}}>
                <div className="h-1 rounded-full anim-progress" style={{background:"linear-gradient(90deg,#c9184a,#ff758f)",width:progressWidth}}/>
              </div>
              <p className="text-[9px] text-white/35 whitespace-nowrap">{remainingDaysText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Member KPIs (Days Counter & Session Counts) */}
      <div className="grid grid-cols-2 gap-3 anim-fade-up" style={{ animationDelay: "150ms" }}>
        <div className="glass-card p-4 text-right flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-white/35 mb-1">روز شمار اشتراک</p>
            <p className="text-2xl font-bold text-cyan-400">
              {activeSub ? remainingDaysVal.toLocaleString("fa-IR") : "۰"}{" "}
              <span className="text-xs font-medium text-white/40">روز</span>
            </p>
          </div>
          <p className="text-[9px] text-white/30 mt-2">روزهای باقیمانده تا تمدید</p>
        </div>

        <div className="glass-card p-4 text-right flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-white/35 mb-1">جلسات حضور یافته</p>
            <p className="text-2xl font-bold text-emerald-400">
              {attendanceCount.toLocaleString("fa-IR")}{" "}
              <span className="text-xs font-medium text-white/40">جلسه</span>
            </p>
          </div>
          <p className="text-[9px] text-white/30 mt-2">کل جلسات تمرینی شما</p>
        </div>
      </div>

      {/* Primary CTA */}
      <Link href="/member/membership" className="btn-primary w-full rounded-2xl py-4 text-sm font-bold anim-glow-pulse flex items-center justify-center gap-1">
        {activeSub ? "تمدید یا تغییر طرح اشتراک ←" : "خرید اشتراک جدید ←"}
      </Link>

      {/* Workout Daily Checklist */}
      <WorkoutTodoList initialRoutine={routine} userId={session.user.id} />

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"کد QR ورود", link:"/member/membership", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/></svg> },
          { label:"پیشرفت تمرینی", link:"/member/progress", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          { label:"فاکتورها", link:"/member/payments", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
        ].map((a,i) => (
          <Link key={a.label} href={a.link} className="btn-glass glass-card flex flex-col items-center gap-2 py-4 rounded-xl text-xs text-white/60 anim-fade-up" style={{animationDelay:`${i*60+300}ms`}}>
            <span className="text-bubblegum_pink">{a.icon}</span>
            {a.label}
          </Link>
        ))}
      </div>

      {/* Today summary */}
      <div className="glass-card p-4 anim-fade-up text-right" style={{animationDelay:"450ms"}}>
        <p className="text-xs font-semibold mb-3 text-white/70">خلاصه وضعیت مالی و بدنی</p>
        <ul className="space-y-2.5">
          <li className="flex items-center gap-2.5 text-xs text-white/55 hover:text-white/80 transition-colors cursor-default flex-row-reverse">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-indigo-500"/>
            <span className="flex-1 text-right">{attendanceCount} حضور ثبت شده در این دوره</span>
          </li>
          <li className="flex items-center gap-2.5 text-xs text-white/55 hover:text-white/80 transition-colors cursor-default flex-row-reverse">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400"/>
            <span className="flex-1 text-right">{pendingPayments} فاکتور پرداخت نشده</span>
          </li>
          <li className="flex items-center gap-2.5 text-xs text-white/55 hover:text-white/80 transition-colors cursor-default flex-row-reverse">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-violet-400"/>
            <span className="flex-1 text-right">{progressCount} شاخص پیشرفت بدن ثبت شده</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

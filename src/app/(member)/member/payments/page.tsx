import { auth } from "@/lib/auth";
import { getMember } from "@/server/actions/members";
import { redirect } from "next/navigation";

export default async function MemberPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const member = JSON.parse(JSON.stringify(await getMember(session.user.id)));
  const profile = member?.memberProfile;
  
  // Flatten payments from subscriptions
  const payments = profile?.subscriptions?.flatMap((s: any) => 
    s.payments.map((p: any) => ({
      ...p,
      planName: s.plan.name,
      endsAt: s.endsAt,
    }))
  ) || [];

  // Sort payments by creation date desc
  payments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate totals
  const totalPaid = payments
    .filter((p: any) => p.status === "PAID")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const activeSub = profile?.subscriptions?.find((s: any) => s.status === "ACTIVE");
  let nextPaymentFarsi = "---";
  if (activeSub?.endsAt) {
    nextPaymentFarsi = new Date(activeSub.endsAt).toLocaleDateString("fa-IR", { month: "long", day: "numeric" });
  }

  const methodTranslate: Record<string, string> = {
    CASH: "نقدی",
    CARD: "کارت بانکی",
    TRANSFER: "کارت به کارت",
    WALLET: "کیف پول",
    ONLINE: "درگاه آنلاین",
    OTHER: "سایر",
  };

  return (
    <div className="space-y-4 text-right">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">تراکنش‌های مالی</p>
        <h1 className="text-2xl font-bold gradient-text">تاریخچه پرداخت‌ها</h1>
      </div>
      
      <div className="grid grid-cols-2 gap-3 anim-fade-up flex-row-reverse" style={{ animationDelay: "60ms" }}>
        <div className="glass-card p-4 text-right">
          <p className="text-[10px] text-white/35 mb-1.5">کل مبالغ پرداختی</p>
          <p className="text-xl font-bold text-emerald-400">{totalPaid.toLocaleString("fa-IR")} تومان</p>
        </div>
        <div className="glass-card p-4 text-right">
          <p className="text-[10px] text-white/35 mb-1.5">موعد تمدید بعدی</p>
          <p className="text-xl font-bold text-white/80">{nextPaymentFarsi}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden text-right">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-sm font-semibold">تراکنش‌های اخیر</p>
        </div>
        
        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-white/30">هنوز هیچ تراکنشی ثبت نشده است.</div>
        ) : (
          <div className="divide-y divide-white/[0.04] stagger">
            {payments.map((p: any) => {
              const dateStr = new Date(p.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
              const methodStr = methodTranslate[p.method] || p.method;
              const isPaid = p.status === "PAID";
              
              return (
                <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.025] transition-colors flex-row-reverse text-right">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{p.planName}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{methodStr} · {dateStr}</p>
                    {p.transactionRef && (
                      <p className="text-[9px] text-cyan-500/80 font-mono mt-0.5" dir="ltr">کد رهگیری: {p.transactionRef}</p>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{Number(p.amount).toLocaleString("fa-IR")} تومان</p>
                    <p className={`text-[10px] mt-0.5 font-bold ${isPaid ? "text-emerald-400" : "text-amber-400"}`}>
                      {isPaid ? "موفق" : "در انتظار تایید"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

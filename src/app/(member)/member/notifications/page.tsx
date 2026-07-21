const notifs = [
  { title:"انقضای نزدیک اشتراک", body:"اشتراک ماهانه پرمیوم شما ۷ روز دیگر منقضی می‌شود. هم‌اکنون تمدید کنید.", time:"امروز",     type:"urgent" },
  { title:"یادآور کلاس ورزشی",             body:"کلاس یوگای صبحگاهی تا ۱ ساعت دیگر شروع می‌شود.",                 time:"امروز",     type:"info" },
  { title:"تایید رزرو کلاس",          body:"کلاس تمرینات HIIT — فردا ساعت ۱۰:۰۰ صبح.",           time:"دیروز", type:"success" },
  { title:"پرداخت موفق دریافت شد",           body:"مبلغ ۶۵۰,۰۰۰ تومان برای اشتراک خرداد ماه دریافت شد.",       time:"۳۰ خرداد",    type:"success" },
];

const ts: Record<string,{dot:string}> = {
  urgent:  {dot:"bg-rose-500 anim-dot-pulse"},
  success: {dot:"bg-emerald-400"},
  info:    {dot:"bg-bubblegum_pink"},
};

export default function MemberNotificationsPage() {
  return (
    <div className="space-y-4 text-right">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">فعالیت‌ها</p>
        <h1 className="text-2xl font-bold gradient-text">اعلان‌ها</h1>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/[0.05] stagger">
          {notifs.map(n => {
            const s = ts[n.type];
            return (
              <div key={n.title} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors cursor-default flex-row-reverse">
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

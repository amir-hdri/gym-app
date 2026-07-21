const notifs = [
  { title:"انقضای اشتراک نزدیک است",   body:"سارا محمدی — امروز منقضی می‌شود",                time:"۲ دقیقه پیش",   type:"urgent" },
  { title:"پرداخت دریافت شد",        body:"رضا احمدی مبلغ ۵,۹۰۰,۰۰۰ تومان پرداخت کرد (سالانه الیت)",        time:"۱ ساعت پیش",  type:"success" },
  { title:"درخواست تعلیق اشتراک",          body:"نیکا رضایی درخواست تعلیق ۲ هفته‌ای ثبت کرده است",       time:"۳ ساعت پیش", type:"info" },
  { title:"عضو جدید ملحق شد",       body:"دارا سهرابی طرح ماهانه پایه را ثبت‌نام کرد",     time:"دیروز",   type:"info" },
  { title:"تکمیل ظرفیت کلاس ورزشی",      body:"ظرفیت کلاس تمرینات HIIT تکمیل شد",                time:"دیروز",   type:"warning" },
];

const typeStyle: Record<string,{dot:string;label:string}> = {
  urgent:  { dot:"bg-rose-500 anim-dot-pulse", label:"text-rose-400" },
  success: { dot:"bg-emerald-400",             label:"text-emerald-400" },
  warning: { dot:"bg-amber-400",               label:"text-amber-400" },
  info:    { dot:"bg-white/20",                label:"text-white/40" },
};

export default function NotificationsPage() {
  return (
    <div className="space-y-5 text-right">
      <div className="flex items-center justify-between flex-row-reverse anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">فعالیت‌ها</p>
          <h1 className="text-2xl font-bold gradient-text">اعلان‌ها</h1>
        </div>
        <button className="btn-primary rounded-xl px-4 py-2 text-xs font-bold">ارسال یادآور</button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/[0.05] stagger">
          {notifs.map(n => {
            const s = typeStyle[n.type];
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

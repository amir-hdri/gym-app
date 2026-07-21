const trainers = [
  { name:"مربی علی",  title:"یوگا و انعطاف‌پذیری",    members:14, classes:3, c:"rgba(16,185,129,.15)",t:"#34d399", i:"ع" },
  { name:"مربی سارا", title:"تمرینات HIIT و هوازی",          members:9,  classes:5, c:"rgba(59,130,246,.15)",t:"#60a5fa", i:"س" },
  { name:"مربی رضا", title:"قدرتی و پاورلیفتینگ",members:11, classes:4, c:"rgba(168,85,247,.15)",t:"#c084fc", i:"ر" },
  { name:"مربی مینا", title:"پیلاتس و مرکز بدن",          members:7,  classes:3, c:"rgba(34,211,238,.10)",t:"#22d3ee", i:"م" },
];

export default function TrainersPage() {
  return (
    <div className="space-y-5 text-right">
      <div className="flex items-center justify-between flex-row-reverse anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">پرسنل</p>
          <h1 className="text-2xl font-bold gradient-text">مربیان باشگاه</h1>
        </div>
        <button className="btn-primary rounded-xl px-4 py-2 text-xs font-bold">+ افزودن مربی</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {trainers.map((t,i) => (
          <div key={t.name} className="glass-card p-5 anim-fade-up text-right" style={{animationDelay:`${i*60}ms`}}>
            <div className="flex items-center gap-4 mb-4 flex-row-reverse">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{background:t.c,color:t.t}}>{t.i}</div>
              <div className="text-right">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{t.title}</p>
              </div>
            </div>
            <div className="flex gap-4 flex-row-reverse">
              <div className="glass rounded-xl px-3 py-2 text-center flex-1">
                <p className="text-lg font-bold" style={{color:t.t}}>{t.members}</p>
                <p className="text-[9px] text-white/35 mt-0.5">شاگردان فعال</p>
              </div>
              <div className="glass rounded-xl px-3 py-2 text-center flex-1">
                <p className="text-lg font-bold" style={{color:t.t}}>{t.classes}</p>
                <p className="text-[9px] text-white/35 mt-0.5">کلاس‌ها در هفته</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

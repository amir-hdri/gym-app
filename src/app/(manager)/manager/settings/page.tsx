const sections = [
  {
    title:"مشخصات باشگاه ورزشی",
    fields:[
      { label:"نام باشگاه",    placeholder:"باشگاه ورزشی من" },
      { label:"شماره تلفن",       placeholder:"۰۲۱۱۲۳۴۵۶۷۸" },
      { label:"آدرس باشگاه",     placeholder:"خیابان آزادی، پلاک ۴" },
      { label:"شهر",        placeholder:"تهران" },
    ],
  },
  {
    title:"یادآوری‌ها و اعلانات",
    fields:[
      { label:"ارسال یادآور تمدید (چند روز قبل)", placeholder:"۷" },
      { label:"ایمیل دریافت هشدارها",                    placeholder:"manager@gym.com" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-5 text-right">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">پیکربندی</p>
        <h1 className="text-2xl font-bold gradient-text">تنظیمات سامانه</h1>
      </div>
      {sections.map((sec, i) => (
        <div key={sec.title} className="glass-card p-5 space-y-4 anim-fade-up text-right" style={{animationDelay:`${i*80}ms`}}>
          <h3 className="text-sm font-semibold text-white/80">{sec.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {sec.fields.map(f => (
              <div key={f.label}>
                <label className="block text-[10px] text-white/40 mb-1.5 text-right">{f.label}</label>
                <input placeholder={f.placeholder} className="input-glass w-full rounded-xl px-3 py-2.5 text-sm text-right"/>
              </div>
            ))}
          </div>
          <button className="btn-primary rounded-xl px-5 py-2.5 text-xs font-bold">ذخیره تغییرات</button>
        </div>
      ))}
    </div>
  );
}

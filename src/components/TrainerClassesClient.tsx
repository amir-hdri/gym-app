"use client";

export default function TrainerClassesClient({ data }: { data: any }) {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">کلاس‌ها و کارگاه‌های تخصصی</h1>
        <p className="text-xs text-white/50 mt-1">لیست کارگاه‌ها و کلاس‌های تحت مربیگری شما</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.classes.map((cls: any) => (
          <div key={cls.id} className="glass p-5 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{cls.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {cls.category || "فیتنس"}
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1">{cls.description || "کلاس تخصصی با تمرکز بر توان و استقامت"}</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300 bg-white/5 px-2.5 py-1 rounded-xl">
                ظرفیت: {cls.capacity || 15} نفر
              </span>
            </div>

            <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5 space-y-1.5 text-xs text-white/70">
              <div className="flex justify-between">
                <span>مکان برگزاری:</span>
                <span className="text-white font-semibold">{cls.location || "سالن اصلی باشگاه"}</span>
              </div>
              <div className="flex justify-between">
                <span>تعداد ثبت‌نام‌شدگان:</span>
                <span className="text-emerald-300 font-mono font-bold">{cls.bookings?.length || 0} نفر</span>
              </div>
            </div>

            {cls.bookings && cls.bookings.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[11px] font-bold text-white/80">اعضای ثبت‌نام شده:</span>
                <div className="flex flex-wrap gap-1.5">
                  {cls.bookings.map((b: any) => (
                    <span key={b.id} className="text-[10px] px-2.5 py-1 rounded-xl bg-white/5 text-white/80 border border-white/5">
                      {b.member?.user?.name || "ورزشکار"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

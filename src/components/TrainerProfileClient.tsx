"use client";

export default function TrainerProfileClient({ data }: { data: any }) {
  const trainer = data.trainer;
  const profile = data.staffProfile;

  return (
    <div className="space-y-6 max-w-3xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">پروفایل و مشخصات مربی</h1>
        <p className="text-xs text-white/50 mt-1">مشاهده مشخصات فردی، کد پرسنلی و اطلاعات فنی باشگاه</p>
      </div>

      <div className="glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-white/10 text-center sm:text-right">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-3xl text-white shadow-xl shadow-amber-950/40 shrink-0"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            🏋️‍♂️
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{trainer?.name || "مربی باشگاه"}</h2>
            <p className="text-xs text-amber-300 font-semibold mt-0.5">{profile?.title || "سرمربی بدنسازی و فیتنس"}</p>
            <p className="text-[11px] text-white/40 mt-1">شعبه اصلی جیم‌اپ | فعال در سیستم مدیریت باشگاه</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] text-white/40">شماره تلفن تماس</span>
            <p className="text-xs font-bold text-white font-mono" dir="ltr">{trainer?.phone || "+1-555-2001"}</p>
          </div>
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] text-white/40">ایمیل سازمانی</span>
            <p className="text-xs font-bold text-white font-mono">{trainer?.email || "ali.trainer@gym.com"}</p>
          </div>
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] text-white/40">کد پرسنلی مربی</span>
            <p className="text-xs font-bold text-amber-300 font-mono">{profile?.employeeCode || "TRN-001"}</p>
          </div>
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] text-white/40">تعداد شاگردان فعال</span>
            <p className="text-xs font-bold text-emerald-400">{data.stats?.activeAthletesCount || 0} ورزشکار</p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-xs text-amber-300 space-y-1">
          <span className="font-bold">🎖️ مدارک و گواهینامه‌ها:</span>
          <p className="text-white/80 text-[11px]">مدرک مربیگری درجه ۱ فدراسیون بدنسازی و پرورش اندام | گواهینامه بین‌المللی تغذیه ورزشی و طراحی تمرینات قدرتی</p>
        </div>
      </div>
    </div>
  );
}

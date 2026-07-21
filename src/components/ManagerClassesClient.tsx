"use client";

import { useState, useTransition } from "react";
import { createClassSession } from "@/server/actions/classes";

interface Booking {
  id: string;
  member: {
    user: {
      name: string;
      phone: string;
    };
  };
  status: string;
}

interface ClassSession {
  id: string;
  title: string;
  description?: string | null;
  trainerName?: string | null;
  startAt: string | Date;
  endAt: string | Date;
  capacity?: number | null;
  location?: string | null;
  bookings: Booking[];
}

interface ManagerClassesClientProps {
  initialClasses: ClassSession[];
}

export default function ManagerClassesClient({ initialClasses }: ManagerClassesClientProps) {
  const [classesList, setClassesList] = useState<ClassSession[]>(initialClasses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [title, setTitle] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !trainerName || !startDate || !startTime || !endTime) {
      alert("پر کردن فیلدهای ستاره‌دار الزامی است");
      return;
    }

    const startISO = new Date(`${startDate}T${startTime}`).toISOString();
    const endISO = new Date(`${startDate}T${endTime}`).toISOString();

    startTransition(async () => {
      try {
        await createClassSession({
          title,
          trainerName,
          capacity: capacity ? Number(capacity) : undefined,
          location: location || undefined,
          description: description || undefined,
          startAt: startISO,
          endAt: endISO
        });
        alert("کلاس جدید با موفقیت ایجاد شد!");
        setIsModalOpen(false);
        // Reset form
        setTitle("");
        setTrainerName("");
        setCapacity("");
        setLocation("");
        setDescription("");
        setStartDate("");
        setStartTime("");
        setEndTime("");
        window.location.reload();
      } catch (err: any) {
        alert(err.message || "خطا در ایجاد کلاس ورزشی");
      }
    });
  };

  return (
    <div className="space-y-5 text-right">
      <div className="flex items-center justify-between flex-row-reverse anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">برنامه‌ریزی</p>
          <h1 className="text-2xl font-bold gradient-text">کلاس‌های ورزشی</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg shadow-rose-950/20">
          + ایجاد کلاس جدید
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
        {classesList.length === 0 ? (
          <div className="col-span-full glass-card p-10 text-center text-xs text-white/30">هیچ کلاسی ثبت نشده است. از دکمه بالا برای ایجاد کلاس استفاده کنید.</div>
        ) : (
          classesList.map((cls, i) => {
            const start = new Date(cls.startAt);
            const dateStr = start.toLocaleDateString("fa-IR", { weekday: "long", month: "short", day: "numeric" });
            const timeStr = `${start.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })} الی ${new Date(cls.endAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`;
            
            const bookedCount = cls.bookings.filter(b => b.status === "BOOKED").length;
            const cap = cls.capacity || "نامحدود";
            const isFull = cls.capacity && bookedCount >= cls.capacity;

            return (
              <div key={cls.id} className="glass-card p-5 hover:bg-white/[0.015] hover:scale-[1.01] hover:shadow-xl transition-all text-right flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3 flex-row-reverse">
                    <div className="text-right">
                      <h3 className="text-sm font-bold text-white">{cls.title}</h3>
                      <p className="text-[10px] text-white/40 mt-0.5">مربی: {cls.trainerName || "نامشخص"}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isFull ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"
                    }`}>
                      {isFull ? "تکمیل ظرفیت" : "دارای ظرفیت"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[10px] text-white/60 mb-4 border-t border-b border-white/[0.04] py-2 my-2">
                    <p>📅 تاریخ: {dateStr}</p>
                    <p>⏰ زمان: {timeStr}</p>
                    {cls.location && <p>📍 مکان: {cls.location}</p>}
                    {cls.description && <p className="text-white/40 leading-relaxed mt-1">{cls.description}</p>}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs flex-row-reverse">
                  <span className="text-[10px] text-cyan-400/80">رزرو شده: {bookedCount} / {cap}</span>
                  <span className="text-[9px] text-white/35">کد کلاس: {cls.id.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md anim-fade-in">
          <div className="w-full max-w-md glass-strong p-6 rounded-2xl border border-white/20 text-right max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 flex-row-reverse border-b border-white/[0.06] pb-3">
              <h2 className="text-base font-bold text-white">ایجاد کلاس ورزشی جدید</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-right">
              <div>
                <label className="block text-[10px] text-white/40 mb-1">عنوان کلاس *</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: کلاس یوگای پیشرفته"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 flex-row-reverse">
                <div>
                  <label className="block text-[10px] text-white/40 mb-1">ظرفیت (نفر)</label>
                  <input 
                    type="number"
                    placeholder="بدون محدودیت"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 mb-1">نام مربی *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: استاد سهرابی"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 flex-row-reverse">
                <div className="col-span-1">
                  <label className="block text-[10px] text-white/40 mb-1">مکان کلاس</label>
                  <input 
                    type="text" 
                    placeholder="مثال: سالن ۱"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-glass w-full rounded-xl px-2 py-2.5 text-xs text-right"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-white/40 mb-1">تاریخ کلاس *</label>
                  <input 
                    type="date" 
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-glass w-full rounded-xl px-2 py-2.5 text-xs text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-row-reverse">
                <div>
                  <label className="block text-[10px] text-white/40 mb-1">ساعت پایان *</label>
                  <input 
                    type="time" 
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-left font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 mb-1">ساعت شروع *</label>
                  <input 
                    type="time" 
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-white/40 mb-1">توضیحات کوتاه</label>
                <textarea 
                  rows={2}
                  placeholder="جزئیات کلاس یا وسایل مورد نیاز…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 flex-row-reverse border-t border-white/[0.06]">
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold">
                  {isPending ? "در حال ایجاد..." : "ایجاد کلاس ورزشی"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-glass glass-card rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60">
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

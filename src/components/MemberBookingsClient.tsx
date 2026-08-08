"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { bookClassSession, cancelClassBooking } from "@/server/actions/classes";

interface Booking {
  id: string;
  memberId: string;
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

interface MemberBookingsClientProps {
  initialClasses: ClassSession[];
  memberProfileId: string;
}

export default function MemberBookingsClient({ initialClasses, memberProfileId }: MemberBookingsClientProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassSession[]>(initialClasses);
  const [isPending, startTransition] = useTransition();

  const handleBookingToggle = (classId: string, isBooked: boolean) => {
    startTransition(async () => {
      try {
        if (isBooked) {
          await cancelClassBooking(classId);
          alert("رزرو کلاس با موفقیت لغو شد");
        } else {
          await bookClassSession(classId);
          alert("کلاس با موفقیت رزرو شد");
        }
        router.refresh();
      } catch (err: any) {
        alert(err.message || "خطایی رخ داد");
      }
    });
  };

  return (
    <div className="space-y-4 text-right">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">برنامه‌ریزی</p>
        <h1 className="text-2xl font-bold gradient-text">کلاس‌های ورزشی گروهی</h1>
      </div>

      <div className="space-y-3">
        {classes.length === 0 ? (
          <div className="glass-card p-10 text-center text-xs text-white/30 anim-fade-up">کلاسی در حال حاضر برنامه‌ریزی نشده است.</div>
        ) : (
          classes.map((cls, i) => {
            const start = new Date(cls.startAt);
            const dateStr = start.toLocaleDateString("fa-IR", { weekday: "long", month: "short", day: "numeric" });
            const timeStr = `${start.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })} الی ${new Date(cls.endAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`;

            // Check if user is booked
            const isBooked = cls.bookings.some(b => b.memberId === memberProfileId && b.status === "BOOKED");
            const bookedCount = cls.bookings.filter(b => b.status === "BOOKED").length;
            const isFull = cls.capacity && bookedCount >= cls.capacity;

            // Generate gradient colors based on index
            const colors = [
              { c: "rgba(16,185,129,.12)", t: "#34d399" },
              { c: "rgba(59,130,246,.12)", t: "#60a5fa" },
              { c: "rgba(168,85,247,.12)", t: "#c084fc" },
              { c: "rgba(34,211,238,.10)", t: "#22d3ee" }
            ];
            const theme = colors[i % colors.length];

            return (
              <div 
                key={cls.id} 
                className="glass-card p-4 flex items-center gap-4 anim-fade-up flex-row-reverse relative overflow-hidden" 
                style={{ animationDelay: `${i * 60 + 80}ms` }}>
                
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: theme.c }}>
                  <svg className="w-4 h-4" style={{ color: theme.t }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                </div>
                
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-semibold truncate text-white">{cls.title}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    مربی: {cls.trainerName || "نامشخص"} · {dateStr} · {timeStr}
                  </p>
                  {cls.location && (
                    <p className="text-[9px] text-cyan-400/70 mt-0.5">📍 مکان: {cls.location}</p>
                  )}
                  {cls.capacity && (
                    <p className="text-[9px] text-white/30 mt-0.5">ظرفیت: {bookedCount} از {cls.capacity} نفر</p>
                  )}
                </div>

                <div className="shrink-0">
                  {isBooked ? (
                    <button 
                      onClick={() => handleBookingToggle(cls.id, true)}
                      disabled={isPending}
                      className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl px-3 py-2 text-xs font-bold hover:bg-rose-500/20 transition-all">
                      {isPending ? "لطفاً صبر کنید..." : "لغو رزرو"}
                    </button>
                  ) : isFull ? (
                    <span className="text-[10px] bg-white/5 border border-white/10 text-white/30 px-3 py-2 rounded-xl cursor-not-allowed">
                      تکمیل ظرفیت
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleBookingToggle(cls.id, false)}
                      disabled={isPending}
                      className="btn-primary rounded-xl px-3 py-2 text-xs font-bold">
                      {isPending ? "در حال ثبت..." : "رزرو کلاس"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMember } from "@/server/actions/members";
import { createOrUpdateWorkoutRoutine } from "@/server/actions/workouts";
import { createSchedule, deleteSchedule } from "@/server/actions/schedules";
import { PERSIAN_DAYS, getDayNamePersian } from "@/lib/qr";

interface MembersClientProps {
  initialMembers: any[];
}

export default function MembersClient({ initialMembers }: MembersClientProps) {
  const router = useRouter();
  const [membersList] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Form states for new member
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("member123");

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states for workout assignment
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState("برنامه بدنسازی عمومی");
  const [workoutTasks, setWorkoutTasks] = useState<Array<{ exerciseName: string; sets: number; reps: string; notes: string }>>([
    { exerciseName: "", sets: 3, reps: "12", notes: "" }
  ]);
  const [workoutMemberId, setWorkoutMemberId] = useState("");

  // Form states for schedule assignment (B4)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(0);
  const [scheduleStartTime, setScheduleStartTime] = useState("10:00");
  const [scheduleEndTime, setScheduleEndTime] = useState("11:30");
  const [scheduleTitle, setScheduleTitle] = useState("تمرین تخصصی");
  const [scheduleRoutineId, setScheduleRoutineId] = useState<string>("");
  const [scheduleNote, setScheduleNote] = useState("");

  // Filter members
  const filteredMembers = membersList.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()));

    const activeSub = m.memberProfile?.subscriptions?.[0];
    const isActive = activeSub && activeSub.status === "ACTIVE";

    if (filterStatus === "ACTIVE") return matchSearch && isActive;
    if (filterStatus === "EXPIRED") return matchSearch && !isActive;
    return matchSearch;
  });

  // Handle Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name || !phone) {
      setErrorMsg("نام و شماره تماس الزامی هستند");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      try {
        await createMember(formData);
        setSuccessMsg(`عضو جدید (${name}) با موفقیت ایجاد شد!`);
        setTimeout(() => {
          setIsAddModalOpen(false);
          setName("");
          setPhone("");
          setEmail("");
          setPassword("member123");
          setSuccessMsg("");
          router.refresh();
        }, 2000);
      } catch (err: any) {
        setErrorMsg(err.message || "خطایی رخ داد");
      }
    });
  };

  const handleOpenWorkoutModal = (member: any) => {
    setWorkoutMemberId(member.memberProfile.id);
    const activeRoutine = member.memberProfile.workoutRoutines?.[0];
    if (activeRoutine) {
      setWorkoutTitle(activeRoutine.title);
      setWorkoutTasks(
        activeRoutine.tasks.map((t: any) => ({
          exerciseName: t.exerciseName,
          sets: t.sets,
          reps: t.reps,
          notes: t.notes || "",
        }))
      );
    } else {
      setWorkoutTitle("برنامه بدنسازی عمومی");
      setWorkoutTasks([{ exerciseName: "", sets: 3, reps: "12", notes: "" }]);
    }
    setIsWorkoutModalOpen(true);
  };

  const handleAddWorkoutTaskField = () => {
    setWorkoutTasks((prev) => [...prev, { exerciseName: "", sets: 3, reps: "12", notes: "" }]);
  };

  const handleRemoveWorkoutTaskField = (idx: number) => {
    setWorkoutTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleWorkoutTaskChange = (idx: number, field: string, value: any) => {
    let parsed: any = value;
    if (field === "sets") {
      parsed = parseInt(value) || 0;
      if (parsed < 1) parsed = 1;
      if (parsed > 20) parsed = 20;
    }
    setWorkoutTasks((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: parsed } : t))
    );
  };

  const handleSaveWorkoutRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutTitle) {
      alert("عنوان برنامه الزامی است");
      return;
    }
    if (workoutTasks.some((t) => !t.exerciseName)) {
      alert("نام تمامی حرکت‌ها باید وارد شود");
      return;
    }

    startTransition(async () => {
      try {
        await createOrUpdateWorkoutRoutine(workoutMemberId, workoutTitle, workoutTasks);
        alert("برنامه ورزشی با موفقیت ثبت شد!");
        setIsWorkoutModalOpen(false);
        setSelectedMember(null);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "خطا در ثبت برنامه ورزشی");
      }
    });
  };

  // Schedule management handlers (B4)
  const handleOpenScheduleModal = (member: any) => {
    setWorkoutMemberId(member.memberProfile.id);
    setScheduleDayOfWeek(0);
    setScheduleStartTime("10:00");
    setScheduleEndTime("11:30");
    setScheduleTitle("تمرین تخصصی");
    setScheduleRoutineId(member.memberProfile.workoutRoutines?.[0]?.id || "");
    setScheduleNote("");
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleStartTime || !scheduleEndTime) {
      alert("ساعت شروع و پایان الزامی هستند");
      return;
    }
    if (scheduleStartTime >= scheduleEndTime) {
      alert("ساعت شروع باید قبل از ساعت پایان باشد");
      return;
    }

    startTransition(async () => {
      try {
        await createSchedule({
          memberId: workoutMemberId,
          routineId: scheduleRoutineId || null,
          dayOfWeek: Number(scheduleDayOfWeek),
          startTime: scheduleStartTime,
          endTime: scheduleEndTime,
          title: scheduleTitle,
          note: scheduleNote,
        });
        alert("سانس تمرینی جدید با موفقیت اضافه شد!");
        setIsScheduleModalOpen(false);
        setSelectedMember(null);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "خطا در ثبت سانس تمرینی");
      }
    });
  };

  const handleDeleteScheduleItem = (scheduleId: string) => {
    if (!confirm("آیا از حذف این سانس تمرینی اطمینان دارید؟")) return;

    startTransition(async () => {
      try {
        await deleteSchedule(scheduleId);
        alert("سانس با موفقیت حذف شد");
        setSelectedMember(null);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "خطا در حذف سانس");
      }
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5 text-right" dir="rtl">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
            مدیریت کاربران
          </p>
          <h1 className="text-xl sm:text-2xl font-bold gradient-text">اعضای باشگاه</h1>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg shadow-rose-950/20 self-start sm:self-auto"
        >
          + ایجاد عضو جدید
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-3 anim-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="جستجو بر اساس نام، شماره تلفن یا ایمیل اعضا..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass w-full rounded-xl px-4 py-2.5 text-xs text-right"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="input-glass w-full rounded-xl px-3 sm:px-4 py-2.5 text-xs text-right bg-[#100105] text-white/80"
          >
            <option value="ALL" className="bg-[#24050e]">همه اعضا</option>
            <option value="ACTIVE" className="bg-[#24050e]">اعضای دارای طرح فعال</option>
            <option value="EXPIRED" className="bg-[#24050e]">اعضای فاقد طرح فعال</option>
          </select>
        </div>
      </div>

      {/* Grid of members */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full glass-card p-8 sm:p-10 text-center text-xs text-white/30">
            هیچ عضوی یافت نشد.
          </div>
        ) : (
          filteredMembers.map((m: any) => {
            const activeSub = m.memberProfile?.subscriptions?.[0];
            const isActive = activeSub && activeSub.status === "ACTIVE";
            const planName = activeSub?.plan?.name || "بدون طرح فعال";
            const initials = m.name.substring(0, 2);
            const scheduleCount = m.memberProfile?.schedules?.length || 0;

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className="glass-card p-3.5 sm:p-4 hover:bg-white/[0.015] hover:scale-[1.01] hover:shadow-xl transition-all cursor-pointer text-right flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/15 shrink-0">
                    {initials}
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">{m.name}</h3>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">{m.phone}</p>
                  </div>
                  {scheduleCount > 0 && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/20 shrink-0">
                      {scheduleCount} سانس
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs border-t border-white/[0.04] pt-2.5 mt-2">
                  <div className="text-right">
                    <p className="text-[9px] text-white/35">طرح اشتراک</p>
                    <p className="font-semibold text-white/70 text-[10px] sm:text-[11px] mt-0.5 truncate max-w-[120px]">{planName}</p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                    }`}
                  >
                    {isActive ? "فعال" : "فاقد طرح"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Create Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md anim-fade-in overflow-y-auto">
          <div className="w-full max-w-sm glass-strong p-4 sm:p-6 rounded-2xl border border-white/20 text-right my-auto">
            {successMsg ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-emerald-400">عضو ایجاد شد</h3>
                <p className="text-xs text-white/60">{successMsg}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm sm:text-base font-bold text-white">ثبت‌نام عضو جدید</h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-white/40 hover:text-white text-lg">
                    &times;
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleAddMember} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">نام و نام خانوادگی</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: سهراب سپهری"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">شماره تلفن</label>
                    <input
                      type="tel"
                      required
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">ایمیل (اختیاری)</label>
                    <input
                      type="email"
                      placeholder="sohrab@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">رمز عبور پیش‌فرض</label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold"
                    >
                      {isPending ? "در حال ایجاد..." : "ایجاد حساب"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="btn-glass glass-card rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Member Details & Weekly Schedule (B4) */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md anim-fade-in overflow-y-auto">
          <div className="w-full max-w-lg glass-strong p-4 sm:p-6 rounded-2xl border border-white/20 text-right max-h-[88vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center mb-4 border-b border-white/[0.06] pb-3">
              <h2 className="text-sm sm:text-base font-bold text-white">کارت جزئیات عضو باشگاه</h2>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 sm:space-y-4">
              {/* Basic Details */}
              <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-xl space-y-2 text-right">
                <div className="flex justify-between items-center">
                  <p className="text-xs sm:text-sm font-bold text-rose-400">{selectedMember.name}</p>
                  <span className="text-[10px] text-white/40 font-mono">
                    کد: {selectedMember.memberProfile?.membershipCode || "---"}
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  تلفن: <span dir="ltr">{selectedMember.phone}</span>
                </p>
                {selectedMember.email && (
                  <p className="text-xs text-white/60">
                    ایمیل: <span dir="ltr">{selectedMember.email}</span>
                  </p>
                )}
              </div>

              {/* Weekly Workout Schedule Section (B4) */}
              <div className="space-y-2.5 bg-white/[0.02] border border-white/[0.08] p-3 sm:p-3.5 rounded-xl">
                <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                  <span className="text-xs font-bold text-cyan-300">
                    📅 زمانبندی هفتگی تمرینات مربی
                  </span>
                  <button
                    onClick={() => handleOpenScheduleModal(selectedMember)}
                    className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg font-bold hover:bg-cyan-500/30 transition-all"
                  >
                    + افزودن سانس
                  </button>
                </div>

                {!selectedMember.memberProfile?.schedules ||
                selectedMember.memberProfile.schedules.length === 0 ? (
                  <p className="text-[10px] text-white/30 py-3 text-center">
                    هیچ سانس هفتگی برای این عضو تعریف نشده است. جهت تعیین روزها و ساعات تمرین، دکمه «+ افزودن سانس» را بزنید.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedMember.memberProfile.schedules.map((sch: any) => {
                      const dayName = getDayNamePersian(sch.dayOfWeek);
                      const routineTitle = sch.routine?.title || "روتین عمومی";
                      return (
                        <div
                          key={sch.id}
                          className="flex items-center justify-between p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs hover:border-cyan-500/20 transition-all"
                        >
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{dayName}</span>
                              <span className="text-[10px] text-cyan-300 font-mono" dir="ltr">
                                {sch.startTime} - {sch.endTime}
                              </span>
                            </div>
                            <p className="text-[10px] text-white/50 mt-0.5">
                              {sch.title || "تمرین"} · روتین: {routineTitle}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteScheduleItem(sch.id)}
                            className="text-rose-400 hover:text-rose-300 text-[10px] font-bold px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
                          >
                            حذف
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Workout Routine Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-white/60">برنامه ورزشی و حرکات</p>
                  <button
                    onClick={() => handleOpenWorkoutModal(selectedMember)}
                    className="text-[10px] text-cyan-400 hover:underline font-bold"
                  >
                    {selectedMember.memberProfile?.workoutRoutines?.[0] ? "ویرایش حرکات" : "+ ثبت برنامه جدید"}
                  </button>
                </div>

                {selectedMember.memberProfile?.workoutRoutines?.[0] && (
                  <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-xs space-y-1.5 text-right">
                    <p className="font-semibold text-white">
                      {selectedMember.memberProfile.workoutRoutines[0].title}
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedMember.memberProfile.workoutRoutines[0].tasks.map((task: any, idx: number) => (
                        <div key={task.id || idx} className="flex justify-between text-[10px] text-white/60">
                          <span>
                            {task.exerciseName} ({task.sets} ست · {task.reps} تکرار)
                          </span>
                          {task.notes && <span className="text-white/30 text-[9px]">{task.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subscriptions info */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-white/60">وضعیت طرح و اشتراک‌ها</p>
                {!selectedMember.memberProfile?.subscriptions ||
                selectedMember.memberProfile.subscriptions.length === 0 ? (
                  <p className="text-[10px] text-white/30 bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                    این کاربر فاقد هرگونه اشتراک یا فاکتور ثبت شده است.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedMember.memberProfile.subscriptions.map((sub: any) => {
                      const start = sub.startedAt
                        ? new Date(sub.startedAt).toLocaleDateString("fa-IR")
                        : "نامشخص";
                      const end = sub.endsAt
                        ? new Date(sub.endsAt).toLocaleDateString("fa-IR")
                        : "نامشخص";
                      return (
                        <div
                          key={sub.id}
                          className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-xs space-y-1"
                        >
                          <div className="flex justify-between font-semibold">
                            <span>طرح {sub.plan?.name}</span>
                            <span
                              className={
                                sub.status === "ACTIVE"
                                  ? "text-emerald-400"
                                  : sub.status === "PENDING"
                                  ? "text-amber-400"
                                  : "text-white/40"
                              }
                            >
                              {sub.status === "ACTIVE"
                                ? "فعال"
                                : sub.status === "PENDING"
                                ? "در انتظار تایید"
                                : sub.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40">
                            بازه: {start} الی {end}
                          </p>
                          {sub.plan?.isSessionBased && (
                            <p className="text-[10px] text-cyan-300">
                              جلسات: {sub.sessionsUsed || 0} از {sub.plan.maxSessions} جلسه
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedMember(null)}
                className="btn-glass glass-card rounded-xl px-5 py-2 text-xs font-semibold text-white/70"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Workout Routine Define Modal */}
      {isWorkoutModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md anim-fade-in overflow-y-auto">
          <div className="w-full max-w-lg glass-strong p-4 sm:p-6 rounded-2xl border border-white/20 text-right max-h-[85vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center mb-4 border-b border-white/[0.06] pb-3">
              <h2 className="text-sm sm:text-base font-bold text-white">تعریف برنامه ورزشی کاربر</h2>
              <button
                onClick={() => setIsWorkoutModalOpen(false)}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveWorkoutRoutine} className="space-y-4 text-right">
              <div>
                <label className="block text-[10px] text-white/40 mb-1">عنوان برنامه ورزشی</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: برنامه پا و سرشانه"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  className="input-glass w-full rounded-xl px-3.5 py-2.5 text-xs text-right"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/50">لیست حرکت‌های ورزشی</span>
                  <button
                    type="button"
                    onClick={handleAddWorkoutTaskField}
                    className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg font-semibold hover:bg-rose-500/30"
                  >
                    + افزودن حرکت
                  </button>
                </div>

                <div className="space-y-3 divide-y divide-white/[0.04]">
                  {workoutTasks.map((task, idx) => (
                    <div key={idx} className="pt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40 font-mono">#{idx + 1}</span>
                        <input
                          type="text"
                          required
                          placeholder="نام حرکت (مثال: پرس سینه دمبل)"
                          value={task.exerciseName}
                          onChange={(e) =>
                            handleWorkoutTaskChange(idx, "exerciseName", e.target.value)
                          }
                          className="input-glass flex-1 rounded-xl px-3 py-2 text-xs text-right"
                        />
                        {workoutTasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveWorkoutTaskField(idx)}
                            className="text-rose-500 hover:text-rose-400 text-xs px-1 font-bold"
                          >
                            حذف
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-white/30 mb-0.5">ست‌ها</label>
                          <input
                            type="number"
                            required
                            placeholder="3"
                            value={task.sets}
                            onChange={(e) => handleWorkoutTaskChange(idx, "sets", e.target.value)}
                            className="input-glass w-full rounded-xl px-3 py-1.5 text-xs text-left"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-white/30 mb-0.5">تکرارها</label>
                          <input
                            type="text"
                            required
                            placeholder="12-12-10"
                            value={task.reps}
                            onChange={(e) => handleWorkoutTaskChange(idx, "reps", e.target.value)}
                            className="input-glass w-full rounded-xl px-3 py-1.5 text-xs text-left font-mono"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-white/30 mb-0.5">توضیح مربی</label>
                          <input
                            type="text"
                            placeholder="مثال: سنگین"
                            value={task.notes}
                            onChange={(e) => handleWorkoutTaskChange(idx, "notes", e.target.value)}
                            className="input-glass w-full rounded-xl px-3 py-1.5 text-xs text-right"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-white/[0.06]">
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold"
                >
                  {isPending ? "در حال ذخیره..." : "ذخیره برنامه ورزشی"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsWorkoutModalOpen(false)}
                  className="btn-glass glass-card rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add Schedule Modal (B4) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md anim-fade-in overflow-y-auto">
          <div className="w-full max-w-md glass-strong p-4 sm:p-6 rounded-2xl border border-white/20 text-right my-auto">
            <div className="flex justify-between items-center mb-4 border-b border-white/[0.06] pb-3">
              <h2 className="text-sm sm:text-base font-bold text-white">افزودن سانس تمرینی هفتگی</h2>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3.5">
              <div>
                <label className="block text-[10px] text-white/40 mb-1">روز هفته</label>
                <select
                  value={scheduleDayOfWeek}
                  onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}
                  className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-right bg-[#100105] text-white"
                >
                  {PERSIAN_DAYS.map((day, idx) => (
                    <option key={day} value={idx} className="bg-[#24050e]">
                      {day} (روز {idx + 1})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/40 mb-1">ساعت شروع (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 mb-1">ساعت پایان (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs text-center font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-white/40 mb-1">عنوان سانس</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تمرین سینه و سرشانه"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right"
                />
              </div>

              <div>
                <label className="block text-[10px] text-white/40 mb-1">اتصال به برنامه ورزشی (اختیاری)</label>
                <input
                  type="text"
                  placeholder="شناسه روتین تمرینی..."
                  value={scheduleRoutineId}
                  onChange={(e) => setScheduleRoutineId(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right"
                />
              </div>

              <div>
                <label className="block text-[10px] text-white/40 mb-1">یادداشت مربی (اختیاری)</label>
                <input
                  type="text"
                  placeholder="نکات گرم کردن، تغذیه یا مکمل قبل تمرین…"
                  value={scheduleNote}
                  onChange={(e) => setScheduleNote(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-white/[0.06]">
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold"
                >
                  {isPending ? "در حال ثبت..." : "ثبت سانس تمرین"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="btn-glass glass-card rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60"
                >
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

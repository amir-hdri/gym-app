"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createTrainerWorkoutRoutine,
  recordTrainerAthleteProgress,
} from "@/server/actions/trainer-panel";

interface Props {
  data: {
    trainer: any;
    staffProfile: any;
    assignments: any[];
    classes: any[];
    routines: any[];
    recentProgress: any[];
    allMembers: any[];
    stats: {
      activeAthletesCount: number;
      activeRoutinesCount: number;
      upcomingClassesCount: number;
      recentProgressCount: number;
    };
  };
}

export default function TrainerDashboardClient({ data }: Props) {
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    data.assignments[0]?.member?.id || data.allMembers[0]?.id || ""
  );

  // Routine form state
  const [routineTitle, setRoutineTitle] = useState("برنامه بدنسازی و هایپرتروفی");
  const [routineGoal, setRoutineGoal] = useState("افزایش حجم عضلانی و کات");
  const [routineDifficulty, setRoutineDifficulty] = useState("متوسط");
  const [routineDays, setRoutineDays] = useState("شنبه، دوشنبه، چهارشنبه");
  const [routineTime, setRoutineTime] = useState("18:00");
  const [trainerNote, setTrainerNote] = useState("استراحت بین ست‌ها رعایت شود. مصرف آب کافی الزامی است.");
  const [tasks, setTasks] = useState([
    { exerciseName: "پرس سینه هالتر", sets: 4, reps: "10-12", notes: "تمرکز بر انقباض" },
    { exerciseName: "اسکات پا هالتر", sets: 4, reps: "8-10", notes: "عمق استاندارد" },
    { exerciseName: "زیربغل قایقی سیم‌کش", sets: 3, reps: "12", notes: "" },
  ]);
  const [routineLoading, setRoutineLoading] = useState(false);
  const [routineMsg, setRoutineMsg] = useState("");

  // Progress form state
  const [progressMetric, setProgressMetric] = useState("WEIGHT");
  const [progressVal, setProgressVal] = useState("68.5");
  const [progressNotes, setProgressNotes] = useState("ارزیابی ماهانه دوره جدید");
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");

  const handleAddTask = () => {
    setTasks([...tasks, { exerciseName: "", sets: 3, reps: "12", notes: "" }]);
  };

  const handleRemoveTask = (index: number) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index: number, field: string, value: any) => {
    const next = [...tasks];
    (next[index] as any)[field] = value;
    setTasks(next);
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      alert("لطفاً ورزشکار را انتخاب کنید");
      return;
    }
    setRoutineLoading(true);
    setRoutineMsg("");
    try {
      await createTrainerWorkoutRoutine({
        memberId: selectedMemberId,
        title: routineTitle,
        goal: routineGoal,
        difficulty: routineDifficulty,
        scheduledDays: routineDays,
        scheduledTime: routineTime,
        trainerNote,
        tasks: tasks.filter((t) => t.exerciseName.trim().length > 0),
      });
      setRoutineMsg("✅ برنامه تمرینی با موفقیت برای ورزشکار ثبت گردید!");
      setTimeout(() => {
        setShowRoutineModal(false);
        setRoutineMsg("");
      }, 1500);
    } catch (err: any) {
      alert(err.message || "خطا در ثبت برنامه");
    } finally {
      setRoutineLoading(false);
    }
  };

  const handleRecordProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      alert("لطفاً ورزشکار را انتخاب کنید");
      return;
    }
    const val = parseFloat(progressVal);
    if (isNaN(val) || val <= 0) {
      alert("مقدار نامعتبر است");
      return;
    }
    setProgressLoading(true);
    setProgressMsg("");
    try {
      await recordTrainerAthleteProgress({
        memberId: selectedMemberId,
        metricType: progressMetric,
        value: val,
        unit: progressMetric === "BODY_FAT" ? "%" : "kg",
        notes: progressNotes,
      });
      setProgressMsg("✅ شاخص بدنی با موفقیت ثبت شد!");
      setTimeout(() => {
        setShowProgressModal(false);
        setProgressMsg("");
      }, 1200);
    } catch (err: any) {
      alert(err.message || "خطا در ثبت رکورد");
    } finally {
      setProgressLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="glass-strong p-6 sm:p-7 rounded-3xl relative overflow-hidden anim-scale-in">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-xl shadow-amber-950/40 shrink-0"
              style={{ background: "linear-gradient(135deg,#f59e0b,#b45309)" }}
            >
              🏋️‍♂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  خوش آمدید، {data.trainer?.name || "مربی گرامی"}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {data.staffProfile?.title || "سرمربی بدنسازی و فیتنس"}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1">
                کد پرسنلی: <span className="font-mono text-amber-300">{data.staffProfile?.employeeCode || "TRN-001"}</span> | مدیریت شاگردان و طراحی تمرینات باشگاه
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (data.assignments[0]?.member?.id) {
                  setSelectedMemberId(data.assignments[0].member.id);
                }
                setShowRoutineModal(true);
              }}
              className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/30"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" />
              </svg>
              <span>برنامه تمرینی جدید</span>
            </button>
            <button
              onClick={() => {
                if (data.assignments[0]?.member?.id) {
                  setSelectedMemberId(data.assignments[0].member.id);
                }
                setShowProgressModal(true);
              }}
              className="btn-glass rounded-xl px-4 py-2.5 text-xs font-bold text-amber-300 hover:text-white flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
              </svg>
              <span>ثبت رکورد و آنالیز</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[
          {
            title: "ورزشکاران تحت نظر",
            value: data.stats.activeAthletesCount,
            suffix: "نفر فعال",
            icon: "👥",
            gradient: "from-amber-500/20 to-orange-500/5",
            border: "border-amber-500/30",
            textColor: "text-amber-400",
          },
          {
            title: "برنامه‌های تمرینی فعال",
            value: data.stats.activeRoutinesCount,
            suffix: "برنامه اختصاصی",
            icon: "📋",
            gradient: "from-blue-500/20 to-cyan-500/5",
            border: "border-blue-500/30",
            textColor: "text-blue-400",
          },
          {
            title: "کلاس‌ها و کارگاه‌ها",
            value: data.classes.length,
            suffix: "سانس زمان‌بندی",
            icon: "⏱️",
            gradient: "from-emerald-500/20 to-teal-500/5",
            border: "border-emerald-500/30",
            textColor: "text-emerald-400",
          },
          {
            title: "رکوردهای ثبت‌شده",
            value: data.recentProgress.length,
            suffix: "سنجش پیشرفت",
            icon: "📈",
            gradient: "from-purple-500/20 to-pink-500/5",
            border: "border-purple-500/30",
            textColor: "text-purple-400",
          },
        ].map((kpi, idx) => (
          <div
            key={kpi.title}
            className={`glass p-4 sm:p-5 rounded-2xl border ${kpi.border} bg-gradient-to-br ${kpi.gradient} anim-scale-in`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white/60">{kpi.title}</span>
              <span className="text-lg">{kpi.icon}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-extrabold ${kpi.textColor}`}>
                {kpi.value}
              </span>
              <span className="text-[10px] text-white/40">{kpi.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assigned Athletes & Active Routines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Athletes */}
          <div className="glass p-5 sm:p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                  👥
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">ورزشکاران اختصاصی من</h2>
                  <p className="text-[10px] text-white/40">ورزشکارانی که شما به عنوان مربی آنها تعیین شده‌اید</p>
                </div>
              </div>
              <Link
                href="/trainer/members"
                className="text-xs text-amber-300 hover:text-amber-200 transition-colors font-bold"
              >
                مشاهده همه ({data.assignments.length}) ←
              </Link>
            </div>

            {data.assignments.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-xs glass rounded-2xl">
                در حال حاضر ورزشکاری به شما اختصاص داده نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.assignments.map((assignment: any) => {
                  const member = assignment.member;
                  const activeSub = member?.subscriptions?.[0];
                  const activeRoutine = member?.workoutRoutines?.[0];
                  const lastProgress = member?.progressEntries?.[0];

                  return (
                    <div
                      key={assignment.id}
                      className="glass-card p-4 rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                          {member?.user?.name ? member.user.name.charAt(0) : "و"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{member?.user?.name}</p>
                          <p className="text-[10px] text-white/40 font-mono">{member?.membershipCode || member?.user?.phone}</p>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          {activeSub?.plan?.name || "فعال"}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-white/60 mb-3 bg-white/[0.02] p-2.5 rounded-xl">
                        <div className="flex justify-between">
                          <span>برنامه تمرینی:</span>
                          <span className="text-white font-semibold truncate max-w-[140px]">
                            {activeRoutine?.title || "بدون برنامه"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>آخرین سنجش وزن:</span>
                          <span className="text-amber-300 font-mono font-bold">
                            {lastProgress ? `${lastProgress.value} ${lastProgress.unit || "kg"}` : "ثبت‌نشده"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                        <button
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            setShowRoutineModal(true);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-[10px] transition-colors text-center"
                        >
                          تغییر برنامه
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            setShowProgressModal(true);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 text-white/70 hover:text-white font-bold text-[10px] transition-colors text-center"
                        >
                          ثبت رکورد
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Workout Routines List */}
          <div className="glass p-5 sm:p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                  📋
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">برنامه‌های تمرینی فعال شاگردان</h2>
                  <p className="text-[10px] text-white/40">لیست آخرین برنامه‌های طراحی‌شده توسط شما</p>
                </div>
              </div>
              <Link href="/trainer/routines" className="text-xs text-blue-300 hover:text-blue-200 font-bold">
                مشاهده همه ({data.routines.length}) ←
              </Link>
            </div>

            {data.routines.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-xs glass rounded-2xl">
                هنوز برنامه تمرینی ثبت نشده است. روی دکمه «برنامه تمرینی جدید» کلیک کنید.
              </div>
            ) : (
              <div className="space-y-3">
                {data.routines.slice(0, 3).map((rtn: any) => (
                  <div
                    key={rtn.id}
                    className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rtn.title}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                          {rtn.difficulty || "متوسط"}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1">
                        برای ورزشکار: <span className="text-white font-bold">{rtn.member?.user?.name || "عضو"}</span> | روزهای تمرین: {rtn.scheduledDays || "شنبه، دوشنبه، چهارشنبه"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-300 font-mono font-bold bg-white/5 px-2.5 py-1 rounded-xl">
                        {rtn.tasks?.length || 0} حرکت
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Classes & Recent Progress */}
        <div className="space-y-6">
          {/* Upcoming Classes */}
          <div className="glass p-5 sm:p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">⏱️</span>
                <h2 className="text-sm font-bold text-white">کلاس‌ها و کارگاه‌های من</h2>
              </div>
              <Link href="/trainer/classes" className="text-xs text-amber-300 hover:text-amber-200 font-bold">
                مشاهده همه ←
              </Link>
            </div>

            {data.classes.length === 0 ? (
              <div className="text-center py-6 text-white/40 text-xs glass rounded-2xl">
                کلاسی برای شما تعریف نشده است.
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.classes.map((cls: any) => (
                  <div key={cls.id} className="glass-card p-3.5 rounded-2xl border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{cls.title}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        {cls.category || "فیتنس"}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50">{cls.location || "سالن اصلی"}</p>
                    <div className="flex items-center justify-between text-[10px] text-amber-300 pt-1 border-t border-white/5">
                      <span>ظرفیت: {cls.capacity || 15} نفر</span>
                      <span>{cls.bookings?.length || 0} ثبت‌نام</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Progress Logs */}
          <div className="glass p-5 sm:p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📈</span>
                <h2 className="text-sm font-bold text-white">آخرین رکوردهای ثبت‌شده</h2>
              </div>
              <Link href="/trainer/progress" className="text-xs text-purple-300 hover:text-purple-200 font-bold">
                مشاهده همه ←
              </Link>
            </div>

            {data.recentProgress.length === 0 ? (
              <div className="text-center py-6 text-white/40 text-xs glass rounded-2xl">
                هنوز رکوردی ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.recentProgress.slice(0, 4).map((prg: any) => (
                  <div key={prg.id} className="glass-card p-3 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{prg.member?.user?.name || "ورزشکار"}</p>
                      <p className="text-[10px] text-white/40">{prg.metricType === "WEIGHT" ? "وزن" : prg.metricType === "BODY_FAT" ? "درصد چربی" : prg.metricType} | {prg.notes || "بدون یادداشت"}</p>
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-extrabold text-amber-400 font-mono">
                        {prg.value} {prg.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Routine Modal */}
      {showRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade-in">
          <div className="glass-strong max-w-lg w-full p-6 rounded-3xl border border-white/20 max-h-[90vh] overflow-y-auto space-y-4 anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h3 className="text-base font-bold text-white">طراحی برنامه تمرینی جدید</h3>
              </div>
              <button
                onClick={() => setShowRoutineModal(false)}
                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {routineMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold text-center border border-emerald-500/30">
                {routineMsg}
              </div>
            )}

            <form onSubmit={handleCreateRoutine} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-white/70">انتخاب ورزشکار</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs bg-slate-900/80 text-white"
                  required
                >
                  {data.allMembers.map((m: any) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.user?.name || "عضو"} ({m.membershipCode || m.user?.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">عنوان برنامه</label>
                  <input
                    type="text"
                    value={routineTitle}
                    onChange={(e) => setRoutineTitle(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">سطح برنامه</label>
                  <select
                    value={routineDifficulty}
                    onChange={(e) => setRoutineDifficulty(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs bg-slate-900/80 text-white"
                  >
                    <option value="مبتدی" className="bg-slate-900">مبتدی</option>
                    <option value="متوسط" className="bg-slate-900">متوسط</option>
                    <option value="پیشرفته" className="bg-slate-900">پیشرفته</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">هدف تمرینی</label>
                  <input
                    type="text"
                    value={routineGoal}
                    onChange={(e) => setRoutineGoal(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">روزهای تمرین</label>
                  <input
                    type="text"
                    value={routineDays}
                    onChange={(e) => setRoutineDays(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white">حرکات و ست‌های تمرینی</label>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="text-[10px] font-bold text-amber-300 hover:text-amber-200"
                  >
                    + افزودن حرکت
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {tasks.map((task, idx) => (
                    <div key={idx} className="glass p-2.5 rounded-xl border border-white/10 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="نام حرکت"
                        value={task.exerciseName}
                        onChange={(e) => handleTaskChange(idx, "exerciseName", e.target.value)}
                        className="input-glass flex-1 rounded-lg px-2.5 py-1 text-xs"
                        required
                      />
                      <input
                        type="number"
                        placeholder="ست"
                        value={task.sets}
                        onChange={(e) => handleTaskChange(idx, "sets", e.target.value)}
                        className="input-glass w-14 rounded-lg px-2 py-1 text-xs text-center font-mono"
                        min={1}
                        required
                      />
                      <input
                        type="text"
                        placeholder="تکرار"
                        value={task.reps}
                        onChange={(e) => handleTaskChange(idx, "reps", e.target.value)}
                        className="input-glass w-16 rounded-lg px-2 py-1 text-xs text-center font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-white/70">توصیه و یادداشت مربی</label>
                <textarea
                  value={trainerNote}
                  onChange={(e) => setTrainerNote(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs h-16 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowRoutineModal(false)}
                  className="btn-glass rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={routineLoading}
                  className="btn-primary rounded-xl px-5 py-2 text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                >
                  {routineLoading ? "در حال ثبت..." : "تخصیص برنامه به ورزشکار"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade-in">
          <div className="glass-strong max-w-sm w-full p-6 rounded-3xl border border-white/20 space-y-4 anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <h3 className="text-base font-bold text-white">ثبت شاخص و رکورد ورزشکار</h3>
              </div>
              <button
                onClick={() => setShowProgressModal(false)}
                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {progressMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold text-center border border-emerald-500/30">
                {progressMsg}
              </div>
            )}

            <form onSubmit={handleRecordProgress} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-white/70">ورزشکار</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs bg-slate-900/80 text-white"
                  required
                >
                  {data.allMembers.map((m: any) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.user?.name || "عضو"} ({m.membershipCode || m.user?.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">نوع شاخص</label>
                  <select
                    value={progressMetric}
                    onChange={(e) => setProgressMetric(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs bg-slate-900/80 text-white"
                  >
                    <option value="WEIGHT" className="bg-slate-900">وزن بدن (kg)</option>
                    <option value="BODY_FAT" className="bg-slate-900">درصد چربی (%)</option>
                    <option value="CHEST" className="bg-slate-900">دور سینه (cm)</option>
                    <option value="ARM" className="bg-slate-900">دور بازو (cm)</option>
                    <option value="WAIST" className="bg-slate-900">دور کمر (cm)</option>
                    <option value="BENCH_PRESS" className="bg-slate-900">رکورد پرس سینه (kg)</option>
                    <option value="SQUAT" className="bg-slate-900">رکورد اسکات (kg)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">مقدار</label>
                  <input
                    type="number"
                    step="0.1"
                    value={progressVal}
                    onChange={(e) => setProgressVal(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs text-center font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-white/70">یادداشت ارزیابی</label>
                <input
                  type="text"
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
                  className="btn-glass rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={progressLoading}
                  className="btn-primary rounded-xl px-5 py-2 text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                >
                  {progressLoading ? "در حال ثبت..." : "ثبت رکورد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

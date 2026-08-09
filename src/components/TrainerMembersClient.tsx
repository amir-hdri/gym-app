"use client";

import { useState } from "react";
import Link from "next/link";
import { createTrainerWorkoutRoutine, recordTrainerAthleteProgress } from "@/server/actions/trainer-panel";

export default function TrainerMembersClient({ data }: { data: any }) {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Form states
  const [routineTitle, setRoutineTitle] = useState("برنامه تمرینی اختصاصی فاز ۲");
  const [routineGoal, setRoutineGoal] = useState("افزایش حجم و تفکیک عضلانی");
  const [routineDifficulty, setRoutineDifficulty] = useState("متوسط");
  const [routineDays, setRoutineDays] = useState("شنبه، دوشنبه، چهارشنبه");
  const [tasks, setTasks] = useState([
    { exerciseName: "پرس بالا سینه دمبل", sets: 4, reps: "10-12", notes: "تمرکز بر کشش کامل" },
    { exerciseName: "لت لت دست جمع", sets: 3, reps: "12", notes: "" },
    { exerciseName: "جلو بازو هالتر ایستاده", sets: 3, reps: "10", notes: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const [progressMetric, setProgressMetric] = useState("WEIGHT");
  const [progressVal, setProgressVal] = useState("68.0");
  const [progressNotes, setProgressNotes] = useState("ارزیابی میان‌دوره");

  const filtered = (data.assignments || []).filter((a: any) => {
    const name = a.member?.user?.name || "";
    const phone = a.member?.user?.phone || "";
    const code = a.member?.membershipCode || "";
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || phone.includes(q) || code.toLowerCase().includes(q);
  });

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setLoading(true);
    try {
      await createTrainerWorkoutRoutine({
        memberId: selectedMember.id,
        title: routineTitle,
        goal: routineGoal,
        difficulty: routineDifficulty,
        scheduledDays: routineDays,
        tasks: tasks.filter((t) => t.exerciseName.trim().length > 0),
      });
      alert("✅ برنامه تمرینی با موفقیت ثبت شد!");
      setShowRoutineModal(false);
    } catch (err: any) {
      alert(err.message || "خطا");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    const val = parseFloat(progressVal);
    if (isNaN(val)) return;
    setLoading(true);
    try {
      await recordTrainerAthleteProgress({
        memberId: selectedMember.id,
        metricType: progressMetric,
        value: val,
        notes: progressNotes,
      });
      alert("✅ شاخص با موفقیت ثبت شد!");
      setShowProgressModal(false);
    } catch (err: any) {
      alert(err.message || "خطا");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">ورزشکاران تحت نظر</h1>
          <p className="text-xs text-white/50 mt-1">مدیریت شاگردان اختصاصی، برنامه‌های تمرینی و سوابق بدنی</p>
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="جستجوی نام یا شماره تلفن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass w-full rounded-xl px-3.5 py-2 text-xs"
          />
        </div>
      </div>

      {/* Athletes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((assignment: any) => {
          const member = assignment.member;
          const user = member?.user;
          const sub = member?.subscriptions?.[0];
          const routine = member?.workoutRoutines?.[0];
          const lastProg = member?.progressEntries?.[0];

          return (
            <div
              key={assignment.id}
              className="glass p-5 rounded-3xl border border-white/10 hover:border-amber-500/30 transition-all space-y-4 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shrink-0">
                    {user?.name?.charAt(0) || "و"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{user?.name}</h3>
                    <p className="text-[10px] text-white/40 font-mono">{member?.membershipCode} | {user?.phone}</p>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {sub?.plan?.name || "طرح فعال"}
                </span>
              </div>

              <div className="space-y-2 text-xs bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                <div className="flex justify-between">
                  <span className="text-white/50">برنامه تمرینی:</span>
                  <span className="text-white font-semibold truncate max-w-[150px]">{routine?.title || "تعریف‌نشده"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">آخرین وزن ثبت‌شده:</span>
                  <span className="text-amber-300 font-mono font-bold">
                    {lastProg ? `${lastProg.value} ${lastProg.unit || "kg"}` : "ثبت‌نشده"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">هدف شاگرد:</span>
                  <span className="text-white/80">{assignment.note || "تناسب اندام"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setSelectedMember(member);
                    setShowRoutineModal(true);
                  }}
                  className="btn-glass rounded-xl py-2 text-xs font-bold text-amber-300 hover:text-white text-center"
                >
                  طراحی برنامه
                </button>
                <button
                  onClick={() => {
                    setSelectedMember(member);
                    setShowProgressModal(true);
                  }}
                  className="btn-primary rounded-xl py-2 text-xs font-bold text-center"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                >
                  ثبت رکورد
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Routine Modal */}
      {showRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade-in">
          <div className="glass-strong max-w-lg w-full p-6 rounded-3xl border border-white/20 max-h-[90vh] overflow-y-auto space-y-4 anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm sm:text-base font-bold text-white">
                طراحی برنامه برای: {selectedMember?.user?.name}
              </h3>
              <button onClick={() => setShowRoutineModal(false)} className="text-white/60 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateRoutine} className="space-y-3.5">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">حرکات</span>
                  <button
                    type="button"
                    onClick={() => setTasks([...tasks, { exerciseName: "", sets: 3, reps: "12", notes: "" }])}
                    className="text-[10px] text-amber-300 font-bold"
                  >
                    + افزودن
                  </button>
                </div>
                {tasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="حرکت"
                      value={task.exerciseName}
                      onChange={(e) => {
                        const n = [...tasks];
                        n[idx].exerciseName = e.target.value;
                        setTasks(n);
                      }}
                      className="input-glass flex-1 rounded-lg px-2 py-1 text-xs"
                      required
                    />
                    <input
                      type="number"
                      placeholder="ست"
                      value={task.sets}
                      onChange={(e) => {
                        const n = [...tasks];
                        n[idx].sets = parseInt(e.target.value) || 3;
                        setTasks(n);
                      }}
                      className="input-glass w-14 rounded-lg px-1 py-1 text-xs text-center"
                    />
                    <input
                      type="text"
                      placeholder="تکرار"
                      value={task.reps}
                      onChange={(e) => {
                        const n = [...tasks];
                        n[idx].reps = e.target.value;
                        setTasks(n);
                      }}
                      className="input-glass w-16 rounded-lg px-1 py-1 text-xs text-center"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowRoutineModal(false)} className="btn-glass rounded-xl px-4 py-2 text-xs">
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary rounded-xl px-5 py-2 text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                >
                  {loading ? "در حال ثبت..." : "ثبت برنامه"}
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
              <h3 className="text-sm font-bold text-white">ثبت رکورد: {selectedMember?.user?.name}</h3>
              <button onClick={() => setShowProgressModal(false)} className="text-white/60 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleRecordProgress} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-white/70">شاخص</label>
                <select
                  value={progressMetric}
                  onChange={(e) => setProgressMetric(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs bg-slate-900 text-white"
                >
                  <option value="WEIGHT">وزن (kg)</option>
                  <option value="BODY_FAT">درصد چربی (%)</option>
                  <option value="BENCH_PRESS">پرس سینه (kg)</option>
                  <option value="SQUAT">اسکات (kg)</option>
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
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-white/70">یادداشت</label>
                <input
                  type="text"
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowProgressModal(false)} className="btn-glass rounded-xl px-4 py-2 text-xs">
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary rounded-xl px-5 py-2 text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                >
                  {loading ? "در حال ثبت..." : "ذخیره رکورد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

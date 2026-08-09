"use client";

import { useState } from "react";
import { createTrainerWorkoutRoutine } from "@/server/actions/trainer-panel";

export default function TrainerRoutinesClient({ data }: { data: any }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(data.allMembers[0]?.id || "");
  const [title, setTitle] = useState("برنامه تمرینی اختصاصی فاز ۲");
  const [goal, setGoal] = useState("هایپرتروفی و افزایش توان عضلانی");
  const [difficulty, setDifficulty] = useState("متوسط");
  const [scheduledDays, setScheduledDays] = useState("شنبه، دوشنبه، چهارشنبه");
  const [scheduledTime, setScheduledTime] = useState("18:00");
  const [trainerNote, setTrainerNote] = useState("فرم صحیح حرکات اولویت اول است.");
  const [tasks, setTasks] = useState([
    { exerciseName: "پرس سینه هالتر", sets: 4, reps: "10-12", notes: "تمرکز بر انقباض" },
    { exerciseName: "اسکات پا هالتر", sets: 4, reps: "8-10", notes: "فرم صحیح" },
    { exerciseName: "لت زیربغل سیم‌کش", sets: 3, reps: "12", notes: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTrainerWorkoutRoutine({
        memberId: selectedMemberId,
        title,
        goal,
        difficulty,
        scheduledDays,
        scheduledTime,
        trainerNote,
        tasks: tasks.filter((t) => t.exerciseName.trim().length > 0),
      });
      alert("✅ برنامه تمرینی با موفقیت ایجاد شد!");
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || "خطا");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">برنامه‌های تمرینی شاگردان</h1>
          <p className="text-xs text-white/50 mt-1">طراحی، ویرایش و مدیریت برنامه‌های بدنسازی و فیتنس</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
        >
          <span>+ طراحی برنامه جدید</span>
        </button>
      </div>

      <div className="space-y-4">
        {data.routines.map((rtn: any) => (
          <div key={rtn.id} className="glass p-5 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-white">{rtn.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {rtn.difficulty || "متوسط"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    فعال
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  ورزشکار: <span className="text-white font-bold">{rtn.member?.user?.name || "عضو"}</span> | هدف: {rtn.goal || "تناسب اندام"} | روزها: {rtn.scheduledDays || "شنبه، دوشنبه، چهارشنبه"}
                </p>
              </div>
              <div className="text-left">
                <span className="text-xs text-amber-300 font-bold font-mono bg-white/5 px-3 py-1.5 rounded-xl">
                  {rtn.tasks?.length || 0} حرکت ورزشی
                </span>
              </div>
            </div>

            {/* Tasks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(rtn.tasks || []).map((t: any, idx: number) => (
                <div key={t.id || idx} className="glass-card p-3 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold">حرکت {idx + 1}</span>
                  <p className="text-xs font-bold text-white truncate">{t.exerciseName}</p>
                  <p className="text-[11px] text-white/60 font-mono">{t.sets} ست × {t.reps} تکرار</p>
                  {t.notes && <p className="text-[10px] text-white/40 italic truncate">{t.notes}</p>}
                </div>
              ))}
            </div>

            {rtn.trainerNote && (
              <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5 text-[11px] text-white/70">
                <span className="text-amber-300 font-bold">💡 یادداشت مربی:</span> {rtn.trainerNote}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Routine Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade-in">
          <div className="glass-strong max-w-lg w-full p-6 rounded-3xl border border-white/20 max-h-[90vh] overflow-y-auto space-y-4 anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">طراحی برنامه تمرینی جدید</h3>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-white/70">ورزشکار</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs bg-slate-900 text-white"
                  required
                >
                  {data.allMembers.map((m: any) => (
                    <option key={m.id} value={m.id} className="bg-slate-900">
                      {m.user?.name} ({m.membershipCode || m.user?.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">عنوان برنامه</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-glass w-full rounded-xl px-3 py-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">سطح</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-glass w-full rounded-xl px-3 py-2 text-xs bg-slate-900 text-white">
                    <option value="مبتدی">مبتدی</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">هدف تمرینی</label>
                  <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} className="input-glass w-full rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">روزهای تمرین</label>
                  <input type="text" value={scheduledDays} onChange={(e) => setScheduledDays(e.target.value)} className="input-glass w-full rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">حرکات تمرینی</span>
                  <button type="button" onClick={() => setTasks([...tasks, { exerciseName: "", sets: 3, reps: "12", notes: "" }])} className="text-[10px] text-amber-300 font-bold">+ افزودن حرکت</button>
                </div>
                {tasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="text" placeholder="نام حرکت" value={task.exerciseName} onChange={(e) => { const n = [...tasks]; n[idx].exerciseName = e.target.value; setTasks(n); }} className="input-glass flex-1 rounded-lg px-2.5 py-1 text-xs" required />
                    <input type="number" placeholder="ست" value={task.sets} onChange={(e) => { const n = [...tasks]; n[idx].sets = parseInt(e.target.value) || 3; setTasks(n); }} className="input-glass w-14 rounded-lg px-1 py-1 text-xs text-center" />
                    <input type="text" placeholder="تکرار" value={task.reps} onChange={(e) => { const n = [...tasks]; n[idx].reps = e.target.value; setTasks(n); }} className="input-glass w-16 rounded-lg px-1 py-1 text-xs text-center" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-white/70">یادداشت مربی</label>
                <textarea value={trainerNote} onChange={(e) => setTrainerNote(e.target.value)} className="input-glass w-full rounded-xl px-3 py-2 text-xs h-16 resize-none" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-glass rounded-xl px-4 py-2 text-xs">انصراف</button>
                <button type="submit" disabled={loading} className="btn-primary rounded-xl px-5 py-2 text-xs font-bold" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                  {loading ? "در حال ثبت..." : "ثبت برنامه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { recordTrainerAthleteProgress } from "@/server/actions/trainer-panel";

export default function TrainerProgressClient({ data }: { data: any }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(data.allMembers[0]?.id || "");
  const [metricType, setMetricType] = useState("WEIGHT");
  const [value, setValue] = useState("70.0");
  const [notes, setNotes] = useState("سنجش ماهانه بدنی");
  const [loading, setLoading] = useState(false);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setLoading(true);
    try {
      await recordTrainerAthleteProgress({
        memberId: selectedMemberId,
        metricType,
        value: num,
        notes,
      });
      alert("✅ رکورد با موفقیت ثبت شد!");
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
          <h1 className="text-xl sm:text-2xl font-bold text-white">ثبت شاخص‌های بدنی و پیشرفت</h1>
          <p className="text-xs text-white/50 mt-1">سنجش وزن، درصد چربی و رکوردهای قدرتی شاگردان</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
        >
          <span>+ ثبت شاخص جدید</span>
        </button>
      </div>

      <div className="glass p-5 sm:p-6 rounded-3xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 pb-2">
                <th className="py-2.5 px-3">نام ورزشکار</th>
                <th className="py-2.5 px-3">نوع شاخص</th>
                <th className="py-2.5 px-3">مقدار ثبت‌شده</th>
                <th className="py-2.5 px-3">تاریخ ارزیابی</th>
                <th className="py-2.5 px-3">یادداشت مربی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.recentProgress.map((prg: any) => (
                <tr key={prg.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{prg.member?.user?.name || "ورزشکار"}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      {prg.metricType === "WEIGHT"
                        ? "وزن بدن"
                        : prg.metricType === "BODY_FAT"
                        ? "درصد چربی"
                        : prg.metricType === "BENCH_PRESS"
                        ? "پرس سینه"
                        : prg.metricType === "SQUAT"
                        ? "اسکات"
                        : prg.metricType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-white text-sm">
                    {prg.value} {prg.unit || "kg"}
                  </td>
                  <td className="py-3 px-3 text-white/50 text-[11px]">
                    {new Date(prg.measuredAt || prg.createdAt).toLocaleDateString("fa-IR")}
                  </td>
                  <td className="py-3 px-3 text-white/70">{prg.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade-in">
          <div className="glass-strong max-w-sm w-full p-6 rounded-3xl border border-white/20 space-y-4 anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">ثبت شاخص و رکورد</h3>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleRecord} className="space-y-3.5">
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
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">نوع شاخص</label>
                  <select
                    value={metricType}
                    onChange={(e) => setMetricType(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs bg-slate-900 text-white"
                  >
                    <option value="WEIGHT">وزن (kg)</option>
                    <option value="BODY_FAT">درصد چربی (%)</option>
                    <option value="BENCH_PRESS">پرس سینه (kg)</option>
                    <option value="SQUAT">اسکات (kg)</option>
                    <option value="DEADLIFT">ددلیفت (kg)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">مقدار</label>
                  <input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs text-center font-mono font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-white/70">یادداشت ارزیابی</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-glass rounded-xl px-4 py-2 text-xs">
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

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleWorkoutTaskLog } from "@/server/actions/workouts";

interface WorkoutTask {
  id: string;
  exerciseName: string;
  sets: number;
  reps: string;
  notes?: string | null;
  logs: Array<{ dateStr: string; completed: boolean; setsData?: string | null }>;
}

interface WorkoutTodoListProps {
  initialRoutine: {
    id: string;
    title: string;
    tasks: WorkoutTask[];
  } | null;
  userId: string;
}

interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
}

export default function WorkoutTodoList({ initialRoutine, userId }: WorkoutTodoListProps) {
  const router = useRouter();
  const [routine, setRoutine] = useState(initialRoutine);
  const [isPending, startTransition] = useTransition();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Track temporary set inputs for each task
  const [tempSetData, setTempSetData] = useState<Record<string, SetLog[]>>({});

  // Use UTC YYYY-MM-DD to match server logic and avoid timezone drift
  const todayStr = new Date().toISOString().split("T")[0];

  const handleToggleQuick = (taskId: string, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted;

    // Optimistically update UI
    if (routine) {
      const updatedTasks = routine.tasks.map((t) => {
        if (t.id === taskId) {
          const filteredLogs = t.logs.filter((l) => l.dateStr !== todayStr);
          const nextLogs = nextCompleted
            ? [...filteredLogs, { dateStr: todayStr, completed: true, setsData: null }]
            : filteredLogs;
          return { ...t, logs: nextLogs };
        }
        return t;
      });
      setRoutine({ ...routine, tasks: updatedTasks });
    }

    startTransition(async () => {
      try {
        await toggleWorkoutTaskLog(taskId, userId, todayStr, nextCompleted);
      } catch {
        alert("خطا در ذخیره‌سازی وضعیت تمرین");
        router.refresh();
      }
    });
  };

  const handleSaveSets = (taskId: string, taskSetsCount: number, taskDefaultReps: string) => {
    const setsToSave =
      tempSetData[taskId] ||
      Array.from({ length: taskSetsCount }, (_, i) => ({
        setNumber: i + 1,
        weight: 0,
        reps: parseInt(taskDefaultReps) || 12,
      }));

    const serialized = JSON.stringify(setsToSave);

    // Optimistically update UI
    if (routine) {
      const updatedTasks = routine.tasks.map((t) => {
        if (t.id === taskId) {
          const filteredLogs = t.logs.filter((l) => l.dateStr !== todayStr);
          return {
            ...t,
            logs: [...filteredLogs, { dateStr: todayStr, completed: true, setsData: serialized }],
          };
        }
        return t;
      });
      setRoutine({ ...routine, tasks: updatedTasks });
    }

    startTransition(async () => {
      try {
        await toggleWorkoutTaskLog(taskId, userId, todayStr, true, serialized);
        setExpandedTaskId(null);
      } catch {
        alert("خطا در ذخیره‌سازی رکوردها");
        router.refresh();
      }
    });
  };

  const handleSetInputChange = (
    taskId: string,
    setIndex: number,
    field: "weight" | "reps",
    val: string
  ) => {
    const parsed = parseInt(val) || 0;
    const task = routine?.tasks.find((t) => t.id === taskId);
    const setsCount = task?.sets || 3;
    const defaultReps = parseInt(task?.reps || "12") || 12;

    const currentSets =
      tempSetData[taskId] ||
      Array.from({ length: setsCount }, (_, i) => ({
        setNumber: i + 1,
        weight: 0,
        reps: defaultReps,
      }));

    const updatedSets = currentSets.map((s, idx) => {
      if (idx === setIndex) {
        return { ...s, [field]: parsed };
      }
      return s;
    });

    setTempSetData({ ...tempSetData, [taskId]: updatedSets });
  };

  if (!routine) {
    return (
      <div className="glass-card p-4 sm:p-5 text-center text-xs text-white/35 anim-fade-up">
        <svg
          className="w-8 h-8 mx-auto mb-2 text-white/20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
        </svg>
        <p className="font-semibold text-white/50">برنامه تمرینی امروز</p>
        <p className="mt-1 text-[11px] leading-relaxed">
          هنوز برنامه‌ای برای شما تعریف نشده است. مربی به زودی برنامه شما را وارد می‌کند.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-3.5 sm:p-4 anim-fade-up text-right space-y-2.5 sm:space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <h3 className="text-xs font-semibold text-white/80">برنامه امروز: {routine.title}</h3>
        <span className="text-[10px] text-cyan-400 font-bold">کارهای امروز</span>
      </div>

      <div className="space-y-2">
        {routine.tasks.map((task) => {
          const todayLog = task.logs.find((l) => l.dateStr === todayStr);
          const isDone = !!todayLog?.completed;
          const isExpanded = expandedTaskId === task.id;

          let loggedSets: SetLog[] = [];
          if (todayLog?.setsData) {
            try {
              loggedSets = JSON.parse(todayLog.setsData);
            } catch {}
          }

          return (
            <div key={task.id} className="glass-card border border-white/[0.04] overflow-hidden transition-all">
              <div
                className={`flex items-center justify-between p-2.5 sm:p-3 transition-all cursor-pointer ${
                  isDone ? "bg-emerald-950/15" : "hover:bg-white/[0.015]"
                }`}
                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
              >
                <div className="flex items-center gap-2.5">
                  {/* Action checkbox with generous touch target */}
                  <div aria-label="پایش تمرین روزانه"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleQuick(task.id, isDone);
                    }}
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                      isDone
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                        : "border-white/30 hover:border-white/60 bg-white/[0.02]"
                    }`}
                  >
                    {isDone && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  <div className="text-right">
                    <p className={`text-xs font-semibold ${isDone ? "text-emerald-300 opacity-90" : "text-white"}`}>
                      {task.exerciseName}
                    </p>
                    {task.notes && (
                      <p className="text-[9px] text-white/35 mt-0.5">{task.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isDone ? "bg-emerald-500/10 text-emerald-400" : "bg-cyan-500/10 text-cyan-400"
                    }`}
                  >
                    {task.sets} ست × {task.reps}
                  </span>

                  {/* Dropdown arrow */}
                  <svg
                    className={`w-3.5 h-3.5 text-white/40 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Accordion Content for Set Tracker */}
              {isExpanded && (
                <div aria-expanded={isExpanded} aria-label="جزئیات ست‌های تمرینی" className="p-3 bg-black/25 border-t border-white/[0.04] space-y-2.5 anim-fade-in">
                  <p className="text-[9px] text-white/40 mb-1">
                    برای پایش قدرت، وزنه و تکرار هر ست را وارد کنید:
                  </p>

                  <div className="space-y-1.5">
                    {Array.from({ length: task.sets }).map((_, idx) => {
                      const existingSet = loggedSets.find((s) => s.setNumber === idx + 1);
                      const currentVal = tempSetData[task.id]?.[idx] || {
                        weight: existingSet?.weight || 0,
                        reps: existingSet?.reps || parseInt(task.reps) || 12,
                      };

                      return (
                        <div key={idx} className="grid grid-cols-3 gap-2 items-center text-right">
                          <span className="text-[10px] text-white/40 font-mono">ست {idx + 1}</span>

                          <div>
                            <input
                              type="number"
                              placeholder="وزن (kg)"
                              value={currentVal.weight || ""}
                              onChange={(e) =>
                                handleSetInputChange(task.id, idx, "weight", e.target.value)
                              }
                              className="input-glass w-full rounded-lg px-2 py-1 text-[11px] text-left font-mono"
                              dir="ltr"
                            />
                          </div>

                          <div>
                            <input
                              type="number"
                              placeholder="تکرار"
                              value={currentVal.reps || ""}
                              onChange={(e) =>
                                handleSetInputChange(task.id, idx, "reps", e.target.value)
                              }
                              className="input-glass w-full rounded-lg px-2 py-1 text-[11px] text-left font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleSaveSets(task.id, task.sets, task.reps)}
                      disabled={isPending}
                      className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-[10px] font-bold hover:bg-emerald-500/30 transition-all"
                    >
                      {isPending ? "در حال ثبت..." : "ذخیره رکورد ست‌ها"}
                    </button>
                    {isDone && (
                      <button
                        onClick={() => handleToggleQuick(task.id, true)}
                        className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg px-3 py-1.5 text-[10px] font-bold hover:bg-rose-500/20 transition-all"
                      >
                        حذف رکورد امروز
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

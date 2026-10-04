"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, Timer, Sparkles, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { soundEngine } from "@/services/soundEngine";
import { GymBackdrop } from "./GymBackdrop";
import { formatPersianNumber } from "@/lib/utils";

export interface WorkoutPlayerExercise {
  id: string;
  name: string;
  nameFa?: string;
  targetMuscle?: string;
  targetMuscleFa?: string;
  sets: number;
  reps: string | number;
  restSecs: number;
  tips?: string;
  tipsFa?: string;
}

export interface WorkoutPlayerRoutine {
  id?: string;
  name?: string;
  title?: string;
  titleFa?: string;
  description?: string;
  exercises: WorkoutPlayerExercise[];
}

interface Props {
  isOpen: boolean;
  routine: WorkoutPlayerRoutine | null;
  onClose: () => void;
  onFinishWorkout?: () => void;
}

export function GymWorkoutPlayerModal({ isOpen, routine, onClose, onFinishWorkout }: Props) {
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(60);
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const exercises = routine?.exercises || [];
  const currentExercise = exercises[currentExIdx] || exercises[0];

  useEffect(() => {
    if (!isOpen) return;
    soundEngine.playBell(440);
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isOpen && isResting && restSecondsRemaining > 0) {
      timer = setInterval(() => {
        setRestSecondsRemaining((s) => {
          if (s <= 1) {
            setIsResting(false);
            soundEngine.playBell(587); // High bell chime when rest is complete
            return currentExercise?.restSecs || 60;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isResting, restSecondsRemaining, currentExercise?.restSecs]);

  if (!isOpen || !routine || exercises.length === 0 || !currentExercise) return null;

  const handleCompleteSet = () => {
    soundEngine.playBell(528);
    if (currentSet < currentExercise.sets) {
      setCurrentSet((s) => s + 1);
      setIsResting(true);
      setRestSecondsRemaining(currentExercise.restSecs || 60);
    } else {
      // Next exercise or finish
      if (currentExIdx < exercises.length - 1) {
        setCurrentExIdx((idx) => idx + 1);
        setCurrentSet(1);
        setIsResting(true);
        setRestSecondsRemaining(90);
      } else {
        setIsWorkoutCompleted(true);
        soundEngine.playBell(659);
        if (onFinishWorkout) onFinishWorkout();
      }
    }
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${formatPersianNumber(mins)}:${formatPersianNumber(s < 10 ? "0" : "")}${formatPersianNumber(s)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: "spring", stiffness: 450, damping: 32 }}
        className="relative w-full max-w-md rounded-[32px] overflow-hidden bg-[#10141a] border border-white/10 shadow-2xl flex flex-col text-white max-h-[92vh]"
        dir="rtl"
      >
        {/* Top Hero Art with Gym Silhouette */}
        <div className="relative h-52 w-full shrink-0">
          <GymBackdrop />

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="بستن پنجره"
          >
            <X className="w-4 h-4" />
          </motion.button>

          {/* Top Elapsed Timer Pill */}
          <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-xs text-[#d2c0a5] font-sans tabular-nums">
            <Timer className="w-3.5 h-3.5" />
            <span>زمان تمرین: {formatElapsed(elapsedSeconds)}</span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#10141a] via-transparent to-transparent" />
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-4 -mt-8 relative z-10 overflow-y-auto no-scrollbar">
          {isWorkoutCompleted ? (
            /* Workout Complete Celebration Screen */
            <div className="flex flex-col items-center justify-center text-center py-6 gap-4">
              <div className="w-20 h-20 rounded-full bg-[#18202d] border-2 border-[#d2c0a5] flex items-center justify-center text-[#d2c0a5] shadow-[0_0_24px_rgba(210,192,165,0.4)]">
                <Trophy className="w-10 h-10 stroke-[1.5]" />
              </div>
              <div>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-[#d2c0a5]">
                  تمرین با موفقیت انجام شد
                </span>
                <h2 className="font-serif text-2xl text-white font-medium mt-1">
                  خسته نباشید، عالی بود!
                </h2>
                <p className="text-xs text-[#8e98a8] mt-2 max-w-xs leading-relaxed">
                  تمام ست‌ها و حرکات برنامه با اضافه بار تدریجی به پایان رسیدند. زمان ریکاوری و تغذیه است.
                </p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 my-2">
                <div className="p-3 rounded-2xl bg-[#161a22] border border-[#232934] flex flex-col items-center">
                  <span className="text-[10px] text-[#8e98a8] uppercase font-semibold">کل زمان</span>
                  <span className="text-base font-bold text-[#d2c0a5] mt-1 tabular-nums">
                    {formatElapsed(elapsedSeconds)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#161a22] border border-[#232934] flex flex-col items-center">
                  <span className="text-[10px] text-[#8e98a8] uppercase font-semibold">حرکات انجام شده</span>
                  <span className="text-base font-bold text-white mt-1">
                    {formatPersianNumber(exercises.length)} حرکت
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-[#d2c0a5] text-[#121417] text-xs font-bold hover:bg-[#ded1bc] transition-colors shadow-lg cursor-pointer"
              >
                ثبت و بازگشت به داشبورد
              </motion.button>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-[10px] tracking-widest uppercase font-semibold text-[#d2c0a5]">
                  <span>
                    حرکت {formatPersianNumber(currentExIdx + 1)} از {formatPersianNumber(exercises.length)}
                  </span>
                  <span>·</span>
                  <span>{currentExercise.targetMuscleFa || currentExercise.targetMuscle || "عمومی"}</span>
                </div>
                <h2 className="font-serif text-2xl text-white font-medium leading-snug">
                  {currentExercise.nameFa || currentExercise.name}
                </h2>
                {(currentExercise.tipsFa || currentExercise.tips) && (
                  <p className="text-xs text-[#8e98a8] mt-1.5 leading-relaxed flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#d2c0a5] shrink-0" />
                    <span>{currentExercise.tipsFa || currentExercise.tips}</span>
                  </p>
                )}
              </div>

              {/* Set & Reps Tracker Box */}
              <div className="p-4 rounded-2xl bg-[#151922] border border-[#232934] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8e98a8] uppercase tracking-wider font-semibold">
                    ست جاری
                  </span>
                  <div className="text-xl font-medium text-white font-sans mt-0.5">
                    ست {formatPersianNumber(currentSet)} از {formatPersianNumber(currentExercise.sets)}
                  </div>
                </div>

                <div className="text-left font-sans">
                  <span className="text-[10px] text-[#8e98a8] uppercase tracking-wider font-semibold">
                    تکرار هدف
                  </span>
                  <div className="text-xl font-medium text-[#d2c0a5] font-sans mt-0.5 tabular-nums">
                    {formatPersianNumber(currentExercise.reps)}
                  </div>
                </div>
              </div>

              {/* Rest Timer or Set Complete Action */}
              <AnimatePresence mode="wait">
                {isResting ? (
                  <motion.div
                    key="resting"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 rounded-2xl bg-[#1a202c] border border-[#d2c0a5]/30 flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <span className="text-[10px] uppercase tracking-widest text-[#d2c0a5] font-semibold">
                      زمان استراحت بین ست‌ها
                    </span>
                    <div className="text-3xl font-serif text-white font-normal tabular-nums my-1">
                      {formatPersianNumber(restSecondsRemaining)} ثانیه
                    </div>
                    <div className="flex items-center gap-2 w-full mt-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setIsResting(false);
                          soundEngine.playBell(587);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#232b38] hover:bg-[#2d3748] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                      >
                        پایان زودهنگام استراحت
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setRestSecondsRemaining((s) => s + 30)}
                        className="px-4 py-2.5 rounded-xl bg-[#232b38] hover:bg-[#2d3748] text-[#d2c0a5] text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                      >
                        +۳۰ ثانیه
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="action"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleCompleteSet}
                    className="w-full py-4 rounded-xl bg-[#d2c0a5] text-[#121417] text-xs font-bold tracking-wide hover:bg-[#ded1bc] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(210,192,165,0.25)]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#121417]" />
                    <span>
                      {currentSet === currentExercise.sets && currentExIdx === exercises.length - 1
                        ? "ثبت ست نهایی و اتمام تمرین"
                        : "ثبت ست جاری و شروع استراحت"}
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

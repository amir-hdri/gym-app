"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Wind } from "lucide-react";
import { motion } from "framer-motion";
import { soundEngine } from "@/services/soundEngine";
import { formatPersianNumber } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function BreathingModal({ isOpen, onClose }: Props) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");
  const [secondsInPhase, setSecondsInPhase] = useState(4);
  const [totalCompletedCycles, setTotalCompletedCycles] = useState(0);
  const [technique, setTechnique] = useState<"Box" | "4-7-8">("Box");
  const soundType: "bowl" | "rain" | "ocean" = "bowl";
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Box: 4 - 4 - 4 - 4
  // 4-7-8: 4 - 7 - 8 - 1
  const phaseDurations = useMemo(() => {
    return technique === "Box"
      ? { Inhale: 4, Hold: 4, Exhale: 4, Rest: 4 }
      : { Inhale: 4, Hold: 7, Exhale: 8, Rest: 1 };
  }, [technique]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (isOpen && isActive) {
      if (soundEnabled && !soundEngine.getIsPlaying()) {
        soundEngine.startAmbient(soundType, 0.4);
      }

      timer = setInterval(() => {
        setSecondsInPhase((prev) => {
          if (prev <= 1) {
            setPhase((currPhase) => {
              if (currPhase === "Inhale") return "Hold";
              if (currPhase === "Hold") return "Exhale";
              if (currPhase === "Exhale") {
                if (technique === "Box") return "Rest";
                setTotalCompletedCycles((c) => c + 1);
                soundEngine.playBell(528);
                return "Inhale";
              }
              setTotalCompletedCycles((c) => c + 1);
              soundEngine.playBell(528);
              return "Inhale";
            });
            return phaseDurations[
              phase === "Inhale" ? "Hold" : phase === "Hold" ? "Exhale" : phase === "Exhale" ? "Rest" : "Inhale"
            ];
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      soundEngine.stopAmbient();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isActive, phase, technique, soundEnabled, soundType, phaseDurations]);

  if (!isOpen) return null;

  const toggleSession = () => {
    if (!isActive) {
      soundEngine.playBell(432);
      setIsActive(true);
      setPhase("Inhale");
      setSecondsInPhase(phaseDurations.Inhale);
    } else {
      setIsActive(false);
      soundEngine.stopAmbient();
    }
  };

  const handleReset = () => {
    setIsActive(false);
    soundEngine.stopAmbient();
    setPhase("Inhale");
    setSecondsInPhase(phaseDurations.Inhale);
  };

  const toggleSound = () => {
    if (soundEnabled) {
      soundEngine.stopAmbient();
      setSoundEnabled(false);
    } else {
      setSoundEnabled(true);
      if (isActive) {
        soundEngine.startAmbient(soundType, 0.4);
      }
    }
  };

  const getPhaseTitleFa = () => {
    switch (phase) {
      case "Inhale":
        return "دم عمیق (تنفس به داخل)";
      case "Hold":
        return "حبس نفس (تمرکز و آرامش)";
      case "Exhale":
        return "بازدم آرام (تخلیه کامل)";
      case "Rest":
        return "استراحت و مکث";
    }
  };

  const targetScale = !isActive
    ? 1
    : phase === "Inhale"
    ? 1.3
    : phase === "Hold"
    ? 1.3
    : 0.8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: "spring", stiffness: 450, damping: 32 }}
        className="relative w-full max-w-md rounded-[32px] overflow-hidden bg-[#10141a] border border-white/10 shadow-2xl flex flex-col text-white max-h-[92vh] p-6"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#1c2330] border border-[#2b3648] flex items-center justify-center text-[#d2c0a5]">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-white font-normal">تنفس آگاهانه و ریکاوری</h2>
              <p className="text-[11px] text-[#8e98a8]">کاهش کورتیزول و ضربان قلب پس از تمرین</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                soundEnabled
                  ? "border-[#d2c0a5]/40 bg-[#1e2532] text-[#d2c0a5]"
                  : "border-white/10 bg-[#141820] text-[#7d8694]"
              }`}
              title={soundEnabled ? "قطع صدا" : "پخش صدای پس‌زمینه"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                soundEngine.stopAmbient();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-[#181d24] border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Technique selector tabs */}
        <div className="grid grid-cols-2 gap-2 my-4">
          <button
            onClick={() => {
              setTechnique("Box");
              handleReset();
            }}
            className={`py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              technique === "Box"
                ? "bg-[#202734] border-[#d2c0a5]/50 text-[#d2c0a5]"
                : "bg-[#141820] border-[#232934] text-[#8e98a8] hover:text-white"
            }`}
          >
            تنفس مربعی (۴-۴-۴-۴)
          </button>
          <button
            onClick={() => {
              setTechnique("4-7-8");
              handleReset();
            }}
            className={`py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              technique === "4-7-8"
                ? "bg-[#202734] border-[#d2c0a5]/50 text-[#d2c0a5]"
                : "bg-[#141820] border-[#232934] text-[#8e98a8] hover:text-white"
            }`}
          >
            آرامش عمیق (۴-۷-۸)
          </button>
        </div>

        {/* Breathing Animated Orb */}
        <div className="relative h-64 flex flex-col items-center justify-center my-2">
          {/* Outer pulsating glow rings */}
          <motion.div
            animate={{
              scale: targetScale,
              opacity: isActive ? 0.35 : 0.15,
            }}
            transition={{
              duration: isActive ? phaseDurations[phase] : 0.5,
              ease: "easeInOut",
            }}
            className="absolute w-52 h-52 rounded-full bg-[#d2c0a5] blur-2xl pointer-events-none"
          />

          {/* Main animated orb */}
          <motion.div
            animate={{
              scale: targetScale,
            }}
            transition={{
              duration: isActive ? phaseDurations[phase] : 0.5,
              ease: "easeInOut",
            }}
            className="relative w-40 h-40 rounded-full border-2 border-[#d2c0a5]/60 bg-gradient-to-br from-[#283244] via-[#1b2230] to-[#121620] shadow-[0_0_32px_rgba(210,192,165,0.25)] flex flex-col items-center justify-center p-4 text-center z-10"
          >
            <span className="text-3xl font-serif font-normal text-white tabular-nums">
              {formatPersianNumber(secondsInPhase)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#d2c0a5] mt-1 font-semibold">
              {phase}
            </span>
          </motion.div>
        </div>

        {/* Phase subtitle */}
        <div className="text-center">
          <h3 className="font-serif text-lg text-white font-medium">
            {isActive ? getPhaseTitleFa() : "آماده شروع تمرین تنفس"}
          </h3>
          <p className="text-xs text-[#8e98a8] mt-1">
            سیکل‌های تکمیل شده: {formatPersianNumber(totalCompletedCycles)} دور
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 mt-5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={toggleSession}
            className="flex-1 py-3.5 rounded-xl bg-[#d2c0a5] text-[#121417] text-xs font-bold tracking-wide hover:bg-[#ded1bc] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(210,192,165,0.25)]"
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 fill-current text-[#121417]" />
                <span>توقف موقت</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-[#121417]" />
                <span>شروع تمرین تنفس</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleReset}
            className="w-12 h-12 rounded-xl bg-[#1a202c] border border-white/10 flex items-center justify-center text-[#8e98a8] hover:text-white transition-colors cursor-pointer"
            title="شروع مجدد"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

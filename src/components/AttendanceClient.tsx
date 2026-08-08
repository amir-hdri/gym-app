"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  checkInByCode,
  checkOutByCode,
  autoCheckInOut,
  getCurrentlyInside,
} from "@/server/actions/attendance";

interface AttendanceClientProps {
  initialLogs: any[];
  managerUserId: string;
}

export default function AttendanceClient({
  initialLogs,
  managerUserId,
}: AttendanceClientProps) {
  const router = useRouter();
  const [logs] = useState(initialLogs);
  const [currentlyInside, setCurrentlyInside] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"AUTO" | "ENTRY" | "EXIT" | "INSIDE">("AUTO");
  const [code, setCode] = useState("");
  const [sessionType, setSessionType] = useState<"REGULAR" | "CLASS" | "PT">("REGULAR");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [lastActionResult, setLastActionResult] = useState<any>(null);

  // Webcam QR scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Poll currently inside members every 10 seconds (A3)
  const fetchInsideMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/qr/checkin", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.currentlyInside) {
          setCurrentlyInside(data.currentlyInside);
        }
      } else {
        const direct = await getCurrentlyInside();
        setCurrentlyInside(direct);
      }
    } catch {
      // ignore network errors
    }
  }, []);

  useEffect(() => {
    fetchInsideMembers();
    const interval = setInterval(() => {
      fetchInsideMembers();
    }, 10000); // 10 seconds polling (A3)
    return () => clearInterval(interval);
  }, [fetchInsideMembers]);

  // Live timer tick for incrementing live minutes locally every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLastActionResult(null);

    if (!code.trim()) {
      setErrorMsg("لطفاً کد عضویت یا توکن QR را وارد کنید");
      return;
    }

    executeAction(code.trim());
  };

  const executeAction = (targetCode: string) => {
    startTransition(async () => {
      try {
        let result: any;
        if (activeTab === "AUTO") {
          result = await autoCheckInOut(targetCode, managerUserId, { type: sessionType });
        } else if (activeTab === "EXIT") {
          result = await checkOutByCode(targetCode, managerUserId, { type: sessionType });
        } else {
          result = await checkInByCode(targetCode, managerUserId, { type: sessionType });
        }

        if (result.success) {
          const actionText =
            result.action === "CHECK_OUT"
              ? `خروج ${result.memberName || ""} با موفقیت ثبت شد (مدت حضور: ${result.durationMinutes || 1} دقیقه)`
              : `ورود ${result.memberName || ""} با موفقیت ثبت شد${
                  result.isSessionBased
                    ? ` (جلسه ${result.sessionsUsed || 1} از ${result.maxSessions || "نامحدود"})`
                    : ""
                }`;

          setSuccessMsg(actionText);
          setLastActionResult(result);
          setCode("");
          fetchInsideMembers();

          setTimeout(() => {
            setSuccessMsg("");
            router.refresh();
          }, 3000);
        } else {
          setErrorMsg(result.error || "خطا در ثبت تردد");
          setLastActionResult(result);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "خطا در برقراری ارتباط با سرور");
      }
    });
  };

  const handleQuickCheckout = (membershipCode: string) => {
    startTransition(async () => {
      try {
        const result = await checkOutByCode(membershipCode, managerUserId);
        if (result.success) {
          setSuccessMsg(`خروج ${result.memberName || "عضو"} ثبت شد (${result.durationMinutes || 1} دقیقه)`);
          fetchInsideMembers();
          router.refresh();
        } else {
          setErrorMsg(result.error || "خطا در ثبت خروج");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "خطا در ثبت خروج");
      }
    });
  };

  // Lazy load html5-qrcode and handle scanning
  useEffect(() => {
    let qrScannerInstance: any = null;

    const startScanner = async () => {
      try {
        setCameraError("");
        const { Html5Qrcode } = await import("html5-qrcode");

        qrScannerInstance = new Html5Qrcode("webcam-reader");
        await qrScannerInstance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 230, height: 230 },
          },
          (decodedText: string) => {
            setCode(decodedText);
            setIsScanning(false);
            executeAction(decodedText);
          },
          () => {
            // Ignored/Verbose logs
          }
        );
      } catch (err: any) {
        console.error("Camera scan error:", err);
        setCameraError("خطا در راه‌اندازی وب‌کم یا دوربین. لطفاً دسترسی دوربین مرورگر را بررسی کنید.");
        setIsScanning(false);
      }
    };

    if (isScanning) {
      startScanner();
    }

    return () => {
      if (qrScannerInstance && qrScannerInstance.isScanning) {
        qrScannerInstance
          .stop()
          .catch((e: any) => console.error("Scanner stop error:", e));
      }
    };
  }, [isScanning]);

  return (
    <div className="space-y-4 sm:space-y-5 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
            سیستم گیت هوشمند
          </p>
          <h1 className="text-xl sm:text-2xl font-bold gradient-text">تردد و حضور و غیاب</h1>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{currentlyInside.length} نفر حاضر در باشگاه</span>
          </div>
        </div>
      </div>

      {/* Tabs - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl glass-card border border-white/10">
        {[
          { id: "AUTO", label: "⚡ تردد خودکار (Auto)" },
          { id: "ENTRY", label: "🟢 ثبت ورود (Check-in)" },
          { id: "EXIT", label: "🔴 ثبت خروج (Check-out)" },
          { id: "INSIDE", label: `👥 حاضرین (${currentlyInside.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as any);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2.5 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center truncate ${
              activeTab === tab.id
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-950/30"
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main scanner & input form (when not in inside tab or both) */}
      {activeTab !== "INSIDE" && (
        <form
          onSubmit={handleSubmit}
          className="glass-card p-4 sm:p-5 anim-fade-up space-y-3 sm:space-y-4"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-white/50">نوع جلسه:</span>
              <div className="flex gap-1 flex-wrap">
                {(["REGULAR", "CLASS", "PT"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSessionType(t)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      sessionType === t
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-white/[0.02] text-white/40 border-white/[0.06] hover:text-white/70"
                    }`}
                  >
                    {t === "REGULAR" ? "عمومی (Regular)" : t === "CLASS" ? "کلاس گروهی" : "مربی خصوصی (PT)"}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsScanning(!isScanning)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto ${
                isScanning
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30"
              }`}
            >
              <span>{isScanning ? "لغو اسکن وب‌کم" : "اسکن زنده با وب‌کم 📸"}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center font-semibold">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl text-center font-semibold">
              {successMsg}
            </div>
          )}
          {cameraError && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3 rounded-xl text-center">
              {cameraError}
            </div>
          )}

          {/* Webcam scanner element */}
          {isScanning && (
            <div className="relative rounded-xl overflow-hidden border border-white/20 w-full max-w-sm mx-auto shadow-2xl">
              <div id="webcam-reader" className="w-full bg-black/60 aspect-video" />
              <div className="absolute inset-0 border border-cyan-500/30 pointer-events-none animate-pulse">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-cyan-400 border-dashed rounded-lg" />
              </div>
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-[10px] bg-black/70 text-cyan-400 px-2.5 py-0.5 rounded-full">
                  کد QR یا توکن چرخان را مقابل دوربین بگیرید ...
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              placeholder="کد عضویت (MEM-001) یا توکن امن QR را وارد/اسکن کنید…"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-glass flex-1 rounded-xl px-4 py-3 text-xs text-right font-mono"
            />
            <button
              type="submit"
              disabled={isPending}
              className={`rounded-xl px-5 py-3 text-xs font-bold whitespace-nowrap transition-all shadow-md ${
                activeTab === "EXIT"
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40"
                  : "btn-primary shadow-rose-950/30"
              }`}
            >
              {isPending
                ? "در حال پردازش..."
                : activeTab === "AUTO"
                ? "تردد هوشمند ⚡"
                : activeTab === "EXIT"
                ? "ثبت خروج 🔴"
                : "ثبت ورود 🟢"}
            </button>
          </div>

          <p className="text-[10px] text-white/30 text-center">
            سیستم هر دو نوع توکن امن دیجیتال چرخشی (HMAC-SHA256) و کدهای استاتیک عضویت را می‌پذیرد.
          </p>
        </form>
      )}

      {/* Last Action Card */}
      {lastActionResult && (
        <div
          className={`glass-card p-4 rounded-xl border anim-fade-up ${
            lastActionResult.success ? "border-emerald-500/30 bg-emerald-950/10" : "border-rose-500/30 bg-rose-950/10"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={lastActionResult.success ? "text-emerald-400" : "text-rose-400"}>
              {lastActionResult.action === "CHECK_OUT"
                ? "✅ خروج ثبت شد"
                : lastActionResult.success
                ? "✅ ورود ثبت شد"
                : "❌ عملیات ناموفق"}
            </span>
            <span className="text-white/60">{lastActionResult.memberName || "کاربر باشگاه"}</span>
          </div>
          {lastActionResult.durationMinutes !== undefined && (
            <p className="text-[11px] text-white/70 mt-1">
              مدت حضور در این جلسه: <span className="font-bold text-cyan-400">{lastActionResult.durationMinutes} دقیقه</span>
            </p>
          )}
          {lastActionResult.warning && (
            <p className="text-[10px] text-amber-400/90 mt-1 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              ⚠️ {lastActionResult.warning}
            </p>
          )}
        </div>
      )}

      {/* Tab: Currently Inside (A3) */}
      {activeTab === "INSIDE" ? (
        <div className="glass-card overflow-hidden anim-fade-up">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-white">افراد حاضر در باشگاه</h3>
              <p className="text-[10px] text-white/40 mt-0.5">
                به‌روزرسانی خودکار هر ۱۰ ثانیه · {currentlyInside.length} ورزشکار در حال حاضر داخل مجموعه
              </p>
            </div>
            <button
              onClick={() => fetchInsideMembers()}
              className="text-[10px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70"
            >
              🔄 رفرش دستی
            </button>
          </div>

          <div className="p-3.5 sm:p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentlyInside.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-white/30">
                در حال حاضر هیچ ورزشکاری داخل باشگاه نیست.
              </div>
            ) : (
              currentlyInside.map((person) => {
                const name = person.member?.user?.name || "ورزشکار باشگاه";
                const mCode = person.member?.membershipCode || "---";
                const checkInTime = new Date(person.checkInAt).toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const nowMs = Date.now();
                const checkInMs = new Date(person.checkInAt).getTime();
                const liveMinutes = Math.max(0, Math.floor((nowMs - checkInMs) / 60000));
                const planName = person.member?.subscriptions?.[0]?.plan?.name || "طرح آزاد";

                return (
                  <div
                    key={person.id}
                    className="glass-card p-3.5 sm:p-4 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-white">{name}</p>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5">{mCode}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
                          🟢 داخل باشگاه
                        </span>
                      </div>

                      <div className="space-y-1.5 my-3 text-[11px] bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                        <div className="flex justify-between text-white/60">
                          <span>ساعت ورود:</span>
                          <span className="font-semibold text-white font-mono">{checkInTime}</span>
                        </div>
                        <div className="flex justify-between text-white/60">
                          <span>مدت حضور زنده:</span>
                          <span className="font-bold text-cyan-400">{liveMinutes} دقیقه</span>
                        </div>
                        <div className="flex justify-between text-white/60">
                          <span>نوع طرح:</span>
                          <span className="text-white/80">{planName}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleQuickCheckout(mCode)}
                      className="btn-glass w-full rounded-xl py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
                    >
                      ثبت خروج این عضو 🔴
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Attendance History Log */
        <div className="glass-card overflow-hidden anim-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">حضورهای اخیر و گزارش ترددها</h3>
            <span className="text-xs text-white/40">{logs.length} مورد تردد ثبت‌شده</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/30">هنوز حضوری ثبت نشده است.</div>
            ) : (
              logs.map((l: any) => {
                const name = l.member?.user?.name || "کاربر باشگاه";
                const initials = name.substring(0, 2);
                const checkInTime = new Date(l.checkInAt).toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const checkInDate = new Date(l.checkInAt).toLocaleDateString("fa-IR");
                const checkOutTime = l.checkOutAt
                  ? new Date(l.checkOutAt).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;
                const isCompleted = Boolean(l.checkOutAt);

                return (
                  <div
                    key={l.id}
                    className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-3.5 hover:bg-white/[0.025] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${
                          isCompleted
                            ? "bg-slate-500/10 text-white/70 border-white/10"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-medium text-white">{name}</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                          <span className="text-[9px] sm:text-[10px] text-white/35 font-mono" dir="ltr">
                            {l.member?.membershipCode}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-white/50">
                            {l.type || "REGULAR"}
                          </span>
                          {l.method && (
                            <span className="text-[9px] text-white/30">({l.method})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-[11px] sm:text-xs font-semibold text-white font-mono">{checkInTime}</span>
                        {checkOutTime ? (
                          <>
                            <span className="text-white/30 text-[10px]">تا</span>
                            <span className="text-[11px] sm:text-xs font-semibold text-white/80 font-mono">
                              {checkOutTime}
                            </span>
                            <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-bold">
                              {l.durationMinutes || 1} د
                            </span>
                          </>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold animate-pulse">
                            🟢 حاضر
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-white/35 mt-0.5">{checkInDate}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

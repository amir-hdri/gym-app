"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkInByCode } from "@/server/actions/attendance";

interface AttendanceClientProps {
  initialLogs: any[];
  managerUserId: string;
}

export default function AttendanceClient({ initialLogs, managerUserId }: AttendanceClientProps) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Webcam QR scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const handleCheckInSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!code) {
      setErrorMsg("لطفاً کد عضویت را وارد کنید");
      return;
    }

    triggerCheckIn(code);
  };

  const triggerCheckIn = (membershipCode: string) => {
    startTransition(async () => {
      try {
        const result = await checkInByCode(membershipCode, managerUserId);
        if (result.success) {
          setSuccessMsg(`حضور کاربر با موفقیت ثبت شد.`);
          setCode("");
          setTimeout(() => {
            setSuccessMsg("");
            router.refresh();
          }, 1500);
        } else {
          setErrorMsg(result.error || "خطا در ثبت حضور");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "خطا در برقراری ارتباط");
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
            qrbox: { width: 220, height: 220 },
          },
          (decodedText: string) => {
            // On success
            setCode(decodedText);
            setIsScanning(false);
            triggerCheckIn(decodedText);
          },
          () => {
            // Ignored/Verbose logs
          }
        );
      } catch (err: any) {
        console.error("Camera scan error:", err);
        setCameraError("خطا در راه‌اندازی دوربین وب‌کم. دسترسی به دوربین را بررسی کنید.");
        setIsScanning(false);
      }
    };

    if (isScanning) {
      startScanner();
    }

    return () => {
      if (qrScannerInstance && qrScannerInstance.isScanning) {
        qrScannerInstance.stop().catch((e: any) => console.error("Scanner stop error:", e));
      }
    };
  }, [isScanning]);

  return (
    <div className="space-y-5 text-right">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">ثبت ورود</p>
        <h1 className="text-2xl font-bold gradient-text">حضور و غیاب</h1>
      </div>

      {/* QR & Code check-in panel */}
      <form onSubmit={handleCheckInSubmit} className="glass-card p-5 anim-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="flex justify-between items-center mb-4 flex-row-reverse">
          <h3 className="text-sm font-semibold">ثبت ورود با کد عضویت یا اسکنر وب‌کم</h3>
          <button 
            type="button"
            onClick={() => setIsScanning(!isScanning)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              isScanning 
                ? "bg-rose-500/20 text-rose-400 border-rose-500/30" 
                : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30"
            }`}>
            <span>{isScanning ? "لغو اسکن وب‌کم" : "اسکن زنده با وب‌کم 📸"}</span>
          </button>
        </div>
        
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl text-center mb-4">{successMsg}</div>
        )}
        {cameraError && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3 rounded-xl text-center mb-4">{cameraError}</div>
        )}

        {/* Webcam scanner element */}
        {isScanning && (
          <div className="mb-4 relative rounded-xl overflow-hidden border border-white/20 max-w-sm mx-auto shadow-2xl">
            <div id="webcam-reader" className="w-full bg-black/60 aspect-video"></div>
            <div className="absolute inset-0 border border-cyan-500/30 pointer-events-none animate-pulse">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-cyan-400 border-dashed rounded-lg"></div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="text-[10px] bg-black/70 text-cyan-400 px-2 py-0.5 rounded-full">در حال اسکن کد QR ...</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-row-reverse">
          <input 
            placeholder="کد عضویت را وارد کنید (مانند MEM-001)…" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input-glass flex-1 rounded-xl px-4 py-3 text-sm min-w-0 text-right"
          />
          <button 
            type="submit"
            disabled={isPending}
            className="btn-primary rounded-xl px-5 py-3 text-sm font-bold whitespace-nowrap">
            {isPending ? "در حال ثبت..." : "ثبت ورود"}
          </button>
        </div>

        {/* Info panel */}
        <div className="mt-4 flex items-center justify-center h-20 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
          <div className="flex flex-col items-center gap-1.5 text-white/20">
            <p className="text-xs">سیستم اسکن QR دوربین پس از تایید دسترسی به وب‌کم فعال خواهد شد</p>
          </div>
        </div>
      </form>

      {/* Attendance log */}
      <div className="glass-card overflow-hidden anim-fade-up" style={{ animationDelay: "160ms" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-row-reverse">
          <h3 className="text-sm font-semibold">حضورهای اخیر</h3>
          <span className="text-xs text-white/40">{logs.length} مورد حضور ثبت‌شده اخیر</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/30">هنوز حضوری ثبت نشده است.</div>
          ) : (
            logs.map((l: any) => {
              const name = l.member?.user?.name || "کاربر باشگاه";
              const initials = name.substring(0, 2);
              const checkInTime = new Date(l.checkInAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
              const checkInDate = new Date(l.checkInAt).toLocaleDateString("fa-IR");

              return (
                <div key={l.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.025] transition-colors flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-rose-500/10 text-rose-400 border border-rose-500/15">{initials}</div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-[10px] text-white/35" dir="ltr">{l.member?.membershipCode}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold">{checkInTime}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{checkInDate}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

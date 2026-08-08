"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition, useCallback } from "react";
import QRCode from "qrcode";
import { checkoutOnline, checkoutTransfer } from "@/server/actions/checkout";
import { requestFreeze } from "@/server/actions/freeze";

interface MembershipClientProps {
  member: any;
  plans: any[];
}

export default function MembershipClient({ member, plans }: MembershipClientProps) {
  const router = useRouter();
  const profile = member?.memberProfile;
  const activeSub = profile?.subscriptions?.find((s: any) => s.status === "ACTIVE");
  const planName = activeSub?.plan?.name || "بدون طرح فعال";
  const code = profile?.membershipCode || "---";

  // Dynamic QR states (A7)
  const [qrMode, setQrMode] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [qrToken, setQrToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [countdown, setCountdown] = useState(120);
  const [isQrLoading, setIsQrLoading] = useState(false);

  // Stats states (A7)
  const [stats, setStats] = useState<{
    isInside: boolean;
    currentCheckInAt: string | null;
    liveMinutes: number;
    thisMonthCount: number;
    thisWeekCount: number;
    totalSessions: number;
    avgDurationMinutes: number;
    isSessionBased: boolean;
    maxSessions: number | null;
    sessionsUsed: number;
    remainingSessions: number | null;
  } | null>(null);

  // Modals
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"NONE" | "ONLINE" | "TRANSFER">("NONE");

  // Card-to-card inputs
  const [senderInfo, setSenderInfo] = useState("");
  const [refCode, setRefCode] = useState("");

  // Online gateway simulator inputs
  const [cardNumber, setCardNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(120);

  // Freeze inputs
  const [freezeFrom, setFreezeFrom] = useState("");
  const [freezeTo, setFreezeTo] = useState("");
  const [freezeReason, setFreezeReason] = useState("");

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch session stats & inside status
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/member/sessions?type=stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch {}
  }, []);

  // Fetch dynamic rotating QR code (A7)
  const fetchRotatingQr = useCallback(async () => {
    if (!profile?.id) return;
    setIsQrLoading(true);
    try {
      const res = await fetch(`/api/qr/generate?type=${qrMode}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setQrToken(data.token);
          if (data.qrUrl) {
            setQrDataUrl(data.qrUrl);
          } else {
            const url = await QRCode.toDataURL(data.token, { margin: 1, width: 220 });
            setQrDataUrl(url);
          }
          setCountdown(120);
        }
      } else {
        const fallbackUrl = await QRCode.toDataURL(code, { margin: 1, width: 220 });
        setQrDataUrl(fallbackUrl);
      }
    } catch {
      if (code && code !== "---") {
        const fallbackUrl = await QRCode.toDataURL(code, { margin: 1, width: 220 });
        setQrDataUrl(fallbackUrl);
      }
    } finally {
      setIsQrLoading(false);
    }
  }, [profile?.id, qrMode, code]);

  useEffect(() => {
    fetchStats();
    fetchRotatingQr();
    const rotateInterval = setInterval(() => {
      fetchRotatingQr();
      fetchStats();
    }, 30000);

    return () => clearInterval(rotateInterval);
  }, [fetchRotatingQr, fetchStats]);

  // Countdown timer 120s -> 0s
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchRotatingQr();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchRotatingQr]);

  // Timer for online gateway OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentMethod === "ONLINE" && seconds > 0) {
      timer = setTimeout(() => setSeconds(seconds - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [paymentMethod, seconds]);

  let startDateFarsi = "---";
  let expiryDateFarsi = "---";
  let autoRenewText = "غیر فعال";

  if (activeSub) {
    if (activeSub.startedAt) {
      startDateFarsi = new Date(activeSub.startedAt).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (activeSub.endsAt) {
      expiryDateFarsi = new Date(activeSub.endsAt).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (activeSub.autoRenew) {
      autoRenewText = "فعال";
    }
  }

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setPaymentMethod("NONE");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !senderInfo || !refCode) {
      setErrorMsg("لطفاً تمامی فیلدها را پر کنید");
      return;
    }

    startTransition(async () => {
      try {
        await checkoutTransfer(profile.id, selectedPlanId, senderInfo, refCode);
        setSuccessMsg(
          "پرداخت کارت به کارت شما با موفقیت ثبت شد و پس از تایید مدیریت فعال خواهد شد."
        );
        setTimeout(() => {
          setIsRenewModalOpen(false);
          setPaymentMethod("NONE");
          setSelectedPlanId("");
          setSenderInfo("");
          setRefCode("");
          setSuccessMsg("");
          router.refresh();
        }, 3000);
      } catch (err: any) {
        setErrorMsg(err.message || "خطایی رخ داد");
      }
    });
  };

  const handleOnlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cvv2 || !expMonth || !expYear || !otp) {
      setErrorMsg("لطفاً مشخصات کارت بانکی را به طور کامل وارد کنید");
      return;
    }

    const cleanCard = cardNumber.replace(/\s|-/g, "");
    if (cleanCard.length < 16 || !/^\d{16}$/.test(cleanCard)) {
      setErrorMsg("شماره کارت باید ۱۶ رقم باشد");
      return;
    }
    if (!/^\d{3,4}$/.test(cvv2)) {
      setErrorMsg("CVV2 باید ۳ یا ۴ رقم باشد");
      return;
    }
    const monthNum = parseInt(expMonth);
    const yearNum = parseInt(expYear);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      setErrorMsg("ماه انقضا نامعتبر است (۱ تا ۱۲)");
      return;
    }
    if (isNaN(yearNum) || expYear.length !== 2) {
      setErrorMsg("سال انقضا باید ۲ رقم باشد (مثلاً ۰۵ برای ۱۴۰۵)");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setErrorMsg("رمز پویا باید ۶ رقم باشد (برای تست: ۱۲۳۴۵۶)");
      return;
    }

    startTransition(async () => {
      try {
        await checkoutOnline(profile.id, selectedPlanId);
        setSuccessMsg(
          "پرداخت آنلاین شما با موفقیت انجام شد و اشتراک شما بلافاصله فعال گردید!"
        );
        setTimeout(() => {
          setIsRenewModalOpen(false);
          setPaymentMethod("NONE");
          setSelectedPlanId("");
          setCardNumber("");
          setCvv2("");
          setExpMonth("");
          setExpYear("");
          setOtp("");
          setSuccessMsg("");
          router.refresh();
        }, 2000);
      } catch (err: any) {
        setErrorMsg(err.message || "خطایی رخ داد");
      }
    });
  };

  const handleFreezeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeFrom || !freezeTo) {
      setErrorMsg("لطفاً تاریخ شروع و پایان تعلیق را مشخص کنید");
      return;
    }

    const fromDate = new Date(freezeFrom);
    const toDate = new Date(freezeTo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate < today) {
      setErrorMsg("تاریخ شروع نمی‌تواند در گذشته باشد");
      return;
    }
    if (toDate <= fromDate) {
      setErrorMsg("تاریخ پایان باید بعد از تاریخ شروع باشد");
      return;
    }

    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      setErrorMsg("بازه تعلیق باید حداقل ۱ روز باشد");
      return;
    }
    if (diffDays > 60) {
      setErrorMsg("حداکثر تعلیق ۶۰ روز می‌باشد");
      return;
    }
    const allowedDays = activeSub?.plan?.freezeDaysAllowed || 0;

    if (allowedDays <= 0) {
      setErrorMsg("طرح فعلی شما امکان تعلیق ندارد");
      return;
    }
    if (diffDays > allowedDays) {
      setErrorMsg(
        `طرح فعلی شما حداکثر اجازه تعلیق ${allowedDays} روز را می‌دهد. شما ${diffDays} روز انتخاب کرده‌اید.`
      );
      return;
    }

    startTransition(async () => {
      try {
        await requestFreeze(profile.id, activeSub.id, fromDate, toDate, freezeReason);
        setSuccessMsg(
          "درخواست تعلیق شما با موفقیت ثبت شد و در صف بررسی مدیریت قرار گرفت."
        );
        setTimeout(() => {
          setIsFreezeModalOpen(false);
          setFreezeFrom("");
          setFreezeTo("");
          setFreezeReason("");
          setSuccessMsg("");
          router.refresh();
        }, 3000);
      } catch (err: any) {
        setErrorMsg(err.message || "خطایی رخ داد");
      }
    });
  };

  const isInside = stats?.isInside ?? false;
  const remainingDays = activeSub?.endsAt
    ? Math.max(0, Math.ceil((new Date(activeSub.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-4 sm:space-y-5 text-right" dir="rtl">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
          طرح کاربری و گیت ورود
        </p>
        <h1 className="text-xl sm:text-2xl font-bold gradient-text">کارت و QR ورود اختصاصی</h1>
      </div>

      {/* Currently Inside Banner (A7) */}
      {isInside && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-right anim-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-emerald-300">
                🟢 شما الان داخل باشگاه هستید
              </p>
              <p className="text-[10px] text-white/60 mt-0.5">
                ورود در ساعت{" "}
                {stats?.currentCheckInAt
                  ? new Date(stats.currentCheckInAt).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "---"}{" "}
                · مدت حضور تاکنون:{" "}
                <span className="text-emerald-300 font-bold font-mono">
                  {stats?.liveMinutes || 0} دقیقه
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setQrMode("EXIT")}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition-all text-center self-start sm:self-auto"
          >
            تغییر به QR خروج 🔴
          </button>
        </div>
      )}

      {/* 3 Counter Cards Grid (A7) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 anim-fade-up">
        <div className="glass-card p-2.5 sm:p-3 text-right">
          <p className="text-[8px] sm:text-[9px] text-white/40 truncate">حضورهای این ماه</p>
          <p className="text-base sm:text-lg font-bold text-cyan-400 mt-1">
            {stats?.thisMonthCount || 0}{" "}
            <span className="text-[9px] font-normal text-white/40">جلسه</span>
          </p>
        </div>

        <div className="glass-card p-2.5 sm:p-3 text-right">
          <p className="text-[8px] sm:text-[9px] text-white/40 truncate">
            {stats?.isSessionBased ? "جلسات باقیمانده" : "روزهای باقیمانده"}
          </p>
          <p className="text-base sm:text-lg font-bold text-emerald-400 mt-1 truncate">
            {stats?.isSessionBased
              ? `${stats?.remainingSessions ?? 0} از ${stats?.maxSessions ?? 0}`
              : `${remainingDays} روز`}
          </p>
        </div>

        <div className="glass-card p-2.5 sm:p-3 text-right">
          <p className="text-[8px] sm:text-[9px] text-white/40 truncate">میانگین مدت حضور</p>
          <p className="text-base sm:text-lg font-bold text-purple-400 mt-1">
            {stats?.avgDurationMinutes || 0}{" "}
            <span className="text-[9px] font-normal text-white/40">دقیقه</span>
          </p>
        </div>
      </div>

      {/* Current plan card */}
      <div className="glass-card p-4 sm:p-5 anim-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-white/60">طرح فعال فعلی</p>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: activeSub ? "rgba(16,185,129,.15)" : "rgba(244,63,94,.15)",
              color: activeSub ? "#34d399" : "#fb7185",
            }}
          >
            {activeSub ? "فعال" : "غیر فعال"}
          </span>
        </div>
        <div className="space-y-2.5 sm:space-y-3">
          {[
            { l: "طرح اشتراک", v: planName },
            {
              l: "نوع طرح",
              v: stats?.isSessionBased
                ? `پکیج جلسه‌ای (${stats?.sessionsUsed || 0}/${stats?.maxSessions || "نامحدود"} جلسه مصرف شده)`
                : "اشتراک زمانی روزانه",
            },
            { l: "تاریخ شروع", v: startDateFarsi },
            { l: "تاریخ انقضا", v: expiryDateFarsi },
            { l: "کد عضویت باشگاه", v: code },
            { l: "تمدید خودکار", v: autoRenewText },
          ].map((row) => (
            <div
              key={row.l}
              className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0 text-right text-xs"
            >
              <p className="text-white/40">{row.l}</p>
              <p className="font-semibold text-white truncate max-w-[60%]">{row.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Rotating QR Code Access Section (A7) */}
      {activeSub && (
        <div
          className="glass-card p-4 sm:p-5 flex flex-col items-center anim-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          {/* Mode Toggle: ENTRY vs EXIT */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 mb-4 w-full max-w-xs">
            <button
              type="button"
              onClick={() => {
                setQrMode("ENTRY");
                fetchRotatingQr();
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                qrMode === "ENTRY"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              🟢 توکن ورود (ENTRY)
            </button>
            <button
              type="button"
              onClick={() => {
                setQrMode("EXIT");
                fetchRotatingQr();
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                qrMode === "EXIT"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              🔴 توکن خروج (EXIT)
            </button>
          </div>

          <div className="flex items-center justify-between w-full max-w-xs px-1 mb-2">
            <span className="text-[10px] text-white/40">اعتبار توکن امن:</span>
            <span className="text-[10px] font-mono font-bold text-cyan-400">
              {countdown} ثانیه تا انقضا
            </span>
          </div>

          {/* Progress bar countdown 120 -> 0 */}
          <div className="w-full max-w-xs h-1.5 rounded-full bg-white/10 overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-1000"
              style={{ width: `${(countdown / 120) * 100}%` }}
            />
          </div>

          {/* QR Image */}
          <div
            className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl border border-white/15 flex items-center justify-center p-3 mb-3 relative shadow-2xl"
            style={{ background: "rgba(255,255,255,.03)" }}
          >
            {isQrLoading ? (
              <div className="text-white/30 text-xs animate-pulse">در حال به‌روزرسانی توکن...</div>
            ) : qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR Code Checkin"
                className="w-full h-full object-contain rounded-lg filter invert"
              />
            ) : (
              <div className="text-white/20 text-xs text-center">در حال تولید...</div>
            )}
          </div>

          <p className="text-[10px] text-white/40 text-center font-mono">
            {code} · چرخش خودکار هر ۳۰ ثانیه با امضای دیجیتال HMAC
          </p>

          <button
            type="button"
            onClick={() => fetchRotatingQr()}
            className="mt-3 text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>🔄 تولید مجدد فوری توکن</span>
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          onClick={() => {
            setIsRenewModalOpen(true);
            setSelectedPlanId("");
            setPaymentMethod("NONE");
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className="btn-primary rounded-2xl py-3.5 text-xs sm:text-sm font-bold shadow-lg shadow-rose-950/20"
        >
          تمدید یا خرید طرح
        </button>
        <button
          onClick={() => {
            if (!activeSub) {
              alert("شما فاقد اشتراک فعال برای تعلیق هستید.");
              return;
            }
            setIsFreezeModalOpen(true);
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className="btn-glass glass-card rounded-2xl py-3.5 text-xs sm:text-sm text-white/60 font-semibold"
        >
          تعلیق طرح
        </button>
      </div>

      {/* Freeze Request History */}
      {profile?.freezeRequests && profile.freezeRequests.length > 0 && (
        <div
          className="glass-card overflow-hidden mt-4 anim-fade-up"
          style={{ animationDelay: "180ms" }}
        >
          <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-bold text-white/70">
            درخواست‌های تعلیق اشتراک شما
          </div>
          <div className="divide-y divide-white/[0.04]">
            {profile.freezeRequests.map((req: any) => {
              const fromStr = new Date(req.requestedFrom).toLocaleDateString("fa-IR");
              const toStr = new Date(req.requestedTo).toLocaleDateString("fa-IR");
              const statLabel =
                req.status === "PENDING"
                  ? "در انتظار تایید"
                  : req.status === "APPROVED"
                  ? "تایید شده"
                  : "رد شده";
              const statColor =
                req.status === "PENDING"
                  ? "text-amber-400"
                  : req.status === "APPROVED"
                  ? "text-emerald-400"
                  : "text-rose-400";

              return (
                <div key={req.id} className="p-3.5 sm:p-4 text-xs space-y-1.5 text-right">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-white">
                      بازه: {fromStr} الی {toStr}
                    </p>
                    <span className={`font-bold ${statColor}`}>{statLabel}</span>
                  </div>
                  {req.reason && <p className="text-[10px] text-white/40">علت: {req.reason}</p>}
                  {req.managerNote && (
                    <p className="text-[10px] text-emerald-400/80">
                      پاسخ مدیر: {req.managerNote}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal 1: Renew / Purchase Plan */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md anim-fade-in overflow-y-auto">
          <div className="w-full max-w-md glass-strong p-4 sm:p-6 rounded-2xl border border-white/20 text-right my-auto max-h-[88vh] overflow-y-auto">
            {successMsg ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-emerald-400">عملیات موفقیت‌آمیز</h3>
                <p className="text-xs text-white/60">{successMsg}</p>
              </div>
            ) : paymentMethod === "NONE" ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm sm:text-base font-bold text-white">انتخاب طرح اشتراک</h2>
                  <button onClick={() => setIsRenewModalOpen(false)} className="text-white/40 hover:text-white text-lg">
                    &times;
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2.5 mb-5">
                  {plans.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPlan(p.id)}
                      className={`glass-card p-3.5 text-right cursor-pointer transition-all border ${
                        selectedPlanId === p.id
                          ? "border-rose-500 bg-rose-950/15"
                          : "border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-white">{p.name}</h4>
                          {p.isSessionBased && (
                            <span className="text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                              پکیج ({p.maxSessions} جلسه)
                            </span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-cyan-400">
                          {Number(p.price).toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40">
                        مدت: {p.durationDays} روز | مرخصی: {p.freezeDaysAllowed} روز
                      </p>
                    </div>
                  ))}
                </div>

                {selectedPlanId && (
                  <div className="space-y-2.5 anim-fade-up">
                    <p className="text-[10px] text-white/40">انتخاب روش پرداخت</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod("ONLINE")}
                        className="btn-primary rounded-xl py-2.5 text-xs font-bold"
                      >
                        درگاه آنلاین بانکی
                      </button>
                      <button
                        onClick={() => setPaymentMethod("TRANSFER")}
                        className="btn-glass glass-card rounded-xl py-2.5 text-xs font-bold text-white"
                      >
                        کارت به کارت (سند)
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : paymentMethod === "TRANSFER" ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm sm:text-base font-bold text-white">واریز کارت به کارت</h2>
                  <button onClick={() => setPaymentMethod("NONE")} className="text-white/40 hover:text-white text-xs">
                    &rarr; بازگشت
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">
                    {errorMsg}
                  </div>
                )}

                <div className="glass-bank-card p-4 sm:p-5 mb-4 relative text-white select-none">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-semibold opacity-60">بانک سامان</p>
                    <div className="w-7 h-5 bg-yellow-400/20 border border-yellow-400/40 rounded-md flex items-center justify-center">
                      <span className="w-3 h-2 bg-yellow-400/50 rounded-sm" />
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-bold tracking-widest text-center my-2 font-mono" dir="ltr">
                    ۶۲۱۹ - ۸۶۱۰ - ۱۲۳۴ - ۵۶۷۸
                  </p>
                  <div className="flex justify-between items-end mt-3 text-[10px]">
                    <div className="text-right">
                      <p className="opacity-40">صاحب حساب</p>
                      <p className="font-semibold">باشگاه اکسیژن (جیم‌اپ)</p>
                    </div>
                    <div className="text-left font-mono">
                      <p className="opacity-40">مبلغ واریزی</p>
                      <p className="font-bold text-cyan-400">
                        {Number(plans.find((p) => p.id === selectedPlanId)?.price).toLocaleString("fa-IR")} تومان
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleTransferSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">
                      نام واریزکننده یا شماره کارت شما
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: سارا محمدی"
                      value={senderInfo}
                      onChange={(e) => setSenderInfo(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">
                      کد پیگیری یا شماره ارجاع
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="۴ یا ۶ رقم آخر شماره پیگیری"
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2 text-xs text-left font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-primary w-full rounded-xl py-3 text-xs font-bold"
                  >
                    {isPending ? "در حال ثبت..." : "ثبت فیش واریزی"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm sm:text-base font-bold text-cyan-400">درگاه پرداخت آنلاین شبیه‌سازی شده</h2>
                  <button onClick={() => setPaymentMethod("NONE")} className="text-white/40 hover:text-white text-xs">
                    &rarr; بازگشت
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">
                    {errorMsg}
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-4 text-xs flex justify-between items-center">
                  <div>
                    <p className="text-white/40">پذیرنده</p>
                    <p className="font-semibold text-white">مجموعه ورزشی جیم‌اپ</p>
                  </div>
                  <div className="text-left font-mono">
                    <p className="text-white/40">مبلغ خرید</p>
                    <p className="font-bold text-base sm:text-lg text-emerald-400">
                      {Number(plans.find((p) => p.id === selectedPlanId)?.price).toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                </div>

                <form onSubmit={handleOnlineSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">شماره کارت بانکی</label>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      placeholder="۶۲۱۹-۸۶۱۰-XXXX-XXXX"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="input-glass w-full rounded-xl px-3.5 py-2.5 text-xs text-center font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[10px] text-white/40 mb-1 text-center">CVV2</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="•••"
                        value={cvv2}
                        onChange={(e) => setCvv2(e.target.value)}
                        className="input-glass w-full rounded-xl py-2.5 text-xs text-center font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-white/40 mb-1 text-center">
                        تاریخ انقضای کارت
                      </label>
                      <div className="flex gap-1 justify-center items-center">
                        <input
                          type="text"
                          required
                          maxLength={2}
                          placeholder="سال"
                          value={expYear}
                          onChange={(e) => setExpYear(e.target.value)}
                          className="input-glass w-full rounded-xl py-2 text-xs text-center font-mono"
                        />
                        <span className="text-white/20">/</span>
                        <input
                          type="text"
                          required
                          maxLength={2}
                          placeholder="ماه"
                          value={expMonth}
                          onChange={(e) => setExpMonth(e.target.value)}
                          className="input-glass w-full rounded-xl py-2 text-xs text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">رمز پویا (یکبار مصرف)</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        required
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="input-glass flex-1 rounded-xl px-3.5 py-2.5 text-xs text-center font-mono"
                      />
                      <button
                        type="button"
                        disabled={seconds < 120 && seconds > 0}
                        onClick={() => setSeconds(119)}
                        className="btn-glass glass-card rounded-xl px-3.5 text-[10px] whitespace-nowrap text-white/80"
                      >
                        {seconds > 0 ? `${seconds} ثانیه` : "دریافت رمز"}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-primary w-full rounded-xl py-3 text-xs font-bold mt-2 shadow-lg shadow-emerald-950/20"
                  >
                    {isPending ? "در حال پرداخت..." : "پرداخت و تایید نهایی"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Freeze Request Form */}
      {isFreezeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md anim-fade-in">
          <div className="w-full max-w-sm glass-strong p-4 sm:p-6 rounded-2xl border border-white/20 text-right">
            {successMsg ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-emerald-400">درخواست ثبت شد</h3>
                <p className="text-xs text-white/60">{successMsg}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm sm:text-base font-bold text-white">تعلیق اشتراک (مرخصی)</h2>
                  <button onClick={() => setIsFreezeModalOpen(false)} className="text-white/40 hover:text-white text-lg">
                    &times;
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">
                    {errorMsg}
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-xs">
                  <p className="text-white/40">سقف مرخصی طرح شما</p>
                  <p className="font-bold text-xs sm:text-sm text-cyan-400 mt-0.5">
                    {activeSub?.plan?.freezeDaysAllowed || 0} روز
                  </p>
                </div>

                <form onSubmit={handleFreezeSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">تا تاریخ</label>
                      <input
                        type="date"
                        required
                        value={freezeTo}
                        onChange={(e) => setFreezeTo(e.target.value)}
                        className="input-glass w-full rounded-xl px-3 py-2 text-xs text-left font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">از تاریخ</label>
                      <input
                        type="date"
                        required
                        value={freezeFrom}
                        onChange={(e) => setFreezeFrom(e.target.value)}
                        className="input-glass w-full rounded-xl px-3 py-2 text-xs text-left font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">
                      علت مرخصی (اختیاری)
                    </label>
                    <textarea
                      placeholder="توضیحات یا علت تعلیق اشتراک…"
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right h-20 resize-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold"
                    >
                      {isPending ? "در حال ارسال..." : "ارسال درخواست"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFreezeModalOpen(false)}
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
    </div>
  );
}

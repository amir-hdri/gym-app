"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
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

  // State
  const [qrUrl, setQrUrl] = useState("");
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

  // Timer for online gateway OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentMethod === "ONLINE" && seconds > 0) {
      timer = setTimeout(() => setSeconds(seconds - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [paymentMethod, seconds]);

  // Generate QR Code
  useEffect(() => {
    if (code && code !== "---") {
      QRCode.toDataURL(code, { margin: 1, width: 200 })
        .then(url => setQrUrl(url))
        .catch(err => console.error("QR Code error:", err));
    }
  }, [code]);

  let startDateFarsi = "---";
  let expiryDateFarsi = "---";
  let autoRenewText = "غیر فعال";

  if (activeSub) {
    if (activeSub.startedAt) {
      startDateFarsi = new Date(activeSub.startedAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
    }
    if (activeSub.endsAt) {
      expiryDateFarsi = new Date(activeSub.endsAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
    }
    if (activeSub.autoRenew) {
      autoRenewText = "فعال";
    }
  }

  // Handle plan select
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setPaymentMethod("NONE");
    setErrorMsg("");
    setSuccessMsg("");
  };

  // Submit Card-to-Card Payment
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !senderInfo || !refCode) {
      setErrorMsg("لطفاً تمامی فیلدها را پر کنید");
      return;
    }

    startTransition(async () => {
      try {
        await checkoutTransfer(profile.id, selectedPlanId, senderInfo, refCode);
        setSuccessMsg("پرداخت کارت به کارت شما با موفقیت ثبت شد و پس از تایید مدیریت فعال خواهد شد.");
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

  // Submit Online Payment
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
    // For simulation, allow any 6-digit OTP, but show hint if not 123456
    if (otp !== "123456" && otp !== "000000") {
      // Allow but warn in console - in real gateway would verify
      console.log("Simulated OTP verification, allowing", otp);
    }

    startTransition(async () => {
      try {
        await checkoutOnline(profile.id, selectedPlanId);
        setSuccessMsg("پرداخت آنلاین شما با موفقیت انجام شد و اشتراک شما بلافاصله فعال گردید!");
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

  // Submit Freeze Request
  const handleFreezeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeFrom || !freezeTo) {
      setErrorMsg("لطفاً تاریخ شروع و پایان تعلیق را مشخص کنید");
      return;
    }

    const fromDate = new Date(freezeFrom);
    const toDate = new Date(freezeTo);
    const today = new Date();
    today.setHours(0,0,0,0);
    
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
      setErrorMsg(`طرح فعلی شما حداکثر اجازه تعلیق ${allowedDays} روز را می‌دهد. شما ${diffDays} روز انتخاب کرده‌اید.`);
      return;
    }

    startTransition(async () => {
      try {
        await requestFreeze(profile.id, activeSub.id, fromDate, toDate, freezeReason);
        setSuccessMsg("درخواست تعلیق شما با موفقیت ثبت شد و در صف بررسی مدیریت قرار گرفت.");
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

  return (
    <div className="space-y-4 text-right">
      <div className="anim-fade-up">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">طرح کاربری</p>
        <h1 className="text-2xl font-bold gradient-text">کارت عضویت</h1>
      </div>

      {/* Current plan card */}
      <div className="glass-card p-5 anim-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <p className="text-xs font-semibold text-white/60">طرح فعال فعلی</p>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" 
            style={{
              background: activeSub ? "rgba(16,185,129,.15)" : "rgba(244,63,94,.15)", 
              color: activeSub ? "#34d399" : "#fb7185"
            }}>
            {activeSub ? "فعال" : "غیر فعال"}
          </span>
        </div>
        <div className="space-y-3">
          {[
            { l: "طرح اشتراک", v: planName },
            { l: "تاریخ شروع", v: startDateFarsi },
            { l: "تاریخ انقضا", v: expiryDateFarsi },
            { l: "کد عضویت باشگاه", v: code },
            { l: "تمدید خودکار", v: autoRenewText },
          ].map(row => (
            <div key={row.l} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0 flex-row-reverse text-right">
              <p className="text-xs text-white/40">{row.l}</p>
              <p className="text-xs font-semibold">{row.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* QR Access */}
      {activeSub && (
        <div className="glass-card p-5 flex flex-col items-center anim-fade-up" style={{ animationDelay: "120ms" }}>
          <p className="text-xs text-white/50 mb-4">کد QR ورود اختصاصی شما</p>
          <div className="w-40 h-40 rounded-2xl border border-white/10 flex items-center justify-center p-2.5 mb-3" style={{ background: "rgba(255,255,255,.02)" }}>
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="QR Code Checkin" className="w-full h-full object-contain rounded-lg filter invert" />
            ) : (
              <div className="text-white/20 text-xs text-center">در حال تولید...</div>
            )}
          </div>
          <p className="text-[10px] text-white/30">{code} · {planName}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 flex-row-reverse">
        <button 
          onClick={() => {
            setIsRenewModalOpen(true);
            setSelectedPlanId("");
            setPaymentMethod("NONE");
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className="btn-primary rounded-2xl py-3.5 text-sm font-bold shadow-lg shadow-rose-950/20">
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
          className="btn-glass glass-card rounded-2xl py-3.5 text-sm text-white/60 font-semibold">
          تعلیق طرح
        </button>
      </div>

      {/* Freeze Request History */}
      {profile?.freezeRequests && profile.freezeRequests.length > 0 && (
        <div className="glass-card overflow-hidden mt-4 anim-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-bold text-white/70">
            درخواست‌های تعلیق اشتراک شما
          </div>
          <div className="divide-y divide-white/[0.04]">
            {profile.freezeRequests.map((req: any) => {
              const fromStr = new Date(req.requestedFrom).toLocaleDateString("fa-IR");
              const toStr = new Date(req.requestedTo).toLocaleDateString("fa-IR");
              const statLabel = req.status === "PENDING" ? "در انتظار تایید" : req.status === "APPROVED" ? "تایید شده" : "رد شده";
              const statColor = req.status === "PENDING" ? "text-amber-400" : req.status === "APPROVED" ? "text-emerald-400" : "text-rose-400";
              
              return (
                <div key={req.id} className="p-4 text-xs space-y-1.5 text-right">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <p className="font-semibold">بازه: {fromStr} الی {toStr}</p>
                    <span className={`font-bold ${statColor}`}>{statLabel}</span>
                  </div>
                  {req.reason && <p className="text-[10px] text-white/40">علت: {req.reason}</p>}
                  {req.managerNote && <p className="text-[10px] text-emerald-400/80">پاسخ مدیر: {req.managerNote}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal 1: Renew / Purchase Plan */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in overflow-y-auto">
          <div className="w-full max-w-md glass-strong p-6 rounded-2xl border border-white/20 text-right my-8 max-h-[90vh] overflow-y-auto">
            {successMsg ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-base font-bold text-emerald-400">عملیات موفقیت‌آمیز</h3>
                <p className="text-xs text-white/60">{successMsg}</p>
              </div>
            ) : paymentMethod === "NONE" ? (
              <>
                <div className="flex justify-between items-center mb-4 flex-row-reverse">
                  <h2 className="text-base font-bold text-white">انتخاب طرح اشتراک</h2>
                  <button onClick={() => setIsRenewModalOpen(false)} className="text-white/40 hover:text-white">&times;</button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">{errorMsg}</div>
                )}

                <div className="space-y-3 mb-6">
                  {plans.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => handleSelectPlan(p.id)}
                      className={`glass-card p-4 text-right cursor-pointer transition-all border ${selectedPlanId === p.id ? "border-rose-500 bg-rose-950/10" : "border-white/10"}`}>
                      <div className="flex justify-between items-start flex-row-reverse mb-1">
                        <h4 className="font-bold text-sm text-white">{p.name}</h4>
                        <span className="text-sm font-extrabold text-cyan-400">{Number(p.price).toLocaleString("fa-IR")} تومان</span>
                      </div>
                      <p className="text-[10px] text-white/40">مدت: {p.durationDays} روز | مرخصی: {p.freezeDaysAllowed} روز</p>
                      {p.highlights && (
                        <p className="text-[10px] text-white/50 mt-1.5 border-t border-white/[0.05] pt-1.5">{p.highlights}</p>
                      )}
                    </div>
                  ))}
                </div>

                {selectedPlanId && (
                  <div className="space-y-3 anim-fade-up">
                    <p className="text-[10px] text-white/40">انتخاب روش پرداخت</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setPaymentMethod("ONLINE")}
                        className="btn-primary rounded-xl py-2.5 text-xs font-bold">
                        درگاه آنلاین بانکی
                      </button>
                      <button 
                        onClick={() => setPaymentMethod("TRANSFER")}
                        className="btn-glass glass-card rounded-xl py-2.5 text-xs font-bold text-white">
                        کارت به کارت (سند)
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : paymentMethod === "TRANSFER" ? (
              <>
                {/* Card to card checkout UI */}
                <div className="flex justify-between items-center mb-4 flex-row-reverse">
                  <h2 className="text-base font-bold text-white">واریز کارت به کارت</h2>
                  <button onClick={() => setPaymentMethod("NONE")} className="text-white/40 hover:text-white">&larr; بازگشت</button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">{errorMsg}</div>
                )}

                {/* Saman bank glass card representation */}
                <div className="glass-bank-card p-5 mb-5 relative text-white select-none">
                  <div className="flex justify-between items-center flex-row-reverse mb-6">
                    <p className="text-xs font-semibold opacity-60">بانک سامان</p>
                    <div className="w-8 h-6 bg-yellow-400/20 border border-yellow-400/40 rounded-md flex items-center justify-center">
                      <span className="w-4 h-3 bg-yellow-400/50 rounded-sm"/>
                    </div>
                  </div>
                  <p className="text-lg font-bold tracking-widest text-center my-3" dir="ltr">۶۲۱۹ - ۸۶۱۰ - ۱۲۳۴ - ۵۶۷۸</p>
                  <div className="flex justify-between items-end flex-row-reverse mt-4 text-[10px]">
                    <div className="text-right">
                      <p className="opacity-40">صاحب حساب</p>
                      <p className="font-semibold">باشگاه اکسیژن (جیم‌اپ)</p>
                    </div>
                    <div className="text-left font-mono">
                      <p className="opacity-40">مبلغ واریزی</p>
                      <p className="font-bold text-cyan-400">{Number(plans.find(p => p.id === selectedPlanId)?.price).toLocaleString("fa-IR")} تومان</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">نام واریزکننده یا شماره کارت شما</label>
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
                    <label className="block text-[10px] text-white/40 mb-1">کد پیگیری یا شماره ارجاع</label>
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
                    className="btn-primary w-full rounded-xl py-3 text-xs font-bold">
                    {isPending ? "در حال ثبت..." : "ثبت فیش واریزی"}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* High-fidelity online banking gateway mock */}
                <div className="flex justify-between items-center mb-4 flex-row-reverse">
                  <h2 className="text-base font-bold text-cyan-400">درگاه پرداخت آنلاین شبیه‌سازی شده</h2>
                  <button onClick={() => setPaymentMethod("NONE")} className="text-white/40 hover:text-white">&larr; بازگشت</button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">{errorMsg}</div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-xs flex justify-between items-center flex-row-reverse">
                  <div>
                    <p className="text-white/40">پذیرنده</p>
                    <p className="font-semibold text-white">مجموعه ورزشی جیم‌اپ</p>
                  </div>
                  <div className="text-left font-mono">
                    <p className="text-white/40">مبلغ خرید</p>
                    <p className="font-bold text-lg text-emerald-400">{Number(plans.find(p => p.id === selectedPlanId)?.price).toLocaleString("fa-IR")} تومان</p>
                  </div>
                </div>

                <form onSubmit={handleOnlineSubmit} className="space-y-3.5">
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
                      <label className="block text-[10px] text-white/40 mb-1 text-center">تاریخ انقضای کارت</label>
                      <div className="flex gap-1 justify-center items-center">
                        <input 
                          type="text" 
                          required 
                          maxLength={2}
                          placeholder="سال"
                          value={expYear}
                          onChange={(e) => setExpYear(e.target.value)}
                          className="input-glass w-full rounded-xl py-2.5 text-xs text-center font-mono"
                        />
                        <span className="text-white/20">/</span>
                        <input 
                          type="text" 
                          required 
                          maxLength={2}
                          placeholder="ماه"
                          value={expMonth}
                          onChange={(e) => setExpMonth(e.target.value)}
                          className="input-glass w-full rounded-xl py-2.5 text-xs text-center font-mono"
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
                        className="btn-glass glass-card rounded-xl px-4 text-[10px] whitespace-nowrap text-white/80">
                        {seconds > 0 ? `${seconds} ثانیه` : "دریافت رمز"}
                      </button>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="btn-primary w-full rounded-xl py-3 text-xs font-bold mt-2 shadow-lg shadow-emerald-950/20">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
          <div className="w-full max-w-sm glass-strong p-6 rounded-2xl border border-white/20 text-right">
            {successMsg ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-base font-bold text-emerald-400">درخواست ثبت شد</h3>
                <p className="text-xs text-white/60">{successMsg}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 flex-row-reverse">
                  <h2 className="text-base font-bold text-white">تعلیق اشتراک (مرخصی)</h2>
                  <button onClick={() => setIsFreezeModalOpen(false)} className="text-white/40 hover:text-white">&times;</button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">{errorMsg}</div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-4 text-xs">
                  <p className="text-white/40">سقف مرخصی طرح شما</p>
                  <p className="font-bold text-sm text-cyan-400 mt-1">{activeSub?.plan?.freezeDaysAllowed || 0} روز</p>
                </div>

                <form onSubmit={handleFreezeSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">تا تاریخ</label>
                      <input 
                        type="date" 
                        required 
                        value={freezeTo}
                        onChange={(e) => setFreezeTo(e.target.value)}
                        className="input-glass w-full rounded-xl px-3 py-2 text-xs text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1">از تاریخ</label>
                      <input 
                        type="date" 
                        required 
                        value={freezeFrom}
                        onChange={(e) => setFreezeFrom(e.target.value)}
                        className="input-glass w-full rounded-xl px-3 py-2 text-xs text-left"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1">علت مرخصی (اختیاری)</label>
                    <textarea 
                      placeholder="توضیحات یا علت تعلیق اشتراک…"
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2 text-xs text-right h-20 resize-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end flex-row-reverse pt-2">
                    <button 
                      type="submit" 
                      disabled={isPending}
                      className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold">
                      {isPending ? "در حال ارسال..." : "ارسال درخواست"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsFreezeModalOpen(false)}
                      className="btn-glass glass-card rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60">
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

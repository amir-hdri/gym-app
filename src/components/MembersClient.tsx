"use client";

import { useState, useTransition } from "react";
import { createMember } from "@/server/actions/members";
import { createOrUpdateWorkoutRoutine } from "@/server/actions/workouts";

interface MembersClientProps {
  initialMembers: any[];
}

export default function MembersClient({ initialMembers }: MembersClientProps) {
  const [membersList, setMembersList] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Form states for new member
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("member123");

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states for workout assignment
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState("برنامه بدنسازی عمومی");
  const [workoutTasks, setWorkoutTasks] = useState<Array<{ exerciseName: string; sets: number; reps: string; notes: string }>>([
    { exerciseName: "", sets: 3, reps: "12", notes: "" }
  ]);
  const [workoutMemberId, setWorkoutMemberId] = useState("");

  // Filter members
  const filteredMembers = membersList.filter(m => {
    const matchSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.phone.includes(search) || 
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()));

    const activeSub = m.memberProfile?.subscriptions?.[0];
    const isActive = activeSub && activeSub.status === "ACTIVE";

    if (filterStatus === "ACTIVE") return matchSearch && isActive;
    if (filterStatus === "EXPIRED") return matchSearch && !isActive;
    return matchSearch;
  });

  // Handle Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name || !phone) {
      setErrorMsg("نام و شماره تماس الزامی هستند");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      try {
        await createMember(formData);
        setSuccessMsg(`عضو جدید (${name}) با موفقیت ایجاد شد!`);
        setTimeout(() => {
          setIsAddModalOpen(false);
          setName("");
          setPhone("");
          setEmail("");
          setPassword("member123");
          setSuccessMsg("");
          window.location.reload();
        }, 2000);
      } catch (err: any) {
        setErrorMsg(err.message || "خطایی رخ داد");
      }
    });
  };

  const handleOpenWorkoutModal = (member: any) => {
    setWorkoutMemberId(member.memberProfile.id);
    const activeRoutine = member.memberProfile.workoutRoutines?.[0];
    if (activeRoutine) {
      setWorkoutTitle(activeRoutine.title);
      setWorkoutTasks(activeRoutine.tasks.map((t: any) => ({
        exerciseName: t.exerciseName,
        sets: t.sets,
        reps: t.reps,
        notes: t.notes || ""
      })));
    } else {
      setWorkoutTitle("برنامه بدنسازی عمومی");
      setWorkoutTasks([{ exerciseName: "", sets: 3, reps: "12", notes: "" }]);
    }
    setIsWorkoutModalOpen(true);
  };

  const handleAddWorkoutTaskField = () => {
    setWorkoutTasks(prev => [...prev, { exerciseName: "", sets: 3, reps: "12", notes: "" }]);
  };

  const handleRemoveWorkoutTaskField = (idx: number) => {
    setWorkoutTasks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleWorkoutTaskChange = (idx: number, field: string, value: any) => {
    setWorkoutTasks(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleSaveWorkoutRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutTitle) {
      alert("عنوان برنامه الزامی است");
      return;
    }
    if (workoutTasks.some(t => !t.exerciseName)) {
      alert("نام تمامی حرکت‌ها باید وارد شود");
      return;
    }

    startTransition(async () => {
      try {
        await createOrUpdateWorkoutRoutine(workoutMemberId, workoutTitle, workoutTasks);
        alert("برنامه ورزشی با موفقیت ثبت شد!");
        setIsWorkoutModalOpen(false);
        setSelectedMember(null);
        window.location.reload();
      } catch (err: any) {
        alert(err.message || "خطا در ثبت برنامه ورزشی");
      }
    });
  };

  return (
    <div className="space-y-5 text-right">
      {/* Top Header Section */}
      <div className="flex items-center justify-between flex-row-reverse anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">مدیریت کاربران</p>
          <h1 className="text-2xl font-bold gradient-text">اعضای باشگاه</h1>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg shadow-rose-950/20">
          + ایجاد عضو جدید
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="grid gap-3 sm:grid-cols-3 anim-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="sm:col-span-2">
          <input 
            type="text" 
            placeholder="جستجو بر اساس نام، شماره تلفن یا ایمیل اعضا..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass w-full rounded-xl px-4 py-2.5 text-xs text-right"
          />
        </div>
        <div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="input-glass w-full rounded-xl px-4 py-2.5 text-xs text-right bg-[#100105] text-white/80">
            <option value="ALL" className="bg-[#24050e]">همه اعضا</option>
            <option value="ACTIVE" className="bg-[#24050e]">اعضای دارای طرح فعال</option>
            <option value="EXPIRED" className="bg-[#24050e]">اعضای فاقد طرح فعال</option>
          </select>
        </div>
      </div>

      {/* Grid of members */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full glass-card p-10 text-center text-xs text-white/30">هیچ عضوی یافت نشد.</div>
        ) : (
          filteredMembers.map((m: any) => {
            const activeSub = m.memberProfile?.subscriptions?.[0];
            const isActive = activeSub && activeSub.status === "ACTIVE";
            const planName = activeSub?.plan?.name || "بدون طرح فعال";
            const initials = m.name.substring(0, 2);

            return (
              <div 
                key={m.id} 
                onClick={() => setSelectedMember(m)}
                className="glass-card p-4 hover:bg-white/[0.015] hover:scale-[1.01] hover:shadow-xl transition-all cursor-pointer text-right flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <div className="flex items-center gap-3.5 mb-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/15 shrink-0">{initials}</div>
                  <div className="text-right">
                    <h3 className="text-sm font-bold text-white">{m.name}</h3>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">{m.phone}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs flex-row-reverse border-t border-white/[0.04] pt-3 mt-2">
                  <div className="text-right">
                    <p className="text-[9px] text-white/35">طرح اشتراک</p>
                    <p className="font-semibold text-white/70 text-[11px] mt-0.5">{planName}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                  }`}>{isActive ? "فعال" : "فاقد طرح"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Create Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
          <div className="w-full max-w-sm glass-strong p-6 rounded-2xl border border-white/20 text-right">
            {successMsg ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-base font-bold text-emerald-400">عضو ایجاد شد</h3>
                <p className="text-xs text-white/60">{successMsg}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 flex-row-reverse">
                  <h2 className="text-base font-bold text-white">ثبت‌نام عضو جدید</h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-white/40 hover:text-white">&times;</button>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center mb-4">{errorMsg}</div>
                )}

                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1.5">نام و نام خانوادگی</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: سهراب سپهری"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1.5">شماره تلفن</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1.5">ایمیل (اختیاری)</label>
                    <input 
                      type="email" 
                      placeholder="sohrab@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 mb-1.5">رمز عبور پیش‌فرض</label>
                    <input 
                      type="text" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2 flex-row-reverse">
                    <button 
                      type="submit" 
                      disabled={isPending}
                      className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold">
                      {isPending ? "در حال ایجاد..." : "ایجاد حساب"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddModalOpen(false)}
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

      {/* Modal 2: Member Details */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
          <div className="w-full max-w-md glass-strong p-6 rounded-2xl border border-white/20 text-right max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 flex-row-reverse border-b border-white/[0.06] pb-3">
              <h2 className="text-base font-bold text-white">کارت جزئیات عضو باشگاه</h2>
              <button onClick={() => setSelectedMember(null)} className="text-white/40 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <div className="space-y-4">
              {/* Basic Details */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 text-right">
                <div className="flex justify-between items-center flex-row-reverse">
                  <p className="text-sm font-bold text-rose-400">{selectedMember.name}</p>
                  <span className="text-[10px] text-white/40">کد: {selectedMember.memberProfile?.membershipCode || "---"}</span>
                </div>
                <p className="text-xs text-white/60">تلفن: <span dir="ltr">{selectedMember.phone}</span></p>
                {selectedMember.email && <p className="text-xs text-white/60">ایمیل: <span dir="ltr">{selectedMember.email}</span></p>}
                {selectedMember.memberProfile?.dateOfBirth && (
                  <p className="text-xs text-white/60">تاریخ تولد: {new Date(selectedMember.memberProfile.dateOfBirth).toLocaleDateString("fa-IR")}</p>
                )}
              </div>

              {/* Workout Routine Section */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-white/60">برنامه ورزشی</p>
                {!selectedMember.memberProfile?.workoutRoutines || selectedMember.memberProfile.workoutRoutines.length === 0 ? (
                  <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04] flex items-center justify-between flex-row-reverse">
                    <p className="text-[10px] text-white/30">برنامه ورزشی تعریف نشده است.</p>
                    <button
                      onClick={() => handleOpenWorkoutModal(selectedMember)}
                      className="text-[10px] text-cyan-400 hover:underline font-bold">
                      + ثبت برنامه جدید
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-xs space-y-2 text-right">
                    <div className="flex justify-between flex-row-reverse font-semibold border-b border-white/[0.05] pb-1.5">
                      <span>{selectedMember.memberProfile.workoutRoutines[0].title}</span>
                      <button
                        onClick={() => handleOpenWorkoutModal(selectedMember)}
                        className="text-[10px] text-cyan-400 hover:underline font-bold">
                        ویرایش برنامه
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {selectedMember.memberProfile.workoutRoutines[0].tasks.map((task: any, idx: number) => (
                        <div key={task.id || idx} className="flex justify-between flex-row-reverse text-[10px] text-white/60">
                          <span>{task.exerciseName} ({task.sets} ست · {task.reps} تکرار)</span>
                          {task.notes && <span className="text-white/30 text-[9px]">{task.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subscriptions info */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-white/60">وضعیت طرح و اشتراک‌ها</p>
                {!selectedMember.memberProfile?.subscriptions || selectedMember.memberProfile.subscriptions.length === 0 ? (
                  <p className="text-[10px] text-white/30 bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">این کاربر فاقد هرگونه اشتراک یا فاکتور ثبت شده است.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedMember.memberProfile.subscriptions.map((sub: any) => {
                      const start = sub.startedAt ? new Date(sub.startedAt).toLocaleDateString("fa-IR") : "نامشخص";
                      const end = sub.endsAt ? new Date(sub.endsAt).toLocaleDateString("fa-IR") : "نامشخص";
                      return (
                        <div key={sub.id} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-xs space-y-1">
                          <div className="flex justify-between flex-row-reverse font-semibold">
                            <span>طرح {sub.plan?.name}</span>
                            <span className={sub.status === "ACTIVE" ? "text-emerald-400" : sub.status === "PENDING" ? "text-amber-400" : "text-white/40"}>
                              {sub.status === "ACTIVE" ? "فعال" : sub.status === "PENDING" ? "در انتظار تایید" : sub.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40">بازه: {start} الی {end}</p>
                          {sub.payments && sub.payments.length > 0 && (
                            <p className="text-[10px] text-cyan-400/80">
                              مبلغ: {Number(sub.payments[0].amount).toLocaleString("fa-IR")} تومان ({sub.payments[0].method === "TRANSFER" ? "کارت به کارت" : "آنلاین"})
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Emergency details */}
              {(selectedMember.memberProfile?.emergencyName || selectedMember.memberProfile?.emergencyPhone) && (
                <div className="space-y-1.5 p-3 bg-rose-950/10 border border-rose-900/20 rounded-lg text-xs">
                  <p className="font-semibold text-rose-400">تماس اضطراری</p>
                  <p className="text-[10px] text-white/60">نام: {selectedMember.memberProfile.emergencyName || "---"}</p>
                  <p className="text-[10px] text-white/60">تلفن: {selectedMember.memberProfile.emergencyPhone || "---"}</p>
                </div>
              )}

              {/* Medical notes */}
              {selectedMember.memberProfile?.medicalNotes && (
                <div className="space-y-1.5 p-3 bg-amber-950/10 border border-amber-900/20 rounded-lg text-xs">
                  <p className="font-semibold text-amber-400">ملاحظات پزشکی</p>
                  <p className="text-[10px] text-white/70">{selectedMember.memberProfile.medicalNotes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-5">
              <button 
                onClick={() => setSelectedMember(null)}
                className="btn-glass glass-card rounded-xl px-5 py-2 text-xs font-semibold text-white/70">
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Routine Define Modal */}
      {isWorkoutModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md anim-fade-in">
          <div className="w-full max-w-lg glass-strong p-6 rounded-2xl border border-white/20 text-right max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 flex-row-reverse border-b border-white/[0.06] pb-3">
              <h2 className="text-base font-bold text-white">تعریف برنامه ورزشی کاربر</h2>
              <button onClick={() => setIsWorkoutModalOpen(false)} className="text-white/40 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveWorkoutRoutine} className="space-y-4 text-right">
              <div>
                <label className="block text-[10px] text-white/40 mb-1">عنوان برنامه ورزشی</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: برنامه پا و سرشانه"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  className="input-glass w-full rounded-xl px-3.5 py-2.5 text-xs text-right"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center flex-row-reverse">
                  <span className="text-[10px] text-white/50">لیست حرکت‌های ورزشی</span>
                  <button 
                    type="button"
                    onClick={handleAddWorkoutTaskField}
                    className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg font-semibold hover:bg-rose-500/30">
                    + افزودن حرکت
                  </button>
                </div>

                <div className="space-y-3 divide-y divide-white/[0.04]">
                  {workoutTasks.map((task, idx) => (
                    <div key={idx} className="pt-3 space-y-2">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <span className="text-xs text-white/40 font-mono">#{idx+1}</span>
                        <input 
                          type="text" 
                          required
                          placeholder="نام حرکت (مثال: پرس سینه دمبل)"
                          value={task.exerciseName}
                          onChange={(e) => handleWorkoutTaskChange(idx, "exerciseName", e.target.value)}
                          className="input-glass flex-1 rounded-xl px-3 py-2 text-xs text-right"
                        />
                        {workoutTasks.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveWorkoutTaskField(idx)}
                            className="text-rose-500 hover:text-rose-400 text-xs px-1 font-bold">
                            حذف
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 flex-row-reverse">
                        <div>
                          <label className="block text-[9px] text-white/30 mb-0.5">ست‌ها</label>
                          <input 
                            type="number" 
                            required
                            placeholder="3"
                            value={task.sets}
                            onChange={(e) => handleWorkoutTaskChange(idx, "sets", e.target.value)}
                            className="input-glass w-full rounded-xl px-3 py-1.5 text-xs text-left"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-white/30 mb-0.5">تکرارها</label>
                          <input 
                            type="text" 
                            required
                            placeholder="12-12-10"
                            value={task.reps}
                            onChange={(e) => handleWorkoutTaskChange(idx, "reps", e.target.value)}
                            className="input-glass w-full rounded-xl px-3 py-1.5 text-xs text-left font-mono"
                            dir="ltr"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-[9px] text-white/30 mb-0.5">توضیح مربی</label>
                          <input 
                            type="text" 
                            placeholder="مثال: سنگین"
                            value={task.notes}
                            onChange={(e) => handleWorkoutTaskChange(idx, "notes", e.target.value)}
                            className="input-glass w-full rounded-xl px-3 py-1.5 text-xs text-right"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 flex-row-reverse border-t border-white/[0.06]">
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold">
                  {isPending ? "در حال ذخیره..." : "ذخیره برنامه ورزشی"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsWorkoutModalOpen(false)}
                  className="btn-glass glass-card rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60">
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

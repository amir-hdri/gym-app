"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTrainer,
  updateTrainer,
  deleteTrainer,
  deactivateTrainer,
  activateTrainer,
  assignTrainerToMember,
  unassignTrainerFromMember,
  addTrainerSchedule,
  deleteTrainerSchedule,
} from "@/server/actions/trainers";

interface TrainerItem {
  id: string;
  userId: string;
  employeeCode: string;
  title: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    avatarUrl: string | null;
  };
  trainerAssignments?: Array<{
    id: string;
    active: boolean;
    startDate: string;
    note: string | null;
    member?: {
      id: string;
      membershipCode: string;
      user?: {
        name: string;
        phone: string;
      };
    };
  }>;
  classes?: Array<{
    id: string;
    title: string;
    category: string | null;
    location: string | null;
    capacity: number | null;
    startAt: string;
    endAt: string;
  }>;
  _count?: {
    trainerAssignments: number;
    classes: number;
  };
}

interface MemberItem {
  id: string;
  membershipCode: string;
  user: {
    id: string;
    name: string;
    phone: string;
  };
  trainerAssignments?: any[];
}

interface Props {
  initialTrainers: TrainerItem[];
  allMembers: MemberItem[];
}

export default function TrainersClient({ initialTrainers, allMembers }: Props) {
  const router = useRouter();
  const [trainers, setTrainers] = useState<TrainerItem[]>(initialTrainers);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [activeTrainer, setActiveTrainer] = useState<TrainerItem | null>(null);

  // Add Trainer Form
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addEmployeeCode, setAddEmployeeCode] = useState("");
  const [addPassword, setAddPassword] = useState("trainer123");

  // Edit Trainer Form
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editEmployeeCode, setEditEmployeeCode] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editNewPassword, setEditNewPassword] = useState("");

  // Assign Member Form
  const [selectedMemberId, setSelectedMemberId] = useState(allMembers[0]?.id || "");
  const [assignNote, setAssignNote] = useState("");

  // Schedule Form
  const [scheduleTitle, setScheduleTitle] = useState("سانس تمرین خصوصی / کلاس بدنسازی");
  const [scheduleCategory, setScheduleCategory] = useState("بدنسازی و فیتنس");
  const [scheduleLocation, setScheduleLocation] = useState("سالن شماره ۱");
  const [scheduleCapacity, setScheduleCapacity] = useState("15");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [scheduleDesc, setScheduleDesc] = useState("");

  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Filtered trainers
  const filtered = trainers.filter((t) => {
    const q = search.toLowerCase();
    const name = t.user?.name || "";
    const phone = t.user?.phone || "";
    const code = t.employeeCode || "";
    const title = t.title || "";
    return name.toLowerCase().includes(q) || phone.includes(q) || code.toLowerCase().includes(q) || title.toLowerCase().includes(q);
  });

  // Open Edit Modal
  const handleOpenEdit = (t: TrainerItem) => {
    setActiveTrainer(t);
    setEditName(t.user?.name || "");
    setEditPhone(t.user?.phone || "");
    setEditEmail(t.user?.email || "");
    setEditTitle(t.title || "");
    setEditEmployeeCode(t.employeeCode || "");
    setEditStatus((t.status as any) || "ACTIVE");
    setEditNewPassword("");
    setMsg(null);
    setShowEditModal(true);
  };

  // Open Assign Modal
  const handleOpenAssign = (t: TrainerItem) => {
    setActiveTrainer(t);
    setSelectedMemberId(allMembers[0]?.id || "");
    setAssignNote("تخصیص از طریق پنل مدیریت");
    setMsg(null);
    setShowAssignModal(true);
  };

  // Open Schedule Modal
  const handleOpenSchedule = (t: TrainerItem) => {
    setActiveTrainer(t);
    const now = new Date();
    now.setHours(17, 0, 0, 0);
    const end = new Date(now.getTime() + 1.5 * 3600 * 1000);
    
    // Format YYYY-MM-DDTHH:mm
    const toISOInput = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setScheduleStart(toISOInput(now));
    setScheduleEnd(toISOInput(end));
    setMsg(null);
    setShowScheduleModal(true);
  };

  // Handle Add Trainer
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const fd = new FormData();
    fd.append("name", addName);
    fd.append("phone", addPhone);
    fd.append("email", addEmail);
    fd.append("title", addTitle);
    fd.append("employeeCode", addEmployeeCode);
    fd.append("password", addPassword);

    startTransition(async () => {
      try {
        await createTrainer(fd);
        setMsg({ type: "success", text: "✅ مربی جدید با موفقیت اضافه شد!" });
        setAddName("");
        setAddPhone("");
        setAddEmail("");
        setAddTitle("");
        setAddEmployeeCode("");
        setAddPassword("trainer123");
        setTimeout(() => {
          setShowAddModal(false);
          setMsg(null);
          router.refresh();
        }, 1200);
      } catch (err: any) {
        setMsg({ type: "error", text: err.message || "خطا در ثبت مربی" });
      }
    });
  };

  // Handle Update Trainer
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrainer) return;
    setMsg(null);

    const fd = new FormData();
    fd.append("staffId", activeTrainer.id);
    fd.append("name", editName);
    fd.append("phone", editPhone);
    fd.append("email", editEmail);
    fd.append("title", editTitle);
    fd.append("employeeCode", editEmployeeCode);
    fd.append("status", editStatus);
    fd.append("newPassword", editNewPassword);

    startTransition(async () => {
      try {
        await updateTrainer(fd);
        setMsg({ type: "success", text: "✅ اطلاعات مربی با موفقیت به‌روزرسانی شد!" });
        setTimeout(() => {
          setShowEditModal(false);
          setMsg(null);
          router.refresh();
        }, 1200);
      } catch (err: any) {
        setMsg({ type: "error", text: err.message || "خطا در ویرایش مربی" });
      }
    });
  };

  // Handle Delete Trainer
  const handleDelete = (t: TrainerItem) => {
    if (!confirm(`آیا از حذف کامل مربی «${t.user?.name}» اطمینان دارید؟ تمام تخصیص‌ها پاک خواهند شد.`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteTrainer(t.id);
        alert("✅ مربی با موفقیت حذف شد.");
        router.refresh();
      } catch (err: any) {
        alert(err.message || "خطا در حذف مربی");
      }
    });
  };

  // Handle Toggle Status
  const handleToggleStatus = (t: TrainerItem) => {
    const action = t.status === "ACTIVE" ? "غیرفعال" : "فعال";
    if (!confirm(`آیا می‌خواهید وضعیت مربی «${t.user?.name}» را به ${action} تغییر دهید؟`)) return;

    startTransition(async () => {
      try {
        if (t.status === "ACTIVE") {
          await deactivateTrainer(t.id);
        } else {
          await activateTrainer(t.id);
        }
        router.refresh();
      } catch (err: any) {
        alert(err.message || "خطا");
      }
    });
  };

  // Handle Assign Member
  const handleAssignMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrainer || !selectedMemberId) return;
    setMsg(null);

    startTransition(async () => {
      try {
        await assignTrainerToMember(selectedMemberId, activeTrainer.id, assignNote);
        setMsg({ type: "success", text: "✅ ورزشکار با موفقیت به این مربی اختصاص یافت!" });
        setTimeout(() => {
          setShowAssignModal(false);
          setMsg(null);
          router.refresh();
        }, 1200);
      } catch (err: any) {
        setMsg({ type: "error", text: err.message || "خطا در تخصیص ورزشکار" });
      }
    });
  };

  // Handle Unassign Member
  const handleUnassign = (assignmentId: string) => {
    if (!confirm("آیا از لغو تخصیص این ورزشکار اطمینان دارید؟")) return;

    startTransition(async () => {
      try {
        await unassignTrainerFromMember(assignmentId);
        alert("✅ تخصیص ورزشکار لغو گردید.");
        setShowAssignModal(false);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "خطا");
      }
    });
  };

  // Handle Add Schedule Slot
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrainer) return;
    setMsg(null);

    startTransition(async () => {
      try {
        await addTrainerSchedule({
          trainerId: activeTrainer.id,
          title: scheduleTitle,
          category: scheduleCategory,
          location: scheduleLocation,
          capacity: parseInt(scheduleCapacity) || 15,
          startAt: scheduleStart,
          endAt: scheduleEnd,
          description: scheduleDesc,
        });
        setMsg({ type: "success", text: "✅ سانس و زمان‌بندی مربی با موفقیت ثبت شد!" });
        setTimeout(() => {
          setShowScheduleModal(false);
          setMsg(null);
          router.refresh();
        }, 1200);
      } catch (err: any) {
        setMsg({ type: "error", text: err.message || "خطا در ثبت زمان‌بندی" });
      }
    });
  };

  // Handle Delete Schedule Slot
  const handleDeleteScheduleSlot = (sessionId: string) => {
    if (!confirm("آیا از حذف این سانس زمان‌بندی اطمینان دارید؟")) return;

    startTransition(async () => {
      try {
        await deleteTrainerSchedule(sessionId);
        alert("✅ سانس زمان‌بندی با موفقیت حذف شد.");
        setShowScheduleModal(false);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "خطا در حذف سانس");
      }
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white">مدیریت مربیان و کادر فنی</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              {trainers.length} مربی
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            افزودن، ویرایش، حذف، تخصیص ورزشکاران و زمان‌بندی شیفت‌ها و کارگاه‌های مربیان
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="جستجوی مربی..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass rounded-xl px-3.5 py-2 text-xs w-48 sm:w-60"
          />
          <button
            onClick={() => {
              setMsg(null);
              setShowAddModal(true);
            }}
            className="btn-primary rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shrink-0"
            style={{ background: "linear-gradient(135deg,#c9184a,#ff758f)" }}
          >
            <span>+ افزودن مربی</span>
          </button>
        </div>
      </div>

      {/* Trainers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t, idx) => {
          const activeAssignments = t.trainerAssignments?.filter((a) => a.active) || [];
          const classesCount = t.classes?.length || t._count?.classes || 0;

          return (
            <div
              key={t.id}
              className="glass p-5 rounded-3xl border border-white/10 hover:border-amber-500/40 transition-all space-y-4 relative overflow-hidden group anim-scale-in"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-lg shrink-0"
                    style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                  >
                    {t.user?.name ? t.user.name.charAt(0) : "م"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-white">{t.user?.name}</h3>
                    </div>
                    <p className="text-[11px] text-amber-300 font-semibold mt-0.5">{t.title || "مربی باشگاه"}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">
                      {t.employeeCode} | {t.user?.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleStatus(t)}
                  className={`text-[9px] px-2.5 py-1 rounded-full font-bold border transition-colors ${
                    t.status === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30"
                  }`}
                >
                  {t.status === "ACTIVE" ? "فعال" : "غیرفعال"}
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/5 text-center">
                <div>
                  <p className="text-base font-extrabold text-amber-300 font-mono">
                    {activeAssignments.length}
                  </p>
                  <p className="text-[10px] text-white/40">شاگردان اختصاصی</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-blue-300 font-mono">
                    {classesCount}
                  </p>
                  <p className="text-[10px] text-white/40">سانس‌ها & کلاس‌ها</p>
                </div>
              </div>

              {/* Assigned athletes quick preview */}
              {activeAssignments.length > 0 && (
                <div className="space-y-1 text-[11px]">
                  <span className="text-white/40 text-[10px]">شاگردان فعال:</span>
                  <div className="flex flex-wrap gap-1">
                    {activeAssignments.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-white/80 border border-white/5"
                      >
                        {a.member?.user?.name || "ورزشکار"}
                      </span>
                    ))}
                    {activeAssignments.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-white/40">
                        +{activeAssignments.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => handleOpenAssign(t)}
                  className="btn-glass rounded-xl py-2 px-1 text-[11px] font-bold text-amber-300 hover:text-white flex items-center justify-center gap-1"
                  title="تخصیص ورزشکار به این مربی"
                >
                  <span>👥 شاگردان ({activeAssignments.length})</span>
                </button>
                <button
                  onClick={() => handleOpenSchedule(t)}
                  className="btn-glass rounded-xl py-2 px-1 text-[11px] font-bold text-blue-300 hover:text-white flex items-center justify-center gap-1"
                  title="تنظیم زمان‌بندی و شیفت‌های مربی"
                >
                  <span>⏱️ زمان‌بندی ({classesCount})</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold text-[11px] transition-colors text-center"
                >
                  ✏️ ویرایش مشخصات
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[11px] transition-colors"
                  title="حذف مربی"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass p-12 text-center text-xs text-white/40 rounded-3xl">
          مربی‌ای با این مشخصات یافت نشد. می‌توانید با دکمه «+ افزودن مربی» مربی جدید تعریف کنید.
        </div>
      )}

      {/* ----------------- MODAL: ADD TRAINER ----------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
          <div className="glass-strong max-w-md w-full p-6 rounded-3xl border border-white/20 space-y-4 anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏋️‍♂️</span>
                <h3 className="text-base font-bold text-white">افزودن مربی جدید به باشگاه</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {msg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold text-center border ${
                  msg.type === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {msg.text}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="مثال: رضا مرادی"
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">شماره تلفن (لاگین) *</label>
                  <input
                    type="text"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    dir="ltr"
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">عنوان و تخصص</label>
                  <input
                    type="text"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="سرمربی بدنسازی و فیتنس"
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">کد پرسنلی (اختیاری)</label>
                  <input
                    type="text"
                    value={addEmployeeCode}
                    onChange={(e) => setAddEmployeeCode(e.target.value)}
                    placeholder="TRN-003"
                    dir="ltr"
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">ایمیل (اختیاری)</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="trainer@gym.com"
                    dir="ltr"
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">رمز عبور اولیه *</label>
                  <input
                    type="text"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-glass rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary rounded-xl px-5 py-2 text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#c9184a,#ff758f)" }}
                >
                  {isPending ? "در حال ایجاد..." : "ثبت مربی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: EDIT TRAINER ----------------- */}
      {showEditModal && activeTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
          <div className="glass-strong max-w-md w-full p-6 rounded-3xl border border-white/20 space-y-4 anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <h3 className="text-base font-bold text-white">ویرایش مشخصات مربی</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {msg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold text-center border ${
                  msg.type === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {msg.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">شماره تلفن (لاگین) *</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    dir="ltr"
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">عنوان و تخصص</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">کد پرسنلی</label>
                  <input
                    type="text"
                    value={editEmployeeCode}
                    onChange={(e) => setEditEmployeeCode(e.target.value)}
                    dir="ltr"
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">ایمیل</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    dir="ltr"
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-white/70">وضعیت مربی</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs bg-slate-900 text-white"
                  >
                    <option value="ACTIVE" className="bg-slate-900">فعال</option>
                    <option value="INACTIVE" className="bg-slate-900">غیرفعال</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-white/70">
                  تغییر رمز عبور (در صورت نیاز به تغییر وارد کنید)
                </label>
                <input
                  type="text"
                  placeholder="حداقل ۶ کاراکتر یا خالی بگذارید"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  dir="ltr"
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-glass rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary rounded-xl px-5 py-2 text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                >
                  {isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: ASSIGN ATHLETES ----------------- */}
      {showAssignModal && activeTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
          <div className="glass-strong max-w-lg w-full p-6 rounded-3xl border border-white/20 space-y-4 max-h-[90vh] overflow-y-auto anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">👥</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    شاگردان اختصاصی: {activeTrainer.user?.name}
                  </h3>
                  <p className="text-[10px] text-white/40">تخصیص یا لغو شاگردان برای این مربی</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {msg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold text-center border ${
                  msg.type === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {msg.text}
              </div>
            )}

            {/* Current Active Assignments */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-white/80">شاگردان فعلی مربی:</label>
              {(!activeTrainer.trainerAssignments || activeTrainer.trainerAssignments.filter((a) => a.active).length === 0) ? (
                <p className="text-xs text-white/40 p-3 bg-white/[0.02] rounded-xl text-center">
                  در حال حاضر ورزشکاری به این مربی اختصاص داده نشده است.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {activeTrainer.trainerAssignments.filter((a) => a.active).map((a) => (
                    <div
                      key={a.id}
                      className="glass p-3 rounded-2xl border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{a.member?.user?.name || "عضو"}</p>
                        <p className="text-[10px] text-white/40 font-mono">
                          {a.member?.membershipCode} | {a.member?.user?.phone}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnassign(a.id)}
                        disabled={isPending}
                        className="text-xs px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 font-bold transition-colors"
                      >
                        لغو تخصیص
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form: Assign New Athlete */}
            <form onSubmit={handleAssignMember} className="space-y-3 pt-3 border-t border-white/10">
              <label className="text-[11px] font-bold text-amber-300">+ تخصیص ورزشکار جدید به این مربی</label>

              <div>
                <label className="block text-[10px] font-semibold mb-1 text-white/70">انتخاب ورزشکار</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs bg-slate-900 text-white"
                  required
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900">
                      {m.user?.name} ({m.membershipCode || m.user?.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold mb-1 text-white/70">توضیحات و هدف تخصیص</label>
                <input
                  type="text"
                  placeholder="مثال: تمرکز بر افزایش توان، اصلاح پاسچر یا کاهش وزن"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn-glass rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  بستن
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary rounded-xl px-5 py-2 text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                >
                  {isPending ? "در حال تخصیص..." : "ثبت تخصیص ورزشکار"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: TRAINER SCHEDULE ----------------- */}
      {showScheduleModal && activeTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
          <div className="glass-strong max-w-lg w-full p-6 rounded-3xl border border-white/20 space-y-4 max-h-[90vh] overflow-y-auto anim-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    زمان‌بندی و سانس‌های: {activeTrainer.user?.name}
                  </h3>
                  <p className="text-[10px] text-white/40">مدیریت شیفت‌های کاری، سانس‌ها و کلاس‌های مربی</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {msg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold text-center border ${
                  msg.type === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {msg.text}
              </div>
            )}

            {/* Existing Scheduled Slots */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-white/80">سانس‌ها و کلاس‌های ثبت‌شده:</label>
              {(!activeTrainer.classes || activeTrainer.classes.length === 0) ? (
                <p className="text-xs text-white/40 p-3 bg-white/[0.02] rounded-xl text-center">
                  سانسی برای این مربی ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {activeTrainer.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="glass p-3 rounded-2xl border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">{cls.title}</p>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                            {cls.category || "سانس تمرینی"}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          مکان: {cls.location || "سالن اصلی"} | ظرفیت: {cls.capacity || 15} نفر
                        </p>
                        <p className="text-[10px] text-amber-300 font-mono mt-0.5" dir="ltr">
                          {new Date(cls.startAt).toLocaleString("fa-IR")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteScheduleSlot(cls.id)}
                        disabled={isPending}
                        className="text-xs px-2 py-1 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 font-bold transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form: Add New Schedule Slot */}
            <form onSubmit={handleAddSchedule} className="space-y-3 pt-3 border-t border-white/10">
              <label className="text-[11px] font-bold text-blue-300">+ افزودن زمان‌بندی / سانس جدید برای مربی</label>

              <div>
                <label className="block text-[10px] font-semibold mb-1 text-white/70">عنوان سانس / کلاس *</label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold mb-1 text-white/70">دسته‌بندی</label>
                  <input
                    type="text"
                    value={scheduleCategory}
                    onChange={(e) => setScheduleCategory(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold mb-1 text-white/70">مکان برگزاری</label>
                  <input
                    type="text"
                    value={scheduleLocation}
                    onChange={(e) => setScheduleLocation(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold mb-1 text-white/70">زمان شروع *</label>
                  <input
                    type="datetime-local"
                    value={scheduleStart}
                    onChange={(e) => setScheduleStart(e.target.value)}
                    dir="ltr"
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold mb-1 text-white/70">زمان پایان *</label>
                  <input
                    type="datetime-local"
                    value={scheduleEnd}
                    onChange={(e) => setScheduleEnd(e.target.value)}
                    dir="ltr"
                    className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold mb-1 text-white/70">حداکثر ظرفیت (نفر)</label>
                <input
                  type="number"
                  value={scheduleCapacity}
                  onChange={(e) => setScheduleCapacity(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2 text-xs font-mono text-center"
                  min={1}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn-glass rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  بستن
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary rounded-xl px-5 py-2 text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
                >
                  {isPending ? "در حال ثبت..." : "ثبت زمان‌بندی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

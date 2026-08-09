/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined;
}

// Precomputed bcrypt hashes for instant initialization
const HASH_ADMIN = bcrypt.hashSync("admin123", 10);
const HASH_MANAGER = bcrypt.hashSync("manager123", 10);
const HASH_TRAINER = bcrypt.hashSync("trainer123", 10);
const HASH_MEMBER = bcrypt.hashSync("member123", 10);

function getInitialSeedData() {
  const branchId = "branch-main";
  const branch = {
    id: branchId,
    name: "شعبه اصلی جیم‌اپ",
    phone: "+1-555-0000",
    email: "info@gymapp.ir",
    address: "خیابان ولیعصر، مجموعه ورزشی جیم‌اپ",
    city: "تهران",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const users: any[] = [
    {
      id: "usr-admin-1",
      name: "مدیر ارشد باشگاه",
      phone: "+1-555-0001",
      email: "admin@gym.com",
      passwordHash: HASH_ADMIN,
      role: "OWNER",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "usr-mgr-1",
      name: "مدیر داخلی باشگاه",
      phone: "+1-555-0002",
      email: "manager@gym.com",
      passwordHash: HASH_MANAGER,
      role: "MANAGER",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "usr-trn-1",
      name: "علی مرادی (سرمربی بدنسازی)",
      phone: "+1-555-2001",
      email: "ali.trainer@gym.com",
      passwordHash: HASH_TRAINER,
      role: "TRAINER",
      avatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "usr-trn-2",
      name: "مریم کاظمی (مربی پیلاتس و کراس‌فیت)",
      phone: "+1-555-2002",
      email: "maryam.trainer@gym.com",
      passwordHash: HASH_TRAINER,
      role: "TRAINER",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "usr-mem-1",
      name: "سارا محمدی",
      phone: "+1-555-1001",
      email: "sara@example.com",
      passwordHash: HASH_MEMBER,
      role: "MEMBER",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "usr-mem-2",
      name: "رضا احمدی",
      phone: "+1-555-1002",
      email: "reza@example.com",
      passwordHash: HASH_MEMBER,
      role: "MEMBER",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "usr-mem-3",
      name: "علی علوی",
      phone: "+1-555-1003",
      email: "ali@example.com",
      passwordHash: HASH_MEMBER,
      role: "MEMBER",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const staffProfiles: any[] = [
    {
      id: "staff-001",
      userId: "usr-admin-1",
      employeeCode: "STAFF-001",
      title: "مدیر ارشد باشگاه",
      status: "ACTIVE",
      accessType: "FULL",
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "staff-002",
      userId: "usr-mgr-1",
      employeeCode: "STAFF-002",
      title: "مدیر داخلی و پذیرش",
      status: "ACTIVE",
      accessType: "STANDARD",
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "staff-trn-1",
      userId: "usr-trn-1",
      employeeCode: "TRN-001",
      title: "سرمربی بدنسازی و فیتنس",
      status: "ACTIVE",
      accessType: "TRAINER",
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "staff-trn-2",
      userId: "usr-trn-2",
      employeeCode: "TRN-002",
      title: "مربی ارشد پیلاتس و فانکشنال",
      status: "ACTIVE",
      accessType: "TRAINER",
      branchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const memberProfiles: any[] = [
    {
      id: "prof-mem-1",
      userId: "usr-mem-1",
      membershipCode: "MEM-001",
      gender: "FEMALE",
      emergencyName: "محمد محمدی",
      emergencyPhone: "+1-555-9001",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "prof-mem-2",
      userId: "usr-mem-2",
      membershipCode: "MEM-002",
      gender: "MALE",
      emergencyName: "حسین احمدی",
      emergencyPhone: "+1-555-9002",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "prof-mem-3",
      userId: "usr-mem-3",
      membershipCode: "MEM-003",
      gender: "MALE",
      emergencyName: "مهدی علوی",
      emergencyPhone: "+1-555-9003",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const plans: any[] = [
    {
      id: "plan-basic",
      branchId,
      name: "ماهانه پایه",
      description: "دسترسی کامل به سالن بدنسازی و رختکن",
      price: 350000,
      currency: "IRR",
      durationDays: 30,
      freezeDaysAllowed: 0,
      maxVisitsPerWeek: null,
      maxSessions: null,
      isSessionBased: false,
      highlights: "ورود با QR کد، دسترسی به تجهیزات هوازی و قدرتی",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "plan-prem",
      branchId,
      name: "ماهانه پرمیوم",
      description: "دسترسی به تمامی امکانات + رزرو کلاس‌ها و مربی اختصاصی",
      price: 650000,
      currency: "IRR",
      durationDays: 30,
      freezeDaysAllowed: 7,
      maxVisitsPerWeek: null,
      maxSessions: null,
      isSessionBased: false,
      highlights: "برنامه تمرینی اختصاصی، ۷ روز تعلیق، بوفه و استخر",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "plan-elite",
      branchId,
      name: "سالانه الیت VIP",
      description: "عضویت یکساله ویژه با خدمات کامل مربی و مشاوره تغذیه",
      price: 5900000,
      currency: "IRR",
      durationDays: 365,
      freezeDaysAllowed: 30,
      maxVisitsPerWeek: null,
      maxSessions: null,
      isSessionBased: false,
      highlights: "مربی اختصاصی، تست بادی کامپوزیشن، ۳۰ روز تعلیق",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const now = new Date();
  const subStart = new Date(now.getTime() - 10 * 24 * 3600 * 1000);
  const subEnd = new Date(now.getTime() + 20 * 24 * 3600 * 1000);

  const subscriptions: any[] = [
    {
      id: "sub-1",
      memberId: "prof-mem-1",
      planId: "plan-prem",
      branchId,
      status: "ACTIVE",
      autoRenew: true,
      startedAt: subStart,
      endsAt: subEnd,
      sessionsUsed: 12,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "sub-2",
      memberId: "prof-mem-2",
      planId: "plan-basic",
      branchId,
      status: "ACTIVE",
      autoRenew: false,
      startedAt: subStart,
      endsAt: subEnd,
      sessionsUsed: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "sub-3",
      memberId: "prof-mem-3",
      planId: "plan-elite",
      branchId,
      status: "ACTIVE",
      autoRenew: true,
      startedAt: subStart,
      endsAt: new Date(now.getTime() + 355 * 24 * 3600 * 1000),
      sessionsUsed: 25,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const trainerAssignments: any[] = [
    {
      id: "ta-1",
      memberId: "prof-mem-1",
      trainerId: "staff-trn-1",
      assignedByUserId: "usr-admin-1",
      startDate: new Date(now.getTime() - 20 * 24 * 3600 * 1000),
      active: true,
      note: "تمرکز بر افزایش حجم عضلانی و کاهش درصد چربی",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "ta-2",
      memberId: "prof-mem-2",
      trainerId: "staff-trn-1",
      assignedByUserId: "usr-admin-1",
      startDate: new Date(now.getTime() - 15 * 24 * 3600 * 1000),
      active: true,
      note: "برنامه استقامتی و کراس‌فیت",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "ta-3",
      memberId: "prof-mem-3",
      trainerId: "staff-trn-2",
      assignedByUserId: "usr-admin-1",
      startDate: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
      active: true,
      note: "تمرینات اصلاحی و پیلاتس",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const workoutRoutines: any[] = [
    {
      id: "rtn-1",
      memberId: "prof-mem-1",
      title: "برنامه بدنسازی فاز ۱ - هایپرتروفی بالاتنه و پایین‌تنه",
      scheduledDays: "شنبه، دوشنبه، چهارشنبه",
      scheduledTime: "18:00",
      difficulty: "متوسط",
      goal: "افزایش حجم عضلانی",
      description: "برنامه اختصاصی ۳ روز در هفته با تمرکز بر حرکات چندمفصلی",
      trainerNote: "قبل از شروع حتماً ۱۰ دقیقه گرم کردن پویا انجام شود.",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const workoutTasks: any[] = [
    {
      id: "tsk-1",
      routineId: "rtn-1",
      exerciseName: "پرس سینه هالتر (Bench Press)",
      sets: 4,
      reps: "10-12",
      notes: "استراحت بین ست‌ها ۶۰ الی ۹۰ ثانیه",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "tsk-2",
      routineId: "rtn-1",
      exerciseName: "اسکات پا هالتر (Squat)",
      sets: 4,
      reps: "8-10",
      notes: "فرم صحیح و عمق مناسب رعایت شود",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "tsk-3",
      routineId: "rtn-1",
      exerciseName: "لت زیربغل دست باز (Lat Pulldown)",
      sets: 3,
      reps: "12",
      notes: "تمرکز بر انقباض عضلات لاتیسیموس",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "tsk-4",
      routineId: "rtn-1",
      exerciseName: "سرشانه دمبل نشر از جلو و جانب",
      sets: 3,
      reps: "15",
      notes: "کنترل کامل در فاز منفی حرکت",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const progressEntries: any[] = [
    {
      id: "prg-1",
      memberId: "prof-mem-1",
      trainerId: "staff-trn-1",
      createdByUserId: "usr-trn-1",
      metricType: "WEIGHT",
      value: 68.5,
      unit: "kg",
      notes: "اندازه‌گیری اول دوره",
      measuredAt: new Date(now.getTime() - 21 * 24 * 3600 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "prg-2",
      memberId: "prof-mem-1",
      trainerId: "staff-trn-1",
      createdByUserId: "usr-trn-1",
      metricType: "WEIGHT",
      value: 67.2,
      unit: "kg",
      notes: "کاهش ۱.۳ کیلوگرم چربی و بهبود توان",
      measuredAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "prg-3",
      memberId: "prof-mem-1",
      trainerId: "staff-trn-1",
      createdByUserId: "usr-trn-1",
      metricType: "BODY_FAT",
      value: 22.4,
      unit: "%",
      notes: "کاهش درصد چربی به محدوده ایده‌آل",
      measuredAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const classSessions: any[] = [
    {
      id: "cls-1",
      branchId,
      trainerId: "staff-trn-1",
      title: "کلاس فیتنس و کراس فیت قدرتی",
      description: "تمرینات ترکیبی قدرتی و استقامتی مناسب تمامی سطوح",
      trainerName: "علی مرادی",
      category: "قدرتی و فانکشنال",
      visibility: "MEMBERS_ONLY",
      startAt: new Date(now.getTime() + 1 * 24 * 3600 * 1000 + 4 * 3600 * 1000),
      endAt: new Date(now.getTime() + 1 * 24 * 3600 * 1000 + 5.5 * 3600 * 1000),
      capacity: 15,
      location: "سالن کراس‌فیت طبقه ۲",
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "cls-2",
      branchId,
      trainerId: "staff-trn-2",
      title: "کلاس پیلاتس و انعطاف‌پذیری",
      description: "تقویت عضلات مرکزی کور، افزایش انعطاف و اصلاح پاسچر",
      trainerName: "مریم کاظمی",
      category: "پیلاتس و انعطاف",
      visibility: "MEMBERS_ONLY",
      startAt: new Date(now.getTime() + 2 * 24 * 3600 * 1000 + 3 * 3600 * 1000),
      endAt: new Date(now.getTime() + 2 * 24 * 3600 * 1000 + 4.5 * 3600 * 1000),
      capacity: 12,
      location: "استودیو پیلاتس طبقه ۱",
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const attendance: any[] = [
    {
      id: "att-1",
      memberId: "prof-mem-1",
      branchId,
      checkInAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
      method: "QR",
      status: "CHECKED_IN",
      createdAt: new Date(),
    },
    {
      id: "att-2",
      memberId: "prof-mem-1",
      branchId,
      checkInAt: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
      method: "QR",
      status: "CHECKED_IN",
      createdAt: new Date(),
    },
  ];

  const notifications: any[] = [
    {
      id: "notif-1",
      userId: "usr-mem-1",
      channel: "IN_APP",
      type: "WORKOUT",
      title: "برنامه تمرینی جدید",
      body: "مربی شما برنامه تمرینی جدید فاز ۱ را برای شما ثبت کرد.",
      readAt: null,
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "notif-2",
      userId: "usr-trn-1",
      channel: "IN_APP",
      type: "ATHLETE",
      title: "ورزشکار جدید تحت نظر",
      body: "سارا محمدی به عنوان ورزشکار جدید به شما اختصاص یافت.",
      readAt: null,
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const payments: any[] = [
    {
      id: "pay-1",
      subscriptionId: "sub-1",
      amount: 650000,
      currency: "IRR",
      method: "ONLINE",
      status: "PAID",
      provider: "Zarinpal",
      transactionRef: "TRX-982341",
      paidAt: subStart,
      note: "پرداخت آنلاین طرح پرمیوم",
      recordedByUserId: "usr-admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return {
    branch: [branch],
    user: users,
    staffProfile: staffProfiles,
    memberProfile: memberProfiles,
    plan: plans,
    subscription: subscriptions,
    trainerAssignment: trainerAssignments,
    workoutRoutine: workoutRoutines,
    workoutTask: workoutTasks,
    workoutLog: [],
    workoutSchedule: [],
    progressEntry: progressEntries,
    classSession: classSessions,
    classBooking: [],
    attendance,
    notification: notifications,
    payment: payments,
    freezeRequest: [],
    coupon: [],
    auditLog: [],
    account: [],
    session: [],
    verificationToken: [],
  };
}

function createMockPrisma() {
  const memoryStore: Record<string, any[]> = getInitialSeedData();

  // Helper to attach relations for mock queries
  const attachRelations = (modelName: string, item: any, include?: any) => {
    if (!item || !include) return item;
    const clone = { ...item };

    if (modelName === "user") {
      if (include.memberProfile) {
        clone.memberProfile = memoryStore.memberProfile?.find((p) => p.userId === item.id) || null;
      }
      if (include.staffProfile) {
        clone.staffProfile = memoryStore.staffProfile?.find((p) => p.userId === item.id) || null;
      }
      if (include.branch) {
        clone.branch = memoryStore.branch?.find((b) => b.id === item.branchId) || null;
      }
    }

    if (modelName === "memberProfile") {
      if (include.user) {
        clone.user = memoryStore.user?.find((u) => u.id === item.userId) || null;
      }
      if (include.subscriptions) {
        clone.subscriptions = memoryStore.subscription?.filter((s) => s.memberId === item.id) || [];
      }
      if (include.trainerAssignments) {
        clone.trainerAssignments = (memoryStore.trainerAssignment?.filter((t) => t.memberId === item.id) || []).map((t) => ({
          ...t,
          trainer: memoryStore.staffProfile?.find((s) => s.id === t.trainerId) || null,
        }));
      }
      if (include.workoutRoutines) {
        clone.workoutRoutines = memoryStore.workoutRoutine?.filter((w) => w.memberId === item.id) || [];
      }
    }

    if (modelName === "staffProfile") {
      if (include.user) {
        clone.user = memoryStore.user?.find((u) => u.id === item.userId) || null;
      }
      if (include.trainerAssignments) {
        clone.trainerAssignments = (memoryStore.trainerAssignment?.filter((t) => t.trainerId === item.id && (include.trainerAssignments?.where?.active !== undefined ? t.active === include.trainerAssignments.where.active : true)) || []).map((ta) => {
          if (include.trainerAssignments?.include?.member) {
            const mem = memoryStore.memberProfile?.find((m) => m.id === ta.memberId);
            if (mem) {
              const memClone = { ...mem };
              if (include.trainerAssignments?.include?.member?.include?.user) {
                memClone.user = memoryStore.user?.find((u) => u.id === mem.userId) || null;
              }
              return { ...ta, member: memClone };
            }
          }
          return ta;
        });
      }
      if (include.classes) {
        clone.classes = memoryStore.classSession?.filter((c) => c.trainerId === item.id) || [];
      }
      if (include._count) {
        clone._count = {
          trainerAssignments: (memoryStore.trainerAssignment?.filter((t) => t.trainerId === item.id && t.active) || []).length,
          classes: (memoryStore.classSession?.filter((c) => c.trainerId === item.id) || []).length,
        };
      }
    }

    if (modelName === "subscription") {
      if (include.plan) {
        clone.plan = memoryStore.plan?.find((p) => p.id === item.planId) || null;
      }
      if (include.member) {
        const mem = memoryStore.memberProfile?.find((p) => p.id === item.memberId) || null;
        if (mem && include.member?.include?.user) {
          mem.user = memoryStore.user?.find((u) => u.id === mem.userId) || null;
        }
        clone.member = mem;
      }
      if (include.payments) {
        clone.payments = memoryStore.payment?.filter((p) => p.subscriptionId === item.id) || [];
      }
      if (include.freezeRequests) {
        clone.freezeRequests = memoryStore.freezeRequest?.filter((f) => f.subscriptionId === item.id) || [];
      }
    }

    if (modelName === "workoutRoutine") {
      if (include.tasks) {
        clone.tasks = (memoryStore.workoutTask?.filter((t) => t.routineId === item.id) || []).map((task) => {
          if (include.tasks?.include?.logs) {
            return {
              ...task,
              logs: memoryStore.workoutLog?.filter((l) => l.taskId === task.id) || [],
            };
          }
          return task;
        });
      }
      if (include.schedules) {
        clone.schedules = memoryStore.workoutSchedule?.filter((s) => s.routineId === item.id) || [];
      }
      if (include.member) {
        const mem = memoryStore.memberProfile?.find((p) => p.id === item.memberId) || null;
        if (mem && include.member?.include?.user) {
          mem.user = memoryStore.user?.find((u) => u.id === mem.userId) || null;
        }
        clone.member = mem;
      }
    }

    if (modelName === "classSession") {
      if (include.trainer) {
        const staff = memoryStore.staffProfile?.find((s) => s.id === item.trainerId) || null;
        if (staff && include.trainer?.include?.user) {
          staff.user = memoryStore.user?.find((u) => u.id === staff.userId) || null;
        }
        clone.trainer = staff;
      }
      if (include.bookings) {
        clone.bookings = (memoryStore.classBooking?.filter((b) => b.classSessionId === item.id) || []).map((b) => {
          if (include.bookings?.include?.member) {
            const mem = memoryStore.memberProfile?.find((p) => p.id === b.memberId) || null;
            if (mem && include.bookings?.include?.member?.include?.user) {
              mem.user = memoryStore.user?.find((u) => u.id === mem.userId) || null;
            }
            return { ...b, member: mem };
          }
          return b;
        });
      }
    }

    if (modelName === "trainerAssignment") {
      if (include.trainer) {
        const staff = memoryStore.staffProfile?.find((s) => s.id === item.trainerId) || null;
        if (staff) {
          staff.user = memoryStore.user?.find((u) => u.id === staff.userId) || null;
        }
        clone.trainer = staff;
      }
      if (include.member) {
        const mem = memoryStore.memberProfile?.find((p) => p.id === item.memberId) || null;
        if (mem) {
          mem.user = memoryStore.user?.find((u) => u.id === mem.userId) || null;
        }
        clone.member = mem;
      }
    }

    if (modelName === "progressEntry") {
      if (include.member) {
        const mem = memoryStore.memberProfile?.find((p) => p.id === item.memberId) || null;
        if (mem && include.member?.include?.user) {
          mem.user = memoryStore.user?.find((u) => u.id === mem.userId) || null;
        }
        clone.member = mem;
      }
    }

    return clone;
  };

  const matchesWhere = (item: any, where: any): boolean => {
    if (!where) return true;
    for (const [k, v] of Object.entries(where)) {
      if (v === undefined) continue;
      if (k === "OR" && Array.isArray(v)) {
        const orMatch = v.some((condition) => matchesWhere(item, condition));
        if (!orMatch) return false;
        continue;
      }
      if (k === "AND" && Array.isArray(v)) {
        const andMatch = v.every((condition) => matchesWhere(item, condition));
        if (!andMatch) return false;
        continue;
      }
      if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
        if ("gte" in (v as any) && item[k] < (v as any).gte) return false;
        if ("lte" in (v as any) && item[k] > (v as any).lte) return false;
        if ("gt" in (v as any) && item[k] <= (v as any).gt) return false;
        if ("lt" in (v as any) && item[k] >= (v as any).lt) return false;
        if ("in" in (v as any) && !(v as any).in.includes(item[k])) return false;
        if ("not" in (v as any) && item[k] === (v as any).not) return false;
        if ("contains" in (v as any) && !String(item[k] || "").toLowerCase().includes(String((v as any).contains).toLowerCase())) return false;
        continue;
      }
      if (v === null && item[k] !== null) return false;
      if (v !== null && item[k] !== v) return false;
    }
    return true;
  };

  const makeModel = (modelName: string) =>
    new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          if (prop === "then") return undefined;
          return async (...args: any[]) => {
            const p = String(prop);
            const store = memoryStore[modelName] || (memoryStore[modelName] = []);

            if (p === "findMany") {
              const query = args?.[0] || {};
              let res = [...store];
              if (query.where) {
                res = res.filter((item) => matchesWhere(item, query.where));
              }
              if (query.orderBy) {
                const orderKey = Object.keys(query.orderBy)[0];
                const orderDir = query.orderBy[orderKey];
                if (orderKey) {
                  res.sort((a, b) => {
                    const valA = a[orderKey];
                    const valB = b[orderKey];
                    if (valA < valB) return orderDir === "desc" ? 1 : -1;
                    if (valA > valB) return orderDir === "desc" ? -1 : 1;
                    return 0;
                  });
                }
              }
              if (query.take && typeof query.take === "number") {
                res = res.slice(0, query.take);
              }
              return res.map((item) => attachRelations(modelName, item, query.include));
            }

            if (p === "count") {
              const query = args?.[0] || {};
              let res = [...store];
              if (query.where) {
                res = res.filter((item) => matchesWhere(item, query.where));
              }
              return res.length;
            }

            if (["findUnique", "findFirst"].includes(p)) {
              const query = args?.[0] || {};
              if (query.where) {
                const found = store.find((item) => matchesWhere(item, query.where));
                if (found) return attachRelations(modelName, found, query.include);
                return null;
              }
              const first = store[0] || null;
              if (first) return attachRelations(modelName, first, query.include);
              return null;
            }

            if (["findUniqueOrThrow", "findFirstOrThrow"].includes(p)) {
              const query = args?.[0] || {};
              const found = await (makeModel(modelName) as any).findFirst(query);
              if (found) return found;
              return {
                id: "mock-id",
                name: "Mock Item",
                price: 350000,
                durationDays: 30,
                freezeDaysAllowed: 0,
                maxSessions: 12,
                isSessionBased: false,
                amount: 350000,
                plan: { name: "Mock Plan", price: 350000, durationDays: 30, freezeDaysAllowed: 0, maxSessions: 12, isSessionBased: false },
                member: { user: { name: "کاربر آزمایشی", id: "mock-user" }, membershipCode: "MEM-MOCK", userId: "mock-user" },
                subscription: {
                  id: "mock-sub",
                  plan: { name: "Mock Plan", price: 350000, durationDays: 30 },
                  member: { user: { name: "کاربر آزمایشی", id: "mock-user" } },
                },
                user: { name: "کاربر آزمایشی", id: "mock-user", phone: "+100000000", branchId: null },
                memberProfile: null,
              };
            }

            if (["create", "upsert"].includes(p)) {
              const data = args?.[0]?.data || args?.[0]?.create || {};
              const flatData: any = { ...data };
              const id = data.id || `gen-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
              
              if (flatData.memberProfile?.create) {
                const profId = `prof-${id}`;
                const prof = {
                  id: profId,
                  userId: id,
                  ...flatData.memberProfile.create,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                memoryStore.memberProfile.push(prof);
                delete flatData.memberProfile;
              }
              if (flatData.staffProfile?.create) {
                const staffId = `staff-${id}`;
                const staff = {
                  id: staffId,
                  userId: id,
                  ...flatData.staffProfile.create,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                memoryStore.staffProfile.push(staff);
                delete flatData.staffProfile;
              }
              if (flatData.user?.create) {
                const userId = `usr-${id}`;
                const user = {
                  id: userId,
                  ...flatData.user.create,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                memoryStore.user.push(user);
                flatData.userId = userId;
                delete flatData.user;
              }

              const created = {
                id,
                ...flatData,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              store.push(created);
              return attachRelations(modelName, created, args?.[0]?.include);
            }

            if (p === "update") {
              const where = args?.[0]?.where || {};
              const data = args?.[0]?.data || {};
              const index = store.findIndex((item) => matchesWhere(item, where));
              const updatedData = { ...data };
              if (data.sessionsUsed?.increment) {
                const current = (index >= 0 ? store[index].sessionsUsed : 0) || 0;
                updatedData.sessionsUsed = current + data.sessionsUsed.increment;
              }
              if (index >= 0) {
                store[index] = { ...store[index], ...updatedData, updatedAt: new Date() };
                return attachRelations(modelName, store[index], args?.[0]?.include);
              }
              const fallback = { id: where.id || "mock-id", ...updatedData, updatedAt: new Date() };
              return fallback;
            }

            if (p === "delete") {
              const where = args?.[0]?.where || {};
              const index = store.findIndex((item) => matchesWhere(item, where));
              if (index >= 0) {
                const removed = store.splice(index, 1);
                return removed[0];
              }
              return { id: where.id || "mock-id" };
            }

            if (["createMany", "updateMany", "deleteMany"].includes(p)) {
              if (p === "createMany" && Array.isArray(args?.[0]?.data)) {
                args[0].data.forEach((d: any) => {
                  store.push({ id: `gen-${Math.random().toString(36).substring(2, 9)}`, ...d, createdAt: new Date() });
                });
                return { count: args[0].data.length };
              }
              if (p === "updateMany") {
                const where = args?.[0]?.where || {};
                const data = args?.[0]?.data || {};
                let count = 0;
                store.forEach((item) => {
                  if (matchesWhere(item, where)) {
                    Object.assign(item, data, { updatedAt: new Date() });
                    count++;
                  }
                });
                return { count };
              }
              if (p === "deleteMany") {
                const where = args?.[0]?.where || {};
                const initLen = store.length;
                const filtered = store.filter((item) => !matchesWhere(item, where));
                memoryStore[modelName] = filtered;
                return { count: initLen - filtered.length };
              }
              return { count: 0 };
            }

            if (p === "$transaction") {
              const input = args[0];
              if (Array.isArray(input)) return Promise.all(input);
              if (typeof input === "function") return input(createMockPrisma());
              return [];
            }

            return null;
          };
        },
      }
    );

  const handler: ProxyHandler<any> = {
    get: (_target, prop: string) => {
      const p = String(prop);
      if (p === "$transaction") {
        return async (arg: any) => {
          if (Array.isArray(arg)) return Promise.all(arg);
          if (typeof arg === "function") return arg(new Proxy({}, handler));
          return arg;
        };
      }
      if (p === "$connect" || p === "$disconnect" || p === "$on" || p === "$use") {
        return async () => {};
      }
      if (p === "__isMock") return true;
      return makeModel(p);
    },
  };

  return new Proxy({}, handler);
}

let prisma: any;

// Use singleton mock instance with complete seed data
if (!global.__prisma) {
  global.__prisma = createMockPrisma();
}
prisma = global.__prisma;

export { prisma };

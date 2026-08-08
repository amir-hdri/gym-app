"use server";

import { prisma } from "@/lib/prisma";
import { verifyQrToken, getTodayDayOfWeek, getDayNamePersian } from "@/lib/qr";
import { revalidatePath } from "next/cache";

export interface CheckInOutOptions {
  type?: "REGULAR" | "CLASS" | "PT" | string;
  trainerId?: string;
  note?: string;
  method?: "QR" | "MANUAL" | "AUTO";
}

function getTodayISOStr(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Checks in a member by QR token or static membership code.
 * Validates session-based plans, maxVisitsPerWeek, active subscriptions, and duplicate open check-ins.
 */
export async function checkInByCode(
  codeOrToken: string,
  verifiedByUserId?: string,
  options?: CheckInOutOptions
) {
  const verifyResult = verifyQrToken(codeOrToken);
  if (!verifyResult.valid) {
    return { success: false, error: verifyResult.error || "کد QR نامعتبر است" };
  }

  const membershipCode = (verifyResult.membershipCode || codeOrToken).trim().toUpperCase();

  // Find member profile by code or memberId
  const profile = await prisma.memberProfile.findFirst({
    where: {
      OR: [
        { membershipCode },
        ...(verifyResult.memberId ? [{ id: verifyResult.memberId }] : []),
      ],
    },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      },
      user: { select: { id: true, name: true, phone: true, branchId: true } },
    },
  });

  if (!profile) {
    return { success: false, error: `عضوی با کد «${membershipCode}» یافت نشد` };
  }

  const memberName = profile.user?.name || "کاربر باشگاه";

  // Check active subscription
  const activeSub = profile.subscriptions?.[0];
  if (!activeSub) {
    const pausedSub = await prisma.subscription.findFirst({
      where: { memberId: profile.id, status: "PAUSED" },
    });
    if (pausedSub) {
      return { success: false, error: `اشتراک ${memberName} در وضعیت تعلیق (مرخصی) قرار دارد` };
    }
    return { success: false, error: `${memberName} فاقد اشتراک فعال در باشگاه است` };
  }

  // Check expiration of subscription by date
  if (activeSub.endsAt && new Date(activeSub.endsAt) < new Date()) {
    return { success: false, error: `تاریخ اعتبار اشتراک ${memberName} به پایان رسیده است` };
  }

  const plan = activeSub.plan;

  // Check session-based package limit (A6)
  const isSessionBased = plan?.isSessionBased || (plan?.maxSessions && plan.maxSessions > 0);
  const maxSessions = plan?.maxSessions || 0;
  const sessionsUsed = activeSub.sessionsUsed || 0;

  if (isSessionBased && maxSessions > 0) {
    if (sessionsUsed >= maxSessions) {
      return {
        success: false,
        error: `جلسات تمام شد (${sessionsUsed}/${maxSessions}) - لطفاً اشتراک جدید تهیه فرمایید`,
        sessionsUsed,
        maxSessions,
      };
    }
  }

  // Check weekly visit limit (maxVisitsPerWeek) if configured
  if (plan?.maxVisitsPerWeek && plan.maxVisitsPerWeek > 0) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const visitsThisWeek = await prisma.attendance.count({
      where: {
        memberId: profile.id,
        checkInAt: { gte: oneWeekAgo },
      },
    });
    if (visitsThisWeek >= plan.maxVisitsPerWeek) {
      return {
        success: false,
        error: `سقف ورود هفتگی این طرح (${plan.maxVisitsPerWeek} جلسه در هفته) تکمیل شده است`,
      };
    }
  }

  // Check if member already has an open check-in (without checkOutAt)
  const existingOpen = await prisma.attendance.findFirst({
    where: {
      memberId: profile.id,
      checkOutAt: null,
      status: "CHECKED_IN",
    },
    orderBy: { checkInAt: "desc" },
  });

  const now = new Date();

  if (existingOpen) {
    const openDurationMinutes = Math.round((now.getTime() - new Date(existingOpen.checkInAt).getTime()) / 60000);
    // Auto-checkout if open for more than 4 hours (240 mins)
    if (openDurationMinutes >= 240) {
      await prisma.attendance.update({
        where: { id: existingOpen.id },
        data: {
          checkOutAt: now,
          durationMinutes: Math.min(openDurationMinutes, 240),
          status: "AUTO_CHECKED_OUT",
          note: (existingOpen.note ? existingOpen.note + " | " : "") + "خروج خودکار پس از ۴ ساعت عدم تردد",
        },
      });
    } else {
      return {
        success: false,
        error: `${memberName} در حال حاضر داخل باشگاه حضور دارد (ورود در ساعت ${new Date(existingOpen.checkInAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}). ابتدا خروج ثبت کنید.`,
        isAlreadyInside: true,
        openAttendanceId: existingOpen.id,
      };
    }
  }

  // Determine branchId
  let branchId = profile.user?.branchId || null;
  if (verifiedByUserId) {
    const verifier = await prisma.user.findUnique({
      where: { id: verifiedByUserId },
      select: { branchId: true },
    });
    if (verifier?.branchId) branchId = verifier.branchId;
  }

  const sessionType = options?.type || (verifyResult.type === "EXIT" ? "REGULAR" : verifyResult.type || "REGULAR");
  const todayStr = getTodayISOStr();

  // Create new attendance record
  const log = await prisma.attendance.create({
    data: {
      memberId: profile.id,
      branchId,
      checkInAt: now,
      status: "CHECKED_IN",
      sessionDate: todayStr,
      type: sessionType,
      method: options?.method || (verifyResult.isLegacy ? "MANUAL" : "QR"),
      verifiedByUserId: verifiedByUserId || null,
      note: options?.note || (verifyResult.warning ? `هشدار: ${verifyResult.warning}` : null),
    },
  });

  // Increment sessionsUsed on subscription if session-based
  let newSessionsUsed = sessionsUsed;
  if (isSessionBased) {
    const updatedSub = await prisma.subscription.update({
      where: { id: activeSub.id },
      data: {
        sessionsUsed: { increment: 1 },
        lastCheckInAt: now,
      },
    });
    newSessionsUsed = updatedSub?.sessionsUsed || sessionsUsed + 1;
  } else {
    await prisma.subscription.update({
      where: { id: activeSub.id },
      data: { lastCheckInAt: now },
    });
  }

  // Log to AuditLog
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: verifiedByUserId || null,
        action: "CHECKIN",
        entityType: "Attendance",
        entityId: log.id,
        metadata: JSON.stringify({
          membershipCode,
          memberId: profile.id,
          type: sessionType,
          sessionsUsed: newSessionsUsed,
          maxSessions: maxSessions || null,
        }),
      },
    });
  } catch {}

  revalidatePath("/manager/attendance");
  revalidatePath("/manager/dashboard");
  revalidatePath("/member/membership");
  revalidatePath("/member/dashboard");

  return {
    success: true,
    action: "CHECK_IN",
    log,
    memberName,
    membershipCode,
    isSessionBased,
    sessionsUsed: newSessionsUsed,
    maxSessions: maxSessions || null,
    warning: verifyResult.warning,
  };
}

/**
 * Checks out a member by QR token or static membership code.
 * Calculates durationMinutes (at least 1 minute) and closes the open attendance record.
 */
export async function checkOutByCode(
  codeOrToken: string,
  verifiedByUserId?: string,
  options?: CheckInOutOptions
) {
  const verifyResult = verifyQrToken(codeOrToken);
  if (!verifyResult.valid) {
    return { success: false, error: verifyResult.error || "کد QR نامعتبر است" };
  }

  const membershipCode = (verifyResult.membershipCode || codeOrToken).trim().toUpperCase();

  const profile = await prisma.memberProfile.findFirst({
    where: {
      OR: [
        { membershipCode },
        ...(verifyResult.memberId ? [{ id: verifyResult.memberId }] : []),
      ],
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
  });

  if (!profile) {
    return { success: false, error: `عضوی با کد «${membershipCode}» یافت نشد` };
  }

  const memberName = profile.user?.name || "کاربر باشگاه";

  // Find latest open attendance record
  const openRecord = await prisma.attendance.findFirst({
    where: {
      memberId: profile.id,
      checkOutAt: null,
      status: "CHECKED_IN",
    },
    orderBy: { checkInAt: "desc" },
  });

  if (!openRecord) {
    return {
      success: false,
      error: `حضور فعالی برای ${memberName} یافت نشد (عضو در حال حاضر خارج از باشگاه است)`,
    };
  }

  const now = new Date();
  const rawDiffMs = now.getTime() - new Date(openRecord.checkInAt).getTime();
  // Ensure at least 1 minute (A4)
  const durationMinutes = Math.max(1, Math.round(rawDiffMs / 60000));

  const updatedLog = await prisma.attendance.update({
    where: { id: openRecord.id },
    data: {
      checkOutAt: now,
      durationMinutes,
      status: "CHECKED_OUT",
      note: options?.note || openRecord.note || null,
    },
  });

  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: verifiedByUserId || null,
        action: "CHECKOUT",
        entityType: "Attendance",
        entityId: updatedLog.id,
        metadata: JSON.stringify({
          membershipCode,
          memberId: profile.id,
          durationMinutes,
        }),
      },
    });
  } catch {}

  revalidatePath("/manager/attendance");
  revalidatePath("/manager/dashboard");
  revalidatePath("/member/membership");
  revalidatePath("/member/dashboard");

  return {
    success: true,
    action: "CHECK_OUT",
    log: updatedLog,
    memberName,
    durationMinutes,
    checkInAt: openRecord.checkInAt,
    checkOutAt: now,
    warning: verifyResult.warning,
  };
}

/**
 * Smart Auto Check-In / Check-Out (A1).
 * If the member has an open session (status=CHECKED_IN & checkOutAt=null), executes checkout; otherwise executes check-in.
 */
export async function autoCheckInOut(
  codeOrToken: string,
  verifiedByUserId?: string,
  options?: CheckInOutOptions
) {
  const verifyResult = verifyQrToken(codeOrToken);
  if (!verifyResult.valid) {
    return { success: false, error: verifyResult.error || "کد QR نامعتبر است" };
  }

  const membershipCode = (verifyResult.membershipCode || codeOrToken).trim().toUpperCase();

  const profile = await prisma.memberProfile.findFirst({
    where: {
      OR: [
        { membershipCode },
        ...(verifyResult.memberId ? [{ id: verifyResult.memberId }] : []),
      ],
    },
  });

  if (!profile) {
    return { success: false, error: `عضوی با کد «${membershipCode}» یافت نشد` };
  }

  // Check if has open attendance
  const openRecord = await prisma.attendance.findFirst({
    where: {
      memberId: profile.id,
      checkOutAt: null,
      status: "CHECKED_IN",
    },
    orderBy: { checkInAt: "desc" },
  });

  // If currently inside, do checkout, otherwise checkin
  if (openRecord) {
    const rawDiffMs = Date.now() - new Date(openRecord.checkInAt).getTime();
    const durationMinutes = Math.round(rawDiffMs / 60000);
    // If open for > 4 hours (240 mins), auto-close previous and start new check-in
    if (durationMinutes >= 240) {
      await prisma.attendance.update({
        where: { id: openRecord.id },
        data: {
          checkOutAt: new Date(),
          durationMinutes: 240,
          status: "AUTO_CHECKED_OUT",
        },
      });
      return checkInByCode(codeOrToken, verifiedByUserId, options);
    }
    return checkOutByCode(codeOrToken, verifiedByUserId, options);
  } else {
    return checkInByCode(codeOrToken, verifiedByUserId, options);
  }
}

/**
 * Returns list of members currently inside the gym (A3).
 * checkOutAt IS NULL and status = CHECKED_IN.
 */
export async function getCurrentlyInside(branchId?: string) {
  const records = await prisma.attendance.findMany({
    where: {
      checkOutAt: null,
      status: "CHECKED_IN",
      ...(branchId ? { branchId } : {}),
    },
    include: {
      member: {
        include: {
          user: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { plan: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { checkInAt: "desc" },
  });

  const now = Date.now();

  return records.map((record: any) => {
    const checkInTime = new Date(record.checkInAt).getTime();
    const liveMinutes = Math.max(0, Math.floor((now - checkInTime) / 60000));
    return {
      ...record,
      liveMinutes,
    };
  });
}

/**
 * List recent attendance logs.
 */
export async function listAttendance(branchId?: string, limit = 100) {
  return prisma.attendance.findMany({
    where: branchId ? { branchId } : {},
    include: {
      member: {
        include: {
          user: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { plan: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { checkInAt: "desc" },
    take: limit,
  });
}

/**
 * Get today's attendance logs for manager dashboard.
 */
export async function getTodayAttendance(branchId?: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.attendance.findMany({
    where: {
      checkInAt: { gte: start },
      ...(branchId ? { branchId } : {}),
    },
    include: {
      member: {
        include: {
          user: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { plan: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { checkInAt: "desc" },
  });
}

/**
 * Get member's attendance sessions history.
 */
export async function getMemberSessions(memberId: string, limit = 50) {
  // Resolve memberId from userId if necessary
  let resolvedId = memberId;
  const profile = await prisma.memberProfile.findFirst({
    where: { OR: [{ id: memberId }, { userId: memberId }] },
  });
  if (profile) resolvedId = profile.id;

  return prisma.attendance.findMany({
    where: { memberId: resolvedId },
    orderBy: { checkInAt: "desc" },
    take: limit,
  });
}

/**
 * Get member's today schedule (B5).
 */
export async function getMemberTodaySchedule(memberId: string) {
  let resolvedId = memberId;
  const profile = await prisma.memberProfile.findFirst({
    where: { OR: [{ id: memberId }, { userId: memberId }] },
  });
  if (profile) resolvedId = profile.id;

  const todayIndex = getTodayDayOfWeek();

  return prisma.workoutSchedule.findMany({
    where: {
      memberId: resolvedId,
      dayOfWeek: todayIndex,
      isActive: true,
    },
    include: {
      routine: {
        include: {
          tasks: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

/**
 * Get aggregated attendance & session statistics for a member (A7, B5).
 */
export async function getMemberSessionStats(memberId: string) {
  let resolvedId = memberId;
  const profile = await prisma.memberProfile.findFirst({
    where: { OR: [{ id: memberId }, { userId: memberId }] },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        include: { plan: true },
        take: 1,
      },
    },
  });
  if (profile) resolvedId = profile.id;

  // Check if currently inside
  const currentInside = await prisma.attendance.findFirst({
    where: {
      memberId: resolvedId,
      checkOutAt: null,
      status: "CHECKED_IN",
    },
    orderBy: { checkInAt: "desc" },
  });

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // This month attendance count
  const thisMonthCount = await prisma.attendance.count({
    where: {
      memberId: resolvedId,
      checkInAt: { gte: thirtyDaysAgo },
    },
  });

  // This week count
  const thisWeekCount = await prisma.attendance.count({
    where: {
      memberId: resolvedId,
      checkInAt: { gte: sevenDaysAgo },
    },
  });

  // Total sessions
  const totalSessions = await prisma.attendance.count({
    where: { memberId: resolvedId },
  });

  // Average duration
  const completedAttendances = await prisma.attendance.findMany({
    where: {
      memberId: resolvedId,
      durationMinutes: { not: null },
    },
    select: { durationMinutes: true },
    take: 100,
  });

  let avgDurationMinutes = 0;
  if (completedAttendances.length > 0) {
    const totalMinutes = completedAttendances.reduce(
      (sum: number, a: any) => sum + (a.durationMinutes || 0),
      0
    );
    avgDurationMinutes = Math.round(totalMinutes / completedAttendances.length);
  }

  // Active subscription package info
  const activeSub = profile?.subscriptions?.[0];
  const isSessionBased =
    Boolean(activeSub?.plan?.isSessionBased) ||
    Boolean(activeSub?.plan?.maxSessions && activeSub.plan.maxSessions > 0);
  const maxSessions = activeSub?.plan?.maxSessions || 0;
  const sessionsUsed = activeSub?.sessionsUsed || 0;
  const remainingSessions = isSessionBased
    ? Math.max(0, maxSessions - sessionsUsed)
    : null;

  let liveMinutes = 0;
  if (currentInside) {
    liveMinutes = Math.max(
      0,
      Math.floor((now.getTime() - new Date(currentInside.checkInAt).getTime()) / 60000)
    );
  }

  return {
    isInside: Boolean(currentInside),
    currentCheckInAt: currentInside ? currentInside.checkInAt : null,
    liveMinutes,
    thisMonthCount,
    thisWeekCount,
    totalSessions,
    avgDurationMinutes,
    isSessionBased,
    maxSessions: isSessionBased ? maxSessions : null,
    sessionsUsed,
    remainingSessions,
    planName: activeSub?.plan?.name || "بدون طرح فعال",
    todayDayIndex: getTodayDayOfWeek(),
    todayDayName: getDayNamePersian(getTodayDayOfWeek()),
  };
}

"use server";

import { prisma } from "@/lib/prisma";

export async function checkInByCode(membershipCode: string, verifiedByUserId?: string) {
  const trimmedCode = membershipCode.trim().toUpperCase();
  
  const profile = await prisma.memberProfile.findUnique({
    where: { membershipCode: trimmedCode },
    include: {
      subscriptions: { where: { status: "ACTIVE" }, take: 1, include: { plan: true } },
      user: { select: { branchId: true } },
    },
  });

  if (!profile) return { success: false, error: "عضو با این کد یافت نشد" };
  
  if (!profile.subscriptions.length) {
    // Check if has paused or pending that could be considered
    const anySub = await prisma.subscription.findFirst({
      where: { memberId: profile.id, status: { in: ["PAUSED", "PENDING"] } },
    });
    if (anySub?.status === "PAUSED") {
      return { success: false, error: "اشتراک عضو در حالت تعلیق است" };
    }
    return { success: false, error: "عضو فاقد اشتراک فعال است" };
  }

  // Prevent duplicate check-in within same day (optional, but good UX)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const existingToday = await prisma.attendance.findFirst({
    where: {
      memberId: profile.id,
      checkInAt: { gte: startOfDay },
    },
  });
  if (existingToday) {
    // Allow but warn? For now we allow multiple but we can still log. We'll not block, just note.
    // If you want to block, uncomment:
    // return { success: false, error: "حضور امروز قبلاً ثبت شده است" };
  }

  // Determine branchId from verifier or member's branch
  let branchId: string | null = null;
  if (verifiedByUserId) {
    const verifier = await prisma.user.findUnique({ where: { id: verifiedByUserId }, select: { branchId: true } });
    branchId = verifier?.branchId || profile.user?.branchId || null;
  } else {
    branchId = profile.user?.branchId || null;
  }

  const log = await prisma.attendance.create({
    data: {
      memberId: profile.id,
      branchId: branchId,
      method: "QR",
      verifiedByUserId: verifiedByUserId ?? null,
    },
  });

  // Optionally create notification or audit log
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: verifiedByUserId || null,
        action: "CHECKIN",
        entityType: "Attendance",
        entityId: log.id,
        metadata: JSON.stringify({ membershipCode: trimmedCode, memberId: profile.id }),
      },
    });
  } catch {}

  return { success: true, log, memberName: profile.user ? undefined : undefined };
}

export async function listAttendance(branchId?: string, limit = 100) {
  return prisma.attendance.findMany({
    where: branchId ? { branchId } : {},
    include: { member: { include: { user: true } } },
    orderBy: { checkInAt: "desc" },
    take: limit,
  });
}

export async function getTodayAttendance(branchId?: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.attendance.findMany({
    where: {
      checkInAt: { gte: start },
      ...(branchId ? { branchId } : {}),
    },
    include: { member: { include: { user: true } } },
    orderBy: { checkInAt: "desc" },
  });
}

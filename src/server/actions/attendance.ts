"use server";

import { prisma } from "@/lib/prisma";

export async function checkInByCode(membershipCode: string, verifiedByUserId?: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { membershipCode },
    include: {
      subscriptions: { where: { status: "ACTIVE" }, take: 1 },
    },
  });

  if (!profile) return { success: false, error: "Member not found" };
  if (!profile.subscriptions.length) return { success: false, error: "No active subscription" };

  const log = await prisma.attendance.create({
    data: {
      memberId: profile.id,
      method: "QR",
      verifiedByUserId: verifiedByUserId ?? null,
    },
  });

  return { success: true, log };
}

export async function listAttendance(branchId?: string, limit = 100) {
  return prisma.attendance.findMany({
    where: branchId ? { branchId } : {},
    include: { member: { include: { user: true } } },
    orderBy: { checkInAt: "desc" },
    take: limit,
  });
}

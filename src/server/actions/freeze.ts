"use server";

import { prisma } from "@/lib/prisma";

export async function requestFreeze(
  memberId: string,
  subscriptionId: string,
  from: Date,
  to: Date,
  reason?: string
) {
  return prisma.freezeRequest.create({
    data: { memberId, subscriptionId, requestedFrom: from, requestedTo: to, reason },
  });
}

export async function reviewFreezeRequest(
  id: string,
  approved: boolean,
  reviewedByUserId: string,
  managerNote?: string
) {
  const req = await prisma.freezeRequest.update({
    where: { id },
    data: {
      status: approved ? "APPROVED" : "REJECTED",
      reviewedByUserId,
      reviewedAt: new Date(),
      managerNote,
    },
  });

  if (approved) {
    await prisma.subscription.update({
      where: { id: req.subscriptionId },
      data: { status: "PAUSED", pausedUntil: req.requestedTo },
    });
  }

  return req;
}

export async function listFreezeRequests(status?: "PENDING" | "APPROVED" | "REJECTED") {
  return prisma.freezeRequest.findMany({
    where: status ? { status } : {},
    include: {
      member: { include: { user: true } },
      subscription: { include: { plan: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

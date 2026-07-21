"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { addDays } from "date-fns";

export async function createSubscription(memberId: string, planId: string, startNow = true) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  const startedAt = startNow ? new Date() : null;
  const endsAt = startNow ? addDays(new Date(), plan.durationDays) : null;

  return prisma.subscription.create({
    data: {
      memberId,
      planId,
      status: startNow ? "ACTIVE" : "PENDING",
      startedAt,
      endsAt,
    },
  });
}

export async function renewSubscription(subscriptionId: string) {
  const sub = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscriptionId },
    include: { plan: true },
  });

  const newStart = sub.endsAt && sub.endsAt > new Date() ? sub.endsAt : new Date();
  const newEnd = addDays(newStart, sub.plan.durationDays);

  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "ACTIVE", startedAt: newStart, endsAt: newEnd, canceledAt: null },
  });
}

export async function pauseSubscription(subscriptionId: string, reason?: string) {
  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "PAUSED", pauseReason: reason ?? null },
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "CANCELED", canceledAt: new Date() },
  });
}

export async function getExpiringSubscriptions(days = 7) {
  const cutoff = addDays(new Date(), days);
  return prisma.subscription.findMany({
    where: { status: "ACTIVE", endsAt: { lte: cutoff } },
    include: { member: { include: { user: true } }, plan: true },
    orderBy: { endsAt: "asc" },
  });
}

"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/permissions";

export async function createSubscription(memberId: string, planId: string, startNow = true) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  if (!plan.isActive) throw new Error("طرح غیرفعال است");

  const startedAt = startNow ? new Date() : null;
  const endsAt = startNow ? addDays(new Date(), plan.durationDays) : null;

  // Check if member already has active subscription - extend instead
  if (startNow) {
    const active = await prisma.subscription.findFirst({
      where: { memberId, status: "ACTIVE" },
      orderBy: { endsAt: "desc" },
    });
    if (active && active.endsAt && new Date(active.endsAt) > new Date()) {
      const newEnd = addDays(new Date(active.endsAt), plan.durationDays);
      return prisma.subscription.update({
        where: { id: active.id },
        data: { planId, endsAt: newEnd, status: "ACTIVE", canceledAt: null },
      });
    }
  }

  const sub = await prisma.subscription.create({
    data: {
      memberId,
      planId,
      status: startNow ? "ACTIVE" : "PENDING",
      startedAt,
      endsAt,
    },
  });

  revalidatePath("/manager/members");
  revalidatePath("/manager/dashboard");
  return sub;
}

export async function renewSubscription(subscriptionId: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const sub = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscriptionId },
    include: { plan: true },
  });

  const now = new Date();
  const newStart = sub.endsAt && new Date(sub.endsAt) > now ? new Date(sub.endsAt) : now;
  const newEnd = addDays(newStart, sub.plan.durationDays);

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "ACTIVE", startedAt: newStart, endsAt: newEnd, canceledAt: null, pausedUntil: null },
  });

  revalidatePath("/manager/members");
  revalidatePath("/member/membership");
  return updated;
}

export async function pauseSubscription(subscriptionId: string, reason?: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "PAUSED", pauseReason: reason ?? null },
  });
  revalidatePath("/manager/members");
  return updated;
}

export async function cancelSubscription(subscriptionId: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "CANCELED", canceledAt: new Date() },
  });
  revalidatePath("/manager/members");
  return updated;
}

export async function getExpiringSubscriptions(days = 7) {
  const cutoff = addDays(new Date(), days);
  const now = new Date();
  return prisma.subscription.findMany({
    where: { status: "ACTIVE", endsAt: { lte: cutoff, gte: now } },
    include: { member: { include: { user: true } }, plan: true },
    orderBy: { endsAt: "asc" },
  });
}

export async function getMemberSubscriptions(memberId: string) {
  return prisma.subscription.findMany({
    where: { memberId },
    include: { plan: true, payments: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

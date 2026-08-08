"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/permissions";

const paymentSchema = z.object({
  subscriptionId: z.string().min(1, "شناسه اشتراک الزامی است"),
  amount: z.coerce.number().positive("مبلغ باید مثبت باشد"),
  method: z.enum(["CASH", "CARD", "TRANSFER", "WALLET", "ONLINE", "OTHER"]),
  note: z.string().optional(),
  recordedByUserId: z.string().optional(),
});

export async function recordPayment(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const data = paymentSchema.parse({
    subscriptionId: formData.get("subscriptionId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    note: formData.get("note"),
    recordedByUserId: formData.get("recordedByUserId"),
  });

  const sub = await prisma.subscription.findUnique({
    where: { id: data.subscriptionId },
    include: { plan: true },
  });
  if (!sub) throw new Error("اشتراک یافت نشد");

  const payment = await prisma.payment.create({
    data: {
      subscriptionId: data.subscriptionId,
      amount: data.amount,
      method: data.method,
      status: "PAID",
      paidAt: new Date(),
      note: data.note,
      recordedByUserId: data.recordedByUserId,
      transactionRef: `MANUAL-${Date.now().toString(36).toUpperCase()}`,
    },
  });

  const now = new Date();
  let startedAt: Date;
  let endsAt: Date;

  if (sub.status === "ACTIVE" && sub.endsAt && new Date(sub.endsAt) > now) {
    startedAt = new Date(sub.startedAt || now);
    endsAt = addDays(new Date(sub.endsAt), sub.plan.durationDays);
  } else {
    startedAt = now;
    endsAt = addDays(now, sub.plan.durationDays);
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "ACTIVE",
      startedAt,
      endsAt,
      canceledAt: null,
      pausedUntil: null,
    },
  });

  revalidatePath("/manager/payments");
  revalidatePath("/manager/dashboard");
  revalidatePath("/member/dashboard");
  revalidatePath("/member/payments");
  revalidatePath("/member/membership");

  return payment;
}

export async function listPayments(limit = 50) {
  return prisma.payment.findMany({
    include: {
      subscription: {
        include: { member: { include: { user: true } }, plan: true },
      },
      recordedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function approvePayment(paymentId: string, managerUserId: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      subscription: {
        include: { plan: true, member: true },
      },
    },
  });

  if (payment.status === "PAID") {
    throw new Error("این پرداخت قبلاً تایید شده است");
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      recordedByUserId: managerUserId,
    },
  });

  const sub = payment.subscription;
  const plan = sub.plan;
  const now = new Date();

  // Find if member has another active subscription that should be extended
  const existingActive = await prisma.subscription.findFirst({
    where: {
      memberId: sub.memberId,
      status: "ACTIVE",
      id: { not: sub.id },
      endsAt: { gt: now },
    },
    orderBy: { endsAt: "desc" },
  });

  let startedAt: Date;
  let endsAt: Date;

  if (existingActive && existingActive.endsAt) {
    // Extend existing active subscription instead of activating pending as separate
    startedAt = existingActive.startedAt || now;
    endsAt = addDays(new Date(existingActive.endsAt), plan.durationDays);

    // Update existing active to new plan and extended date
    await prisma.subscription.update({
      where: { id: existingActive.id },
      data: {
        planId: plan.id,
        endsAt,
        status: "ACTIVE",
        canceledAt: null,
        pausedUntil: null,
      },
    });

    // Cancel the pending subscription that was just approved (merge)
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "CANCELED",
        canceledAt: now,
        notes: `ادغام شد با اشتراک فعال ${existingActive.id} - پرداخت ${paymentId} تایید شد`,
      },
    });

    // Point payment to the active subscription for history
    await prisma.payment.update({
      where: { id: paymentId },
      data: { subscriptionId: existingActive.id },
    });
  } else {
    // Normal activation of pending subscription
    const baseEnds = sub.endsAt && new Date(sub.endsAt) > now ? new Date(sub.endsAt) : now;
    endsAt = addDays(baseEnds, plan.durationDays);
    startedAt = now;

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        startedAt,
        endsAt,
        canceledAt: null,
        pausedUntil: null,
      },
    });
  }

  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: managerUserId,
        action: "PAYMENT_APPROVED",
        entityType: "Payment",
        entityId: paymentId,
        metadata: JSON.stringify({ subscriptionId: sub.id, amount: payment.amount, planId: plan.id }),
      },
    });
  } catch {}

  revalidatePath("/member/dashboard");
  revalidatePath("/member/membership");
  revalidatePath("/member/payments");
  revalidatePath("/manager/dashboard");
  revalidatePath("/manager/payments");

  return { success: true };
}

export async function rejectPayment(paymentId: string, managerUserId: string, reason?: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (payment.status === "PAID") throw new Error("پرداخت تایید شده قابل رد نیست");

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "REJECTED",
      note: reason ? `${payment.note || ""} | رد توسط مدیر: ${reason}`.trim() : payment.note,
      recordedByUserId: managerUserId,
    },
  });

  // Also cancel the pending subscription if sole payment rejected
  const otherPendingPayments = await prisma.payment.count({
    where: { subscriptionId: payment.subscriptionId, status: "PENDING", id: { not: paymentId } },
  });
  if (otherPendingPayments === 0) {
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
  }

  revalidatePath("/manager/payments");
  revalidatePath("/member/payments");
  return { success: true };
}

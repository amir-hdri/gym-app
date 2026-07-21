"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";


const paymentSchema = z.object({
  subscriptionId: z.string(),
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "CARD", "TRANSFER", "WALLET", "ONLINE", "OTHER"]),
  note: z.string().optional(),
  recordedByUserId: z.string().optional(),
});

export async function recordPayment(formData: FormData) {
  const data = paymentSchema.parse({
    subscriptionId: formData.get("subscriptionId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    note: formData.get("note"),
    recordedByUserId: formData.get("recordedByUserId"),
  });

  return prisma.payment.create({
    data: {
      subscriptionId: data.subscriptionId,
      amount: data.amount,
      method: data.method,
      status: "PAID",
      paidAt: new Date(),
      note: data.note,
      recordedByUserId: data.recordedByUserId,
    },
  });
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
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });

  if (payment.status === "PAID") {
    throw new Error("این پرداخت قبلاً تایید شده است");
  }

  // Update payment status
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

  // Calculate activation dates
  const now = new Date();
  const startedAt = sub.endsAt && sub.endsAt > now ? sub.endsAt : now;
  const endsAt = new Date(startedAt);
  endsAt.setDate(startedAt.getDate() + plan.durationDays);

  // Activate subscription
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "ACTIVE",
      startedAt,
      endsAt,
      canceledAt: null,
    },
  });

  revalidatePath("/member/dashboard");
  revalidatePath("/member/membership");
  revalidatePath("/member/payments");
  revalidatePath("/manager/dashboard");
  revalidatePath("/manager/payments");

  return { success: true };
}


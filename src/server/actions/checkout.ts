"use server";

import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";

export async function checkoutOnline(memberId: string, planId: string) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  
  // Calculate subscription dates
  const startedAt = new Date();
  const endsAt = addDays(startedAt, plan.durationDays);

  const sub = await prisma.subscription.create({
    data: {
      memberId,
      planId,
      status: "ACTIVE",
      startedAt,
      endsAt,
      branchId: plan.branchId,
    },
  });

  await prisma.payment.create({
    data: {
      subscriptionId: sub.id,
      amount: plan.price,
      currency: plan.currency,
      method: "ONLINE",
      status: "PAID",
      paidAt: new Date(),
      transactionRef: "ONL-" + Math.floor(Math.random() * 100000000),
      note: "پرداخت موفق از درگاه آنلاین شبیه‌سازی شده",
    },
  });

  revalidatePath("/member/dashboard");
  revalidatePath("/member/membership");
  revalidatePath("/member/payments");
  return { success: true, sub };
}

export async function checkoutTransfer(
  memberId: string,
  planId: string,
  senderInfo: string,
  referenceCode: string
) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });

  // Create pending subscription (starts when manager approves)
  const sub = await prisma.subscription.create({
    data: {
      memberId,
      planId,
      status: "PENDING",
      branchId: plan.branchId,
      notes: `پرداخت کارت به کارت توسط: ${senderInfo}`,
    },
  });

  await prisma.payment.create({
    data: {
      subscriptionId: sub.id,
      amount: plan.price,
      currency: plan.currency,
      method: "TRANSFER",
      status: "PENDING",
      transactionRef: referenceCode,
      note: `کارت به کارت به نام: ${senderInfo}`,
    },
  });

  revalidatePath("/member/dashboard");
  revalidatePath("/member/membership");
  revalidatePath("/member/payments");
  return { success: true, sub };
}

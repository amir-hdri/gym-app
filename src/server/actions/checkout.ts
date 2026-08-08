"use server";

import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/permissions";

async function verifyMemberOwnership(memberId: string, sessionUserId: string, sessionRole: string) {
  if (isManager(sessionRole)) return true;
  const member = await prisma.memberProfile.findFirst({
    where: { id: memberId, userId: sessionUserId },
  });
  if (!member) throw new Error("عدم دسترسی - پروفایل متعلق به شما نیست");
  return true;
}

export async function checkoutOnline(memberId: string, planId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const role = (session.user as any).role;
  await verifyMemberOwnership(memberId, session.user.id, role);

  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  if (!plan.isActive) throw new Error("طرح انتخابی غیرفعال است");

  const now = new Date();
  
  const activeSub = await prisma.subscription.findFirst({
    where: { memberId, status: "ACTIVE", endsAt: { gt: now } },
    orderBy: { endsAt: "desc" },
  });

  let sub;
  if (activeSub && activeSub.endsAt) {
    const endsAt = addDays(new Date(activeSub.endsAt), plan.durationDays);
    sub = await prisma.subscription.update({
      where: { id: activeSub.id },
      data: {
        planId: plan.id,
        status: "ACTIVE",
        endsAt,
        canceledAt: null,
        pausedUntil: null,
      },
    });
    await prisma.payment.create({
      data: {
        subscriptionId: sub.id,
        amount: plan.price,
        currency: plan.currency,
        method: "ONLINE",
        status: "PAID",
        paidAt: now,
        transactionRef: "ONL-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,6).toUpperCase(),
        note: "تمدید آنلاین - درگاه شبیه‌سازی شده",
      },
    });
  } else {
    const startedAt = now;
    const endsAt = addDays(startedAt, plan.durationDays);
    sub = await prisma.subscription.create({
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
        paidAt: now,
        transactionRef: "ONL-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,6).toUpperCase(),
        note: "پرداخت موفق از درگاه آنلاین شبیه‌سازی شده",
      },
    });
  }

  revalidatePath("/member/dashboard");
  revalidatePath("/member/membership");
  revalidatePath("/member/payments");
  revalidatePath("/manager/dashboard");
  revalidatePath("/manager/payments");
  return { success: true, sub };
}

export async function checkoutTransfer(
  memberId: string,
  planId: string,
  senderInfo: string,
  referenceCode: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const role = (session.user as any).role;
  await verifyMemberOwnership(memberId, session.user.id, role);

  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  if (!plan.isActive) throw new Error("طرح انتخابی غیرفعال است");

  const trimmedSender = senderInfo.trim();
  const trimmedRef = referenceCode.trim();
  if (!trimmedSender || trimmedSender.length < 2) {
    throw new Error("اطلاعات واریزکننده الزامی و حداقل ۲ کاراکتر");
  }
  if (!trimmedRef || trimmedRef.length < 4) {
    throw new Error("کد پیگیری الزامی و حداقل ۴ کاراکتر");
  }

  const existingRef = await prisma.payment.findFirst({
    where: { transactionRef: trimmedRef },
  });
  if (existingRef) {
    throw new Error("این کد رهگیری قبلاً ثبت شده است");
  }

  const pendingExists = await prisma.subscription.findFirst({
    where: {
      memberId,
      planId,
      status: "PENDING",
    },
    include: { payments: { where: { status: "PENDING" } } },
  });
  if (pendingExists && pendingExists.payments.length > 0) {
    throw new Error("شما یک درخواست معلق برای همین طرح دارید، لطفاً منتظر تایید بمانید");
  }

  const sub = await prisma.subscription.create({
    data: {
      memberId,
      planId,
      status: "PENDING",
      branchId: plan.branchId,
      notes: `پرداخت کارت به کارت توسط: ${trimmedSender}`,
    },
  });

  await prisma.payment.create({
    data: {
      subscriptionId: sub.id,
      amount: plan.price,
      currency: plan.currency,
      method: "TRANSFER",
      status: "PENDING",
      transactionRef: trimmedRef,
      note: `کارت به کارت به نام: ${trimmedSender}`,
    },
  });

  revalidatePath("/member/dashboard");
  revalidatePath("/member/membership");
  revalidatePath("/member/payments");
  revalidatePath("/manager/payments");
  return { success: true, sub };
}

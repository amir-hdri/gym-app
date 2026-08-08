"use server";

import { prisma } from "@/lib/prisma";
import { addDays, differenceInDays } from "date-fns";
import { revalidatePath } from "next/cache";

export async function requestFreeze(
  memberId: string,
  subscriptionId: string,
  from: Date,
  to: Date,
  reason?: string
) {
  // Validate dates
  if (to <= from) {
    throw new Error("تاریخ پایان باید بعد از تاریخ شروع باشد");
  }

  const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) throw new Error("بازه زمانی نامعتبر است");
  if (diffDays > 60) throw new Error("حداکثر تعلیق ۶۰ روز می‌باشد");

  // Fetch subscription with plan
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });
  if (!sub) throw new Error("اشتراک یافت نشد");
  if (sub.memberId !== memberId) throw new Error("عدم تطابق عضو و اشتراک");
  if (sub.status !== "ACTIVE") throw new Error("فقط اشتراک‌های فعال قابل تعلیق هستند");

  // Check overlapping freeze requests
  const overlapping = await prisma.freezeRequest.findFirst({
    where: {
      memberId,
      subscriptionId,
      status: { in: ["PENDING", "APPROVED"] },
      OR: [
        { requestedFrom: { lte: to }, requestedTo: { gte: from } },
      ],
    },
  });
  if (overlapping) {
    throw new Error("شما قبلاً درخواست تعلیقی برای این بازه ثبت کرده‌اید");
  }

  // Check allowed freeze days for plan
  const allowed = sub.plan.freezeDaysAllowed ?? 0;
  if (allowed <= 0) {
    throw new Error("طرح فعلی شما امکان تعلیق ندارد");
  }

  // Calculate already used freeze days for this subscription (approved)
  const approvedFreezes = await prisma.freezeRequest.findMany({
    where: { subscriptionId, status: "APPROVED" },
  });
  const usedDays = approvedFreezes.reduce((sum, fr) => {
    const days = Math.ceil((new Date(fr.requestedTo).getTime() - new Date(fr.requestedFrom).getTime()) / (1000*60*60*24));
    return sum + days;
  }, 0);

  if (usedDays + diffDays > allowed) {
    throw new Error(`شما قبلاً ${usedDays} روز از سقف ${allowed} روزه استفاده کرده‌اید. درخواست فعلی ${diffDays} روزه بیش از حد مجاز است.`);
  }

  const req = await prisma.freezeRequest.create({
    data: { memberId, subscriptionId, requestedFrom: from, requestedTo: to, reason },
  });

  revalidatePath("/member/membership");
  revalidatePath("/manager/freeze-requests");

  return req;
}

export async function reviewFreezeRequest(
  id: string,
  approved: boolean,
  reviewedByUserId: string,
  managerNote?: string
) {
  const existing = await prisma.freezeRequest.findUnique({
    where: { id },
    include: { subscription: { include: { plan: true } } },
  });
  if (!existing) throw new Error("درخواست یافت نشد");
  if (existing.status !== "PENDING") throw new Error("این درخواست قبلاً بررسی شده است");

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
    const from = new Date(req.requestedFrom);
    const to = new Date(req.requestedTo);
    const diffDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000*60*60*24)));

    const sub = existing.subscription;
    // If subscription currently active, we extend endsAt by diffDays and pause
    // If already paused, extend further
    const currentEndsAt = sub.endsAt ? new Date(sub.endsAt) : addDays(new Date(), sub.plan.durationDays);
    const newEndsAt = addDays(currentEndsAt, diffDays);

    await prisma.subscription.update({
      where: { id: req.subscriptionId },
      data: { 
        status: "PAUSED", 
        pausedUntil: req.requestedTo,
        endsAt: newEndsAt,
        pauseReason: `تعلیق ${diffDays} روزه تایید شده`,
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: reviewedByUserId,
          action: "FREEZE_APPROVED",
          entityType: "Subscription",
          entityId: sub.id,
          metadata: JSON.stringify({ freezeRequestId: id, diffDays, newEndsAt }),
        },
      });
    } catch {}
  }

  revalidatePath("/manager/freeze-requests");
  revalidatePath("/member/membership");
  revalidatePath("/manager/dashboard");

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

export async function getMemberFreezeRequests(memberId: string) {
  return prisma.freezeRequest.findMany({
    where: { memberId },
    include: { subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
  });
}

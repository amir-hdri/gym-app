"use server";

import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  return prisma.notification.create({
    data: { 
      userId, 
      type, 
      title, 
      body, 
      data: data ? JSON.stringify(data) : null, 
      sentAt: new Date() 
    },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function listNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function sendExpiryReminders() {
  const { getExpiringSubscriptions } = await import("./subscriptions");
  const expiring = await getExpiringSubscriptions(7);

  const results = await Promise.allSettled(
    expiring.map((sub) =>
      createNotification(
        sub.member.user.id,
        "subscription_expiry",
        "انقضای اشتراک نزدیک است",
        `طرح ${sub.plan.name} شما در تاریخ ${sub.endsAt?.toLocaleDateString("fa-IR")} منقضی می‌شود. لطفاً نسبت به تمدید اقدام کنید.`,
        { subscriptionId: sub.id }
      )
    )
  );

  return results;
}

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
    data: { userId, type, title, body, data: data as any, sentAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
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
        "Subscription expiring soon",
        `Your ${sub.plan.name} plan expires on ${sub.endsAt?.toLocaleDateString()}. Renew now to keep access.`,
        { subscriptionId: sub.id }
      )
    )
  );

  return results;
}

"use server";

import { prisma } from "@/lib/prisma";
import { getTodayDayOfWeek, getDayNamePersian } from "@/lib/qr";

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
      sentAt: new Date(),
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

  const subResults = await Promise.allSettled(
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

  // Send schedule reminders for 1 hour before session (B7)
  const scheduleResults = await sendScheduleReminders();

  return [...subResults, ...scheduleResults];
}

/**
 * Checks for schedules starting within 1 hour and dispatches reminder notifications (B7).
 */
export async function sendScheduleReminders() {
  try {
    const todayIndex = getTodayDayOfWeek();
    const todaySchedules = await prisma.workoutSchedule.findMany({
      where: {
        dayOfWeek: todayIndex,
        isActive: true,
      },
      include: {
        member: {
          include: { user: true },
        },
        routine: true,
      },
    });

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const nowTotalMinutes = currentHour * 60 + currentMinute;

    const remindersToSend = todaySchedules.filter((sch: any) => {
      const [sh, sm] = sch.startTime.split(":").map((x: string) => parseInt(x, 10));
      const scheduleTotalMinutes = sh * 60 + sm;
      const diffMinutes = scheduleTotalMinutes - nowTotalMinutes;
      // Within 1 hour (between 0 and 65 minutes ahead)
      return diffMinutes >= 0 && diffMinutes <= 65;
    });

    const results = await Promise.allSettled(
      remindersToSend.map((sch: any) => {
        const userId = sch.member?.user?.id;
        if (!userId) return Promise.resolve(null);

        const dayName = getDayNamePersian(sch.dayOfWeek);
        return createNotification(
          userId,
          "SCHEDULE_REMINDER",
          `⏰ یادآور سانس تمرینی (${sch.startTime})`,
          `سانس «${sch.title || "تمرین"}» شما امروز (${dayName}) در ساعت ${sch.startTime} شروع می‌شود. ۱ ساعت تا آغاز سانس فرصت دارید.`,
          { scheduleId: sch.id, startTime: sch.startTime, routineId: sch.routineId }
        );
      })
    );

    return results;
  } catch (error) {
    console.error("sendScheduleReminders error:", error);
    return [];
  }
}

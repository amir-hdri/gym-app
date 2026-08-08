"use server";

import { prisma } from "@/lib/prisma";
import { getTodayDayOfWeek, getDayNamePersian, PERSIAN_DAYS } from "@/lib/qr";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { z } from "zod";

const scheduleSchema = z.object({
  memberId: z.string().min(1, "شناسه عضو الزامی است"),
  routineId: z.string().optional().nullable(),
  dayOfWeek: z.coerce.number().min(0).max(6), // 0=شنبه .. 6=جمعه
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "فرمت ساعت شروع نامعتبر است (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "فرمت ساعت پایان نامعتبر است (HH:MM)"),
  title: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * Validates time order and checks for overlapping schedule conflicts on the same day for a member.
 */
async function checkScheduleConflict(
  memberId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
) {
  if (startTime >= endTime) {
    throw new Error("ساعت شروع سانس باید قبل از ساعت پایان باشد");
  }

  const existingSchedules = await prisma.workoutSchedule.findMany({
    where: {
      memberId,
      dayOfWeek,
      isActive: true,
      ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
    },
  });

  for (const existing of existingSchedules) {
    // Conflict condition: startTime < existing.endTime && endTime > existing.startTime
    if (startTime < existing.endTime && endTime > existing.startTime) {
      const dayName = getDayNamePersian(dayOfWeek);
      throw new Error(
        `تداخل زمانی! سانس انتخابی با سانس موجود «${existing.title || "تمرین"}» (${existing.startTime} الی ${existing.endTime}) در روز ${dayName} هم‌پوشانی دارد.`
      );
    }
  }
}

/**
 * Creates a new workout schedule for a member with conflict validation (B3).
 */
export async function createSchedule(rawInput: {
  memberId: string;
  routineId?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title?: string | null;
  note?: string | null;
}) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  // Resolve member profile id if userId passed
  let resolvedMemberId = rawInput.memberId;
  const profile = await prisma.memberProfile.findFirst({
    where: { OR: [{ id: rawInput.memberId }, { userId: rawInput.memberId }] },
  });
  if (profile) {
    resolvedMemberId = profile.id;
  }

  const data = scheduleSchema.parse({
    ...rawInput,
    memberId: resolvedMemberId,
  });

  // Check time conflicts
  await checkScheduleConflict(
    data.memberId,
    data.dayOfWeek,
    data.startTime,
    data.endTime
  );

  const schedule = await prisma.workoutSchedule.create({
    data: {
      memberId: data.memberId,
      routineId: data.routineId || null,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      title: data.title?.trim() || null,
      note: data.note?.trim() || null,
      isActive: true,
    },
    include: {
      routine: {
        include: { tasks: true },
      },
    },
  });

  // Optional: create in-app reminder notification structure (B7)
  try {
    const member = await prisma.memberProfile.findUnique({
      where: { id: data.memberId },
      select: { userId: true },
    });
    if (member?.userId) {
      const dayName = getDayNamePersian(data.dayOfWeek);
      await prisma.notification.create({
        data: {
          userId: member.userId,
          type: "SCHEDULE_CREATED",
          title: `سانس تمرینی جدید (${dayName})`,
          body: `سانس تمرینی جدید شما برای روز ${dayName} ساعت ${data.startTime} تا ${data.endTime} ثبت شد.`,
          data: JSON.stringify({ scheduleId: schedule.id, dayOfWeek: data.dayOfWeek, startTime: data.startTime }),
        },
      });
    }
  } catch {}

  revalidatePath("/manager/members");
  revalidatePath("/member/schedule");
  revalidatePath("/member/dashboard");

  return { success: true, schedule };
}

/**
 * Updates an existing schedule with conflict check.
 */
export async function updateSchedule(
  id: string,
  rawInput: Partial<{
    routineId?: string | null;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    title?: string | null;
    note?: string | null;
    isActive?: boolean;
  }>
) {
  const existing = await prisma.workoutSchedule.findUnique({ where: { id } });
  if (!existing) throw new Error("سانس تمرینی یافت نشد");

  const dayOfWeek = rawInput.dayOfWeek !== undefined ? Number(rawInput.dayOfWeek) : existing.dayOfWeek;
  const startTime = rawInput.startTime || existing.startTime;
  const endTime = rawInput.endTime || existing.endTime;

  if (rawInput.startTime || rawInput.endTime || rawInput.dayOfWeek !== undefined) {
    await checkScheduleConflict(existing.memberId, dayOfWeek, startTime, endTime, id);
  }

  const updated = await prisma.workoutSchedule.update({
    where: { id },
    data: {
      ...(rawInput.routineId !== undefined ? { routineId: rawInput.routineId || null } : {}),
      ...(rawInput.dayOfWeek !== undefined ? { dayOfWeek } : {}),
      ...(rawInput.startTime ? { startTime } : {}),
      ...(rawInput.endTime ? { endTime } : {}),
      ...(rawInput.title !== undefined ? { title: rawInput.title?.trim() || null } : {}),
      ...(rawInput.note !== undefined ? { note: rawInput.note?.trim() || null } : {}),
      ...(rawInput.isActive !== undefined ? { isActive: rawInput.isActive } : {}),
    },
    include: {
      routine: { include: { tasks: true } },
    },
  });

  revalidatePath("/manager/members");
  revalidatePath("/member/schedule");
  revalidatePath("/member/dashboard");

  return { success: true, schedule: updated };
}

/**
 * Deletes a schedule.
 */
export async function deleteSchedule(id: string) {
  const existing = await prisma.workoutSchedule.findUnique({ where: { id } });
  if (!existing) throw new Error("سانس تمرینی یافت نشد");

  await prisma.workoutSchedule.delete({ where: { id } });

  revalidatePath("/manager/members");
  revalidatePath("/member/schedule");
  revalidatePath("/member/dashboard");

  return { success: true };
}

/**
 * Lists all schedules for a specific member.
 */
export async function listMemberSchedules(memberId: string) {
  let resolvedMemberId = memberId;
  const profile = await prisma.memberProfile.findFirst({
    where: { OR: [{ id: memberId }, { userId: memberId }] },
  });
  if (profile) resolvedMemberId = profile.id;

  return prisma.workoutSchedule.findMany({
    where: { memberId: resolvedMemberId, isActive: true },
    include: {
      routine: {
        include: {
          tasks: true,
        },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

/**
 * Gets schedules for today for a member (B3, B5).
 */
export async function getTodaySchedulesForMember(memberId: string) {
  let resolvedMemberId = memberId;
  const profile = await prisma.memberProfile.findFirst({
    where: { OR: [{ id: memberId }, { userId: memberId }] },
  });
  if (profile) resolvedMemberId = profile.id;

  const todayIndex = getTodayDayOfWeek();

  return prisma.workoutSchedule.findMany({
    where: {
      memberId: resolvedMemberId,
      dayOfWeek: todayIndex,
      isActive: true,
    },
    include: {
      routine: {
        include: {
          tasks: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

/**
 * Groups member schedules by all 7 Persian days of the week (B3, B6).
 */
export async function getMemberWeeklySchedule(memberId: string) {
  let resolvedMemberId = memberId;
  const profile = await prisma.memberProfile.findFirst({
    where: { OR: [{ id: memberId }, { userId: memberId }] },
  });
  if (profile) resolvedMemberId = profile.id;

  const allSchedules = await prisma.workoutSchedule.findMany({
    where: { memberId: resolvedMemberId, isActive: true },
    include: {
      routine: {
        include: {
          tasks: true,
        },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const todayIndex = getTodayDayOfWeek();

  const grouped = PERSIAN_DAYS.map((dayName, dayIndex) => {
    const schedules = allSchedules.filter((s: any) => s.dayOfWeek === dayIndex);
    return {
      dayIndex,
      dayName,
      isToday: dayIndex === todayIndex,
      schedules,
    };
  });

  return grouped;
}

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/permissions";

const taskSchema = z.object({
  exerciseName: z.string().min(1, "نام حرکت الزامی است"),
  sets: z.coerce.number().min(1).default(3),
  reps: z.string().min(1).default("12"),
  notes: z.string().optional(),
});

// Use UTC date string YYYY-MM-DD to avoid timezone drift
function getTodayUTCStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getUTCDatesLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export async function getWorkoutRoutine(userId: string) {
  const member = await prisma.memberProfile.findFirst({
    where: { OR: [{ userId: userId }, { id: userId }] }
  });
  if (!member) return null;

  const routine = await prisma.workoutRoutine.findFirst({
    where: { memberId: member.id, isActive: true },
    include: {
      tasks: {
        include: { logs: { where: { memberId: member.id } } },
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return routine;
}

export async function createOrUpdateWorkoutRoutine(
  memberId: string, 
  title: string, 
  tasks: Array<{ exerciseName: string; sets: number; reps: string; notes?: string }>
) {
  const session = await auth().catch(() => null);
  const role = (session?.user as any)?.role;
  if (session && role && role !== "MEMBER" && !isManager(role)) {
    throw new Error("Unauthorized");
  }
  if (session && !isManager(role) && role === "MEMBER") {
    // Member can only update own routine
    const ownProfile = await prisma.memberProfile.findFirst({ where: { userId: session.user.id } });
    if (ownProfile?.id !== memberId) throw new Error("عدم دسترسی");
  }

  const verifiedTasks = tasks.map(t => taskSchema.parse(t));
  if (!title.trim()) throw new Error("عنوان برنامه الزامی است");
  if (verifiedTasks.length === 0) throw new Error("حداقل یک حرکت باید تعریف شود");

  const existingRoutine = await prisma.workoutRoutine.findFirst({
    where: { memberId, isActive: true }
  });

  if (existingRoutine) {
    await prisma.workoutRoutine.update({
      where: { id: existingRoutine.id },
      data: { isActive: false, title: `${existingRoutine.title} (آرشیو ${new Date().toLocaleDateString("fa-IR")})` },
    });
  }

  const routine = await prisma.workoutRoutine.create({
    data: { memberId, title: title.trim(), isActive: true }
  });

  await prisma.workoutTask.createMany({
    data: verifiedTasks.map(t => ({
      routineId: routine.id,
      exerciseName: t.exerciseName.trim(),
      sets: Number(t.sets),
      reps: t.reps.trim(),
      notes: t.notes?.trim() || null,
    }))
  });

  revalidatePath("/member/dashboard");
  revalidatePath("/manager/members");
  revalidatePath("/member/progress");
  return { success: true, routineId: routine.id };
}

export async function archiveWorkoutRoutine(routineId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  await prisma.workoutRoutine.update({ where: { id: routineId }, data: { isActive: false } });
  revalidatePath("/member/dashboard");
  revalidatePath("/manager/members");
  return { success: true };
}

export async function toggleWorkoutTaskLog(
  taskId: string,
  userId: string,
  dateStr: string,
  completed: boolean,
  setsData?: string
) {
  const member = await prisma.memberProfile.findFirst({ where: { userId } });
  if (!member) throw new Error("پروفایل عضو یافت نشد");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error("فرمت تاریخ نامعتبر است، باید YYYY-MM-DD باشد");
  }

  // Security: ensure task belongs to member's routine or at least exists
  const task = await prisma.workoutTask.findFirst({
    where: { id: taskId, routine: { memberId: member.id } },
  });
  if (!task && completed) {
    // Allow but warn - task might be from archived routine? Check existence
    const exists = await prisma.workoutTask.findUnique({ where: { id: taskId } });
    if (!exists) throw new Error("حرکت تمرینی یافت نشد");
  }

  if (completed) {
    await prisma.workoutLog.upsert({
      where: { taskId_dateStr: { taskId, dateStr } },
      create: { memberId: member.id, taskId, dateStr, completed: true, setsData: setsData || null },
      update: { completed: true, setsData: setsData || null },
    });
  } else {
    await prisma.workoutLog.deleteMany({ where: { taskId, dateStr, memberId: member.id } });
  }

  revalidatePath("/member/dashboard");
  revalidatePath("/member/progress");
  return { success: true };
}

export async function getWorkoutProgress(userId: string) {
  const member = await prisma.memberProfile.findFirst({ where: { userId } });
  if (!member) return [];

  const logs = await prisma.workoutLog.findMany({
    where: { memberId: member.id, completed: true },
    orderBy: { dateStr: "asc" }
  });

  const last7 = getUTCDatesLastNDays(7);
  const counts: Record<string, number> = {};
  last7.forEach(d => counts[d] = 0);

  logs.forEach(l => {
    if (counts.hasOwnProperty(l.dateStr)) {
      counts[l.dateStr] += 1;
    }
  });

  return last7.map(date => ({ date, count: counts[date] || 0 }));
}

export async function getWorkoutSetsProgress(userId: string) {
  const member = await prisma.memberProfile.findFirst({ where: { userId } });
  if (!member) return [];

  const logs = await prisma.workoutLog.findMany({
    where: { memberId: member.id, setsData: { not: null }, completed: true },
    include: { task: true },
    orderBy: { dateStr: "asc" }
  });

  const progressData = logs.map(l => {
    let maxWeight = 0;
    try {
      if (l.setsData) {
        const sets = JSON.parse(l.setsData);
        if (Array.isArray(sets)) {
          const weights = sets.map((s: any) => Number(s.weight) || 0).filter((w: number) => w > 0);
          maxWeight = weights.length ? Math.max(...weights) : 0;
        }
      }
    } catch {}
    return { dateStr: l.dateStr, exerciseName: l.task.exerciseName, maxWeight, taskId: l.taskId };
  }).filter(p => p.maxWeight > 0);

  return progressData;
}

export async function getMemberWorkoutHistory(memberId: string) {
  return prisma.workoutRoutine.findMany({
    where: { memberId },
    include: { tasks: { include: { logs: { orderBy: { dateStr: "desc" } } } } },
    orderBy: { createdAt: "desc" },
  });
}

// Helper for member dashboard to get today's string in UTC
export async function getTodayDateStr() {
  return getTodayUTCStr();
}

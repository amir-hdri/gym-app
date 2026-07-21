"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const taskSchema = z.object({
  exerciseName: z.string().min(1, "نام حرکت الزامی است"),
  sets: z.coerce.number().min(1).default(3),
  reps: z.string().min(1).default("12"),
  notes: z.string().optional(),
});

export async function getWorkoutRoutine(userId: string) {
  // Find member profile by userId or directly by memberId
  const member = await prisma.memberProfile.findFirst({
    where: {
      OR: [
        { userId: userId },
        { id: userId }
      ]
    }
  });

  if (!member) return null;

  const routine = await prisma.workoutRoutine.findFirst({
    where: { memberId: member.id, isActive: true },
    include: {
      tasks: {
        include: {
          logs: {
            where: { memberId: member.id }
          }
        }
      }
    }
  });

  return routine;
}

export async function createOrUpdateWorkoutRoutine(
  memberId: string, 
  title: string, 
  tasks: Array<{ exerciseName: string; sets: number; reps: string; notes?: string }>
) {
  const verifiedTasks = tasks.map(t => taskSchema.parse(t));

  // Find or create routine
  let routine = await prisma.workoutRoutine.findFirst({
    where: { memberId, isActive: true }
  });

  if (routine) {
    // Update existing routine
    await prisma.$transaction([
      prisma.workoutRoutine.update({
        where: { id: routine.id },
        data: { title }
      }),
      // Delete old tasks (cascade logs delete)
      prisma.workoutTask.deleteMany({
        where: { routineId: routine.id }
      }),
      // Create new tasks
      prisma.workoutTask.createMany({
        data: verifiedTasks.map(t => ({
          routineId: routine!.id,
          exerciseName: t.exerciseName,
          sets: t.sets,
          reps: t.reps,
          notes: t.notes || null,
        }))
      })
    ]);
  } else {
    // Create new routine
    routine = await prisma.workoutRoutine.create({
      data: {
        memberId,
        title,
        isActive: true,
      }
    });

    await prisma.workoutTask.createMany({
      data: verifiedTasks.map(t => ({
        routineId: routine!.id,
        exerciseName: t.exerciseName,
        sets: t.sets,
        reps: t.reps,
        notes: t.notes || null,
      }))
    });
  }

  revalidatePath("/member/dashboard");
  revalidatePath(`/manager/members`);
  return { success: true };
}

export async function toggleWorkoutTaskLog(
  taskId: string,
  userId: string,
  dateStr: string,
  completed: boolean,
  setsData?: string
) {
  const member = await prisma.memberProfile.findFirstOrThrow({
    where: { userId }
  });

  if (completed) {
    await prisma.workoutLog.upsert({
      where: {
        taskId_dateStr: { taskId, dateStr }
      },
      create: {
        memberId: member.id,
        taskId,
        dateStr,
        completed: true,
        setsData: setsData || null,
      },
      update: {
        completed: true,
        setsData: setsData || null,
      }
    });
  } else {
    await prisma.workoutLog.deleteMany({
      where: {
        taskId,
        dateStr
      }
    });
  }

  revalidatePath("/member/dashboard");
  revalidatePath("/member/progress");
  return { success: true };
}

export async function getWorkoutProgress(userId: string) {
  const member = await prisma.memberProfile.findFirst({
    where: { userId }
  });

  if (!member) return [];

  // Group task completions by dateStr
  const logs = await prisma.workoutLog.findMany({
    where: { memberId: member.id },
    orderBy: { dateStr: "asc" }
  });

  // Ensure last 7 days are represented
  const counts: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-CA");
    counts[dateStr] = 0;
  }

  // Populate from database logs
  logs.forEach(l => {
    counts[l.dateStr] = (counts[l.dateStr] || 0) + 1;
  });

  // Format and sort for charts
  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getWorkoutSetsProgress(userId: string) {
  const member = await prisma.memberProfile.findFirst({
    where: { userId }
  });

  if (!member) return [];

  // Query logs that have setsData filled in
  const logs = await prisma.workoutLog.findMany({
    where: {
      memberId: member.id,
      setsData: { not: null }
    },
    include: {
      task: true
    },
    orderBy: { dateStr: "asc" }
  });

  // Extract exercise progress data
  const progressData = logs.map(l => {
    let maxWeight = 0;
    try {
      if (l.setsData) {
        const sets = JSON.parse(l.setsData);
        if (Array.isArray(sets)) {
          maxWeight = Math.max(...sets.map((s: any) => s.weight || 0));
        }
      }
    } catch (e) {}

    return {
      dateStr: l.dateStr,
      exerciseName: l.task.exerciseName,
      maxWeight
    };
  });

  return progressData;
}

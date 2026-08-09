"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const routineSchema = z.object({
  memberId: z.string().min(1, "انتخاب ورزشکار الزامی است"),
  title: z.string().min(2, "عنوان برنامه الزامی است"),
  difficulty: z.string().optional(),
  goal: z.string().optional(),
  description: z.string().optional(),
  trainerNote: z.string().optional(),
  scheduledDays: z.string().optional(),
  scheduledTime: z.string().optional(),
  tasks: z.array(
    z.object({
      exerciseName: z.string().min(1, "نام حرکت الزامی است"),
      sets: z.coerce.number().min(1).default(3),
      reps: z.string().min(1).default("12"),
      notes: z.string().optional(),
    })
  ).min(1, "حداقل یک حرکت باید وارد شود"),
});

const progressSchema = z.object({
  memberId: z.string().min(1, "شناسه ورزشکار الزامی است"),
  metricType: z.string().min(1),
  value: z.coerce.number().positive("مقدار باید عددی مثبت باشد"),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export async function getTrainerContext() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = (session.user as any)?.role;
  if (!isStaff(role)) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { staffProfile: true },
  });

  // If user is a trainer or manager, get their staff profile
  let staffProfile = user?.staffProfile;
  if (!staffProfile) {
    staffProfile = await prisma.staffProfile.findFirst({
      where: { userId: session.user.id },
    });
  }

  // If still not found (e.g. mock manager without explicit staff profile), find or fallback to first staff profile
  if (!staffProfile) {
    staffProfile = await prisma.staffProfile.findFirst();
  }

  return {
    user,
    staffProfile,
  };
}

export async function getTrainerDashboardData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const role = (session.user as any)?.role;
  if (!isStaff(role)) throw new Error("عدم دسترسی به پنل مربی");

  const context = await getTrainerContext();
  const staffId = context?.staffProfile?.id;

  // 1. Get assigned members
  const assignments = await prisma.trainerAssignment.findMany({
    where: staffId ? { trainerId: staffId, active: true } : { active: true },
    include: {
      member: {
        include: {
          user: true,
          subscriptions: {
            include: { plan: true },
            where: { status: "ACTIVE" },
            take: 1,
          },
          workoutRoutines: {
            where: { isActive: true },
            include: { tasks: true },
            take: 1,
          },
          progressEntries: {
            orderBy: { measuredAt: "desc" },
            take: 3,
          },
          attendance: {
            orderBy: { checkInAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Get trainer's classes
  const classes = await prisma.classSession.findMany({
    where: staffId ? { trainerId: staffId } : {},
    include: {
      bookings: {
        include: {
          member: {
            include: { user: true },
          },
        },
      },
    },
    orderBy: { startAt: "asc" },
  });

  // 3. Get all active workout routines for assigned members
  const memberIds = assignments.map((a: any) => a.member?.id).filter(Boolean);
  const routines = await prisma.workoutRoutine.findMany({
    where: {
      memberId: { in: memberIds },
      isActive: true,
    },
    include: {
      tasks: true,
      member: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 4. Get recent progress entries
  const recentProgress = await prisma.progressEntry.findMany({
    where: memberIds.length ? { memberId: { in: memberIds } } : {},
    include: {
      member: {
        include: { user: true },
      },
    },
    orderBy: { measuredAt: "desc" },
    take: 10,
  });

  // 5. All available members for assignment/routine creation
  const allMembers = await prisma.memberProfile.findMany({
    include: { user: true },
  });

  return {
    trainer: context?.user,
    staffProfile: context?.staffProfile,
    assignments,
    classes,
    routines,
    recentProgress,
    allMembers,
    stats: {
      activeAthletesCount: assignments.length,
      activeRoutinesCount: routines.length,
      upcomingClassesCount: classes.filter((c: any) => new Date(c.startAt) > new Date()).length,
      recentProgressCount: recentProgress.length,
    },
  };
}

export async function createTrainerWorkoutRoutine(rawInput: z.infer<typeof routineSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const role = (session.user as any)?.role;
  if (!isStaff(role)) throw new Error("فقط مربیان و مدیران مجاز به ثبت برنامه هستند");

  const data = routineSchema.parse(rawInput);

  // Archive previous active routine if exists
  await prisma.workoutRoutine.updateMany({
    where: { memberId: data.memberId, isActive: true },
    data: { isActive: false },
  });

  const routine = await prisma.workoutRoutine.create({
    data: {
      memberId: data.memberId,
      title: data.title.trim(),
      difficulty: data.difficulty || "متوسط",
      goal: data.goal || "تناسب اندام",
      description: data.description || null,
      trainerNote: data.trainerNote || null,
      scheduledDays: data.scheduledDays || "شنبه، دوشنبه، چهارشنبه",
      scheduledTime: data.scheduledTime || "18:00",
      isActive: true,
    },
  });

  await prisma.workoutTask.createMany({
    data: data.tasks.map((t) => ({
      routineId: routine.id,
      exerciseName: t.exerciseName.trim(),
      sets: Number(t.sets),
      reps: t.reps.trim(),
      notes: t.notes?.trim() || null,
    })),
  });

  // Create notification for member
  const member = await prisma.memberProfile.findUnique({
    where: { id: data.memberId },
    select: { userId: true },
  });
  if (member?.userId) {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        channel: "IN_APP",
        type: "WORKOUT",
        title: "برنامه تمرینی جدید دریافت شد 🏋️‍♂️",
        body: `مربی شما برنامه تمرینی «${data.title}» را برای شما ثبت کرد.`,
      },
    }).catch(() => {});
  }

  revalidatePath("/trainer/dashboard");
  revalidatePath("/trainer/routines");
  revalidatePath("/trainer/members");
  revalidatePath("/member/dashboard");
  revalidatePath("/member/schedule");
  return { success: true, routineId: routine.id };
}

export async function recordTrainerAthleteProgress(rawInput: z.infer<typeof progressSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const role = (session.user as any)?.role;
  if (!isStaff(role)) throw new Error("عدم دسترسی");

  const data = progressSchema.parse(rawInput);
  const context = await getTrainerContext();

  const entry = await prisma.progressEntry.create({
    data: {
      memberId: data.memberId,
      trainerId: context?.staffProfile?.id || null,
      createdByUserId: session.user.id,
      metricType: data.metricType,
      value: data.value,
      unit: data.unit || (data.metricType === "BODY_FAT" ? "%" : "kg"),
      notes: data.notes || null,
      measuredAt: new Date(),
    },
  });

  // Notify member
  const member = await prisma.memberProfile.findUnique({
    where: { id: data.memberId },
    select: { userId: true },
  });
  if (member?.userId) {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        channel: "IN_APP",
        type: "PROGRESS",
        title: "رکورد و پیشرفت جدید ثبت شد 📊",
        body: `رکورد جدید ${data.metricType === "WEIGHT" ? "وزن" : data.metricType === "BODY_FAT" ? "درصد چربی" : data.metricType} به مقدار ${data.value} ثبت گردید.`,
      },
    }).catch(() => {});
  }

  revalidatePath("/trainer/dashboard");
  revalidatePath("/trainer/progress");
  revalidatePath("/trainer/members");
  revalidatePath("/member/progress");
  revalidatePath("/member/dashboard");
  return entry;
}

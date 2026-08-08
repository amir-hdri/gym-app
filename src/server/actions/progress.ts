"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const progressSchema = z.object({
  metricType: z.string().min(1),
  value: z.coerce.number(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export async function addProgressEntry(metricType: string, value: number, unit?: string, notes?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const parsed = progressSchema.parse({ metricType, value, unit, notes });

  if (isNaN(parsed.value) || parsed.value <= 0) {
    throw new Error("مقدار باید عدد مثبت باشد");
  }

  const allowedTypes = ["WEIGHT", "BODY_FAT", "CHEST", "WAIST", "ARM", "THIGH", "BENCH_PRESS", "SQUAT", "DEADLIFT", "CUSTOM"];
  if (!allowedTypes.includes(parsed.metricType)) {
    throw new Error("نوع شاخص نامعتبر است");
  }

  const member = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { memberProfile: true },
  });

  if (!member?.memberProfile) {
    throw new Error("پروفایل عضو یافت نشد");
  }

  const entry = await prisma.progressEntry.create({
    data: {
      memberId: member.memberProfile.id,
      createdByUserId: session.user.id,
      metricType: parsed.metricType,
      value: parsed.value,
      unit: parsed.unit || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/member/progress");
  revalidatePath("/member/dashboard");
  return entry;
}

export async function getProgressEntries() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const member = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberProfile: {
        include: {
          progressEntries: { orderBy: { measuredAt: "desc" } }
        }
      }
    }
  });

  return member?.memberProfile?.progressEntries || [];
}

export async function deleteProgressEntry(entryId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const member = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { memberProfile: true },
  });
  if (!member?.memberProfile) throw new Error("پروفایل یافت نشد");

  const entry = await prisma.progressEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.memberId !== member.memberProfile.id) {
    throw new Error("رکورد یافت نشد یا عدم دسترسی");
  }

  await prisma.progressEntry.delete({ where: { id: entryId } });
  revalidatePath("/member/progress");
  return { success: true };
}

export async function getProgressStats(userId: string) {
  const member = await prisma.memberProfile.findFirst({ where: { userId } });
  if (!member) return null;

  const entries = await prisma.progressEntry.findMany({
    where: { memberId: member.id },
    orderBy: { measuredAt: "asc" },
  });

  const grouped: Record<string, typeof entries> = {};
  entries.forEach(e => {
    if (!grouped[e.metricType]) grouped[e.metricType] = [];
    grouped[e.metricType].push(e);
  });

  return grouped;
}

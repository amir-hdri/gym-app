"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addProgressEntry(metricType: string, value: number, unit?: string, notes?: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const member = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { memberProfile: true },
  });

  if (!member?.memberProfile) {
    throw new Error("Member profile not found");
  }

  const entry = await prisma.progressEntry.create({
    data: {
      memberId: member.memberProfile.id,
      createdByUserId: session.user.id,
      metricType,
      value,
      unit: unit || null,
      notes: notes || null,
    },
  });

  revalidatePath("/member/progress");
  return entry;
}

export async function getProgressEntries() {
  const session = await auth();
  if (!session?.user) return [];

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

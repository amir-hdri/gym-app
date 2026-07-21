"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createClassSession(data: {
  title: string;
  description?: string;
  trainerName: string;
  startAt: string; // ISO String
  endAt: string; // ISO String
  capacity?: number;
  location?: string;
}) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  const cls = await prisma.classSession.create({
    data: {
      title: data.title,
      description: data.description || null,
      trainerName: data.trainerName,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      capacity: data.capacity ? Number(data.capacity) : null,
      location: data.location || null,
    }
  });

  revalidatePath("/manager/classes");
  revalidatePath("/member/bookings");
  return cls;
}

export async function listClassSessions() {
  return prisma.classSession.findMany({
    include: {
      bookings: {
        include: {
          member: {
            include: { user: true }
          }
        }
      }
    },
    orderBy: { startAt: "asc" }
  });
}

export async function bookClassSession(classSessionId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const member = await prisma.memberProfile.findFirst({
    where: { userId: session.user.id }
  });

  if (!member) {
    throw new Error("Member profile not found");
  }

  // Check if already booked
  const existing = await prisma.classBooking.findUnique({
    where: {
      classSessionId_memberId: {
        classSessionId,
        memberId: member.id
      }
    }
  });

  if (existing) {
    if (existing.status === "BOOKED") {
      throw new Error("شما این کلاس را قبلاً رزرو کرده‌اید");
    }
    
    await prisma.classBooking.update({
      where: { id: existing.id },
      data: { status: "BOOKED", canceledAt: null }
    });
  } else {
    // Check capacity limit
    const classSession = await prisma.classSession.findUnique({
      where: { id: classSessionId },
      include: { bookings: { where: { status: "BOOKED" } } }
    });

    if (!classSession) {
      throw new Error("کلاس یافت نشد");
    }

    if (classSession.capacity && classSession.bookings.length >= classSession.capacity) {
      throw new Error("ظرفیت کلاس تکمیل شده است");
    }

    await prisma.classBooking.create({
      data: {
        classSessionId,
        memberId: member.id,
        status: "BOOKED"
      }
    });
  }

  revalidatePath("/member/bookings");
  revalidatePath("/manager/classes");
  return { success: true };
}

export async function cancelClassBooking(classSessionId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const member = await prisma.memberProfile.findFirst({
    where: { userId: session.user.id }
  });

  if (!member) {
    throw new Error("Member profile not found");
  }

  await prisma.classBooking.delete({
    where: {
      classSessionId_memberId: {
        classSessionId,
        memberId: member.id
      }
    }
  });

  revalidatePath("/member/bookings");
  revalidatePath("/manager/classes");
  return { success: true };
}

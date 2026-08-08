"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isManager } from "@/lib/permissions";

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
  if (!user || !isManager(user.role)) {
    throw new Error("عدم دسترسی - فقط مدیران می‌توانند کلاس ایجاد کنند");
  }

  const start = new Date(data.startAt);
  const end = new Date(data.endAt);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("تاریخ نامعتبر");
  }
  if (end <= start) {
    throw new Error("زمان پایان باید بعد از زمان شروع باشد");
  }

  // Determine branch from user
  const branchId = user.branchId || null;

  const cls = await prisma.classSession.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      trainerName: data.trainerName.trim(),
      startAt: start,
      endAt: end,
      capacity: data.capacity ? Number(data.capacity) : null,
      location: data.location?.trim() || null,
      branchId,
      trainerId: null, // could link to staff if needed
    }
  });

  revalidatePath("/manager/classes");
  revalidatePath("/member/bookings");
  return cls;
}

export async function updateClassSession(id: string, data: Partial<{
  title: string;
  description: string;
  trainerName: string;
  capacity: number;
  location: string;
  status: string;
}>) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || !isManager(user.role)) throw new Error("Unauthorized");

  const cls = await prisma.classSession.update({
    where: { id },
    data: {
      title: data.title?.trim(),
      description: data.description?.trim(),
      trainerName: data.trainerName?.trim(),
      capacity: data.capacity,
      location: data.location?.trim(),
      status: data.status,
    },
  });

  revalidatePath("/manager/classes");
  revalidatePath("/member/bookings");
  return cls;
}

export async function deleteClassSession(id: string) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || !isManager(user.role)) throw new Error("Unauthorized");

  await prisma.classSession.delete({ where: { id } });
  revalidatePath("/manager/classes");
  revalidatePath("/member/bookings");
  return { success: true };
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

export async function listUpcomingClasses(limit = 20) {
  return prisma.classSession.findMany({
    where: { startAt: { gte: new Date() }, status: { not: "canceled" } },
    include: {
      bookings: { where: { status: "BOOKED" } },
    },
    orderBy: { startAt: "asc" },
    take: limit,
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
    throw new Error("پروفایل عضو یافت نشد");
  }

  // Check active subscription
  const activeSub = await prisma.subscription.findFirst({
    where: { memberId: member.id, status: "ACTIVE" },
  });
  if (!activeSub) {
    throw new Error("برای رزرو کلاس نیاز به اشتراک فعال دارید");
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
    // Check capacity limit with transaction-like approach
    const classSession = await prisma.classSession.findUnique({
      where: { id: classSessionId },
      include: { bookings: { where: { status: "BOOKED" } } }
    });

    if (!classSession) {
      throw new Error("کلاس یافت نشد");
    }

    if (classSession.status === "canceled") {
      throw new Error("این کلاس لغو شده است");
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

  // Use update to mark canceled rather than delete to keep history, but current uses delete for simplicity
  try {
    await prisma.classBooking.delete({
      where: {
        classSessionId_memberId: {
          classSessionId,
          memberId: member.id
        }
      }
    });
  } catch (e) {
    // If not found via composite, try update
    const booking = await prisma.classBooking.findFirst({
      where: { classSessionId, memberId: member.id }
    });
    if (booking) {
      await prisma.classBooking.update({
        where: { id: booking.id },
        data: { status: "CANCELED", canceledAt: new Date() }
      });
    }
  }

  revalidatePath("/member/bookings");
  revalidatePath("/manager/classes");
  return { success: true };
}

export async function getClassAttendees(classSessionId: string) {
  return prisma.classBooking.findMany({
    where: { classSessionId, status: "BOOKED" },
    include: { member: { include: { user: true } } },
  });
}
